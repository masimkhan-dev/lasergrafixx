import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, ArrowUpRight, Banknote, ReceiptText, WalletCards } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SaleDetailDialog } from "@/components/admin/SaleDetailDialog";
import { supabase } from "@/integrations/supabase/client";
import { pkr, timeOnly } from "@/lib/format";
import { fetchSales, startOfTodayIso, statusTone } from "@/lib/pos";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Laser Grafix POS" },
      { name: "description", content: "Today's sales, payments received, expenses and outstanding balances." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Dashboard — Laser Grafix POS" },
      { property: "og:description", content: "Daily clinic performance at a glance." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const navigate = useNavigate();
  const [openSale, setOpenSale] = useState<string | null>(null);
  const today = startOfTodayIso();

  const stats = useQuery({
    queryKey: ["dashboard", today],
    queryFn: async () => {
      const [salesRes, paymentsRes, expensesRes, outstandingRes] = await Promise.all([
        supabase
          .from("sales")
          .select("total")
          .gte("created_at", today)
          .neq("payment_status", "voided"),
        supabase.from("payments").select("amount, sales!inner(payment_status)").gte("paid_at", today).neq("sales.payment_status", "voided"),
        supabase
          .from("expenses")
          .select("amount")
          .gte("expense_date", today.slice(0, 10)),
        supabase
          .from("sales")
          .select("remaining_amount")
          .neq("payment_status", "voided")
          .gt("remaining_amount", 0),
      ]);
      const sum = (rows: { [k: string]: unknown }[] | null, key: string) =>
        (rows ?? []).reduce((acc, r) => acc + Number(r[key] ?? 0), 0);
      return {
        sales: sum(salesRes.data, "total"),
        received: sum(paymentsRes.data, "amount"),
        expenses: sum(expensesRes.data, "amount"),
        outstanding: sum(outstandingRes.data, "remaining_amount"),
      };
    },
  });

  const recent = useQuery({
    queryKey: ["sales", "recent"],
    queryFn: () => fetchSales({ limit: 5 }),
  });

  const cards = [
    { label: "Today's Sales", value: stats.data?.sales, tone: "text-pos-text", icon: ArrowUpRight },
    { label: "Today's Received", value: stats.data?.received, tone: "text-success", icon: Banknote },
    { label: "Today's Expenses", value: stats.data?.expenses, tone: "text-destructive", icon: ReceiptText },
    { label: "Outstanding", value: stats.data?.outstanding, tone: "text-warning-foreground", icon: WalletCards },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-lg border border-pos-border bg-pos-card p-6 shadow-card"
          >
            <div className="flex items-center justify-between gap-4">
              <p className="text-xs font-semibold text-pos-text-muted uppercase">{card.label}</p>
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-lotus-aqua text-lotus-charcoal">
                <card.icon className="h-4 w-4" />
              </span>
            </div>
            <p className={`tabular mt-3 text-2xl ${card.tone}`}>
              {stats.isLoading ? "…" : pkr(card.value ?? 0)}
            </p>
          </div>
        ))}
      </div>

      <Button
        className="h-20 w-full bg-primary text-lg font-semibold text-primary-foreground hover:bg-primary-hover"
        onClick={() => navigate({ to: "/admin/new-sale" })}
      >
        <Plus className="mr-2 h-6 w-6" /> NEW SALE
      </Button>

      <div className="rounded-lg border border-pos-border bg-pos-card shadow-card">
        <div className="border-b border-pos-border px-6 py-4">
          <h2 className="font-sans text-base font-semibold">Recent Sales</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs tracking-wide text-pos-text-muted uppercase">
              <tr>
                <th className="px-6 py-3">Time</th>
                <th className="px-6 py-3">Customer</th>
                <th className="px-6 py-3">Total</th>
                <th className="px-6 py-3">Paid</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {(recent.data?.rows ?? []).map((sale) => (
                <tr
                  key={sale.id}
                  onClick={() => setOpenSale(sale.id)}
                  className="cursor-pointer border-t border-pos-border hover:bg-pos-bg"
                >
                  <td className="px-6 py-3">{timeOnly(sale.created_at)}</td>
                  <td className="px-6 py-3">{sale.customers?.name ?? "Walk-in"}</td>
                  <td className="tabular px-6 py-3">{pkr(sale.total)}</td>
                  <td className="tabular px-6 py-3">{pkr(sale.paid_amount)}</td>
                  <td className="px-6 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase ${statusTone(sale.payment_status)}`}
                    >
                      {sale.payment_status}
                    </span>
                  </td>
                </tr>
              ))}
              {!recent.isLoading && (recent.data?.rows.length ?? 0) === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-pos-text-muted">
                    No sales yet — start with a new sale.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <SaleDetailDialog saleId={openSale} onOpenChange={(open) => !open && setOpenSale(null)} />
    </div>
  );
}
