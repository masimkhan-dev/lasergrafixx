import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SaleDetailDialog } from "@/components/admin/SaleDetailDialog";
import { dateTime, pkr } from "@/lib/format";
import { fetchSales, statusTone } from "@/lib/pos";

export const Route = createFileRoute("/_authenticated/admin/sales")({
  head: () => ({
    meta: [
      { title: "Sales History — Laser Grafix POS" },
      { name: "description", content: "Search, filter and review every clinic sale and payment." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Sales History — Laser Grafix POS" },
      { property: "og:description", content: "Full record of clinic sales with payment status." },
    ],
  }),
  component: SalesHistory,
});

const PAGE_SIZE = 20;

function SalesHistory() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [openSale, setOpenSale] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ["sales", { from, to, status, search, page }],
    queryFn: () =>
      fetchSales({
        ...(from ? { from } : {}),
        ...(to ? { to } : {}),
        ...(status !== "all" ? { status } : {}),
        ...(search ? { search } : {}),
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
      }),
  });

  const total = query.data?.count ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-5">
      <div className="grid gap-4 rounded-xl border border-pos-border bg-pos-card p-5 shadow-card sm:grid-cols-2 xl:grid-cols-4">
        <div className="space-y-2">
          <Label htmlFor="from">From</Label>
          <Input
            id="from"
            type="date"
            value={from}
            onChange={(e) => {
              setFrom(e.target.value);
              setPage(0);
            }}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="to">To</Label>
          <Input
            id="to"
            type="date"
            value={to}
            onChange={(e) => {
              setTo(e.target.value);
              setPage(0);
            }}
          />
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Select
            value={status}
            onValueChange={(value) => {
              setStatus(value);
              setPage(0);
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="partial">Partial</SelectItem>
              <SelectItem value="unpaid">Unpaid</SelectItem>
              <SelectItem value="voided">Voided</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="q">Search</Label>
          <Input
            id="q"
            placeholder="Sale number, e.g. LG-00012"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-pos-border bg-pos-card shadow-card">
        <table className="w-full text-sm">
          <thead className="text-left text-xs tracking-wide text-pos-text-muted uppercase">
            <tr>
              <th className="px-5 py-3">Sale #</th>
              <th className="px-5 py-3">Date</th>
              <th className="px-5 py-3">Customer</th>
              <th className="px-5 py-3">Total</th>
              <th className="px-5 py-3">Paid</th>
              <th className="px-5 py-3">Remaining</th>
              <th className="px-5 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {(query.data?.rows ?? []).map((sale) => (
              <tr
                key={sale.id}
                onClick={() => setOpenSale(sale.id)}
                className="cursor-pointer border-t border-pos-border hover:bg-pos-bg"
              >
                <td className="tabular px-5 py-3">{sale.sale_number}</td>
                <td className="px-5 py-3">{dateTime(sale.created_at)}</td>
                <td className="px-5 py-3">{sale.customers?.name ?? "Walk-in"}</td>
                <td className="tabular px-5 py-3">{pkr(sale.total)}</td>
                <td className="tabular px-5 py-3">{pkr(sale.paid_amount)}</td>
                <td className="tabular px-5 py-3">{pkr(sale.remaining_amount)}</td>
                <td className="px-5 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase ${statusTone(sale.payment_status)}`}
                  >
                    {sale.payment_status}
                  </span>
                </td>
              </tr>
            ))}
            {!query.isLoading && (query.data?.rows.length ?? 0) === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-pos-text-muted">
                  No sales match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-pos-text-muted">
        <span>
          {total} sale{total === 1 ? "" : "s"} · page {page + 1} of {pages}
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page + 1 >= pages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </div>

      <SaleDetailDialog saleId={openSale} onOpenChange={(open) => !open && setOpenSale(null)} />
    </div>
  );
}
