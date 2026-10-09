import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Printer, Lock, Banknote, CreditCard, Smartphone, ReceiptText } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ZReport } from "@/components/admin/ZReport";
import { supabase } from "@/integrations/supabase/client";
import { pkr } from "@/lib/format";
import { printSheet } from "@/lib/print";
import {
  fetchClosing,
  fetchDaySummary,
  settingsQuery,
  todayLocal,
  type DailyClosing,
} from "@/lib/pos";
import { useStaff } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/admin/day-end")({
  head: () => ({
    meta: [
      { title: "Day End — Laser Grafix POS" },
      {
        name: "description",
        content: "Close the reception cash drawer and print the daily Z-Report summary.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Day End — Laser Grafix POS" },
      { property: "og:description", content: "Daily cash closing for the clinic counter." },
    ],
  }),
  component: DayEnd,
});

function DayEnd() {
  const queryClient = useQueryClient();
  const { profile, email } = useStaff();
  const [date, setDate] = useState(todayLocal);
  const [opening, setOpening] = useState("0");
  const [counted, setCounted] = useState("");
  const [notes, setNotes] = useState("");

  const settings = useQuery(settingsQuery);

  const summary = useQuery({
    queryKey: ["day-summary", date],
    queryFn: () => fetchDaySummary(date),
  });

  const closing = useQuery({
    queryKey: ["daily-closing", date],
    queryFn: () => fetchClosing(date),
  });

  // Pre-fill the form from an existing closing for the selected day.
  useEffect(() => {
    const row = closing.data;
    if (!row) return;
    setOpening(String(Math.round(Number(row.opening_cash))));
    setCounted(String(Math.round(Number(row.counted_cash))));
    setNotes(row.notes ?? "");
  }, [closing.data]);

  const openingCash = Number(opening) || 0;
  const countedCash = counted === "" ? null : Number(counted) || 0;
  const s = summary.data;
  const expected = openingCash + Number(s?.cash_sales ?? 0) - Number(s?.cash_expenses ?? 0);
  const difference = countedCash === null ? null : countedCash - expected;

  const close = useMutation({
    mutationFn: async () => {
      if (countedCash === null) throw new Error("Enter the cash you counted in the drawer");
      if (countedCash < 0 || openingCash < 0) throw new Error("Amounts cannot be negative");
      const { error } = await supabase.rpc("close_day", {
        p_date: date,
        p_opening_cash: openingCash,
        p_counted_cash: countedCash,
        ...(notes.trim() ? { p_notes: notes.trim() } : {}),
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Day closed — Z-Report ready");
      await queryClient.invalidateQueries({ queryKey: ["daily-closing", date] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const saved: DailyClosing | null = closing.data ?? null;
  const staffName = profile?.full_name || email || "Staff";

  const rows = [
    { label: "Cash received", value: s?.cash_sales, icon: Banknote },
    { label: "Card received", value: s?.card_total, icon: CreditCard },
    { label: "Digital received", value: s?.digital_total, icon: Smartphone },
    { label: "Cash expenses", value: s?.cash_expenses, icon: ReceiptText },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <Label htmlFor="d-date">Day</Label>
          <Input
            id="d-date"
            type="date"
            className="w-48"
            value={date}
            max={todayLocal()}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div className="text-right">
          <p className="text-xs text-pos-text-muted uppercase">Sales this day</p>
          <p className="tabular text-xl">
            {summary.isLoading ? "…" : `${pkr(s?.sales_total ?? 0)} · ${s?.sales_count ?? 0}`}
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {rows.map((r) => (
          <div key={r.label} className="rounded-lg border border-pos-border bg-pos-card p-5 shadow-card">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold text-pos-text-muted uppercase">{r.label}</p>
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-lotus-aqua text-lotus-charcoal">
                <r.icon className="h-4 w-4" />
              </span>
            </div>
            <p className="tabular mt-3 text-2xl">{summary.isLoading ? "…" : pkr(r.value ?? 0)}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="space-y-4 rounded-lg border border-pos-border bg-pos-card p-6 shadow-card">
          <h2 className="font-sans text-base font-semibold">Cash drawer</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="d-opening">Opening cash (morning)</Label>
              <Input
                id="d-opening"
                inputMode="numeric"
                value={opening}
                onChange={(e) => setOpening(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="d-counted">Counted cash (evening)</Label>
              <Input
                id="d-counted"
                inputMode="numeric"
                placeholder="Count the drawer"
                value={counted}
                onChange={(e) => setCounted(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2 rounded-lg border border-pos-border bg-pos-bg p-4 text-sm">
            <div className="flex justify-between">
              <span>Opening cash</span>
              <span className="tabular">{pkr(openingCash)}</span>
            </div>
            <div className="flex justify-between">
              <span>+ Cash received</span>
              <span className="tabular">{pkr(s?.cash_sales ?? 0)}</span>
            </div>
            <div className="flex justify-between">
              <span>− Cash expenses</span>
              <span className="tabular">{pkr(s?.cash_expenses ?? 0)}</span>
            </div>
            <div className="flex justify-between border-t border-pos-border pt-2 font-semibold">
              <span>Expected in drawer</span>
              <span className="tabular">{pkr(expected)}</span>
            </div>
            {difference !== null && (
              <div
                className={`flex justify-between font-semibold ${
                  difference === 0
                    ? "text-success"
                    : difference > 0
                      ? "text-warning-foreground"
                      : "text-destructive"
                }`}
              >
                <span>
                  {difference === 0 ? "Balanced" : difference > 0 ? "Surplus" : "Shortage"}
                </span>
                <span className="tabular">{pkr(Math.abs(difference))}</span>
              </div>
            )}
          </div>

          <Textarea
            rows={2}
            placeholder="Notes (optional) — e.g. cash handed to owner"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <Button
            className="h-12 w-full bg-primary text-base font-semibold text-primary-foreground hover:bg-primary-hover"
            disabled={close.isPending || summary.isLoading}
            onClick={() => close.mutate()}
          >
            <Lock className="mr-2 h-5 w-5" />
            {saved ? "Update closing" : "Close day"}
          </Button>
        </div>

        <div className="space-y-3 rounded-lg border border-pos-border bg-pos-card p-6 shadow-card">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-sans text-base font-semibold">Z-Report</h2>
            <Button
              variant="outline"
              disabled={!saved}
              onClick={() => printSheet("thermal", ".z-report-sheet")}
            >
              <Printer className="mr-2 h-4 w-4" /> Print 80mm
            </Button>
          </div>

          {saved ? (
            <div className="flex justify-center overflow-x-auto">
              <div className="w-[80mm] shrink-0 rounded-sm bg-white px-3 py-4 shadow-lg ring-1 ring-black/5">
                <ZReport closing={saved} settings={settings.data ?? {}} staffName={staffName} />
              </div>
            </div>
          ) : (
            <p className="py-10 text-center text-sm text-pos-text-muted">
              Close the day to generate the printable summary.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
