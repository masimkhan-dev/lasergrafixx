import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { EXPENSE_CATEGORIES, dateOnly, pkr } from "@/lib/format";
import type { Expense } from "@/lib/pos";
import { useStaff } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/admin/expenses")({
  head: () => ({
    meta: [
      { title: "Expenses — Laser Grafix POS" },
      { name: "description", content: "Record and review clinic expenses by month and category." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Expenses — Laser Grafix POS" },
      { property: "og:description", content: "Monthly clinic spending overview." },
    ],
  }),
  component: Expenses,
});

function monthBounds(month: string) {
  const start = `${month}-01`;
  const year = Number(month.slice(0, 4));
  const monthIndex = Number(month.slice(5, 7));
  const end = new Date(Date.UTC(year, monthIndex, 1)).toISOString().slice(0, 10);
  return { start, end };
}

function Expenses() {
  const queryClient = useQueryClient();
  const { isAdmin } = useStaff();
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>(EXPENSE_CATEGORIES[0]);
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");

  const expenses = useQuery({
    queryKey: ["expenses", month],
    queryFn: async () => {
      const { start, end } = monthBounds(month);
      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .gte("expense_date", start)
        .lt("expense_date", end)
        .order("expense_date", { ascending: false });
      if (error) throw error;
      return data as Expense[];
    },
  });

  const monthTotal = (expenses.data ?? []).reduce((acc, e) => acc + Number(e.amount), 0);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["expenses"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  };

  const save = useMutation({
    mutationFn: async () => {
      const value = Number(amount);
      if (!title.trim()) throw new Error("Title is required");
      if (!value || value <= 0) throw new Error("Enter a valid amount");
      const { error } = await supabase.from("expenses").insert({
        title: title.trim(),
        category,
        amount: value,
        expense_date: date,
        notes: notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Expense recorded");
      setOpen(false);
      setTitle("");
      setAmount("");
      setNotes("");
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("expenses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Expense deleted");
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-2">
          <Label htmlFor="month">Month</Label>
          <Input
            id="month"
            type="month"
            className="w-44"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs text-pos-text-muted uppercase">Month total</p>
            <p className="tabular text-xl">{pkr(monthTotal)}</p>
          </div>
          <Button
            className="bg-primary text-primary-foreground hover:bg-primary-hover"
            onClick={() => setOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" /> Add Expense
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-pos-border bg-pos-card shadow-card">
        <table className="w-full text-sm">
          <thead className="text-left text-xs tracking-wide text-pos-text-muted uppercase">
            <tr>
              <th className="px-5 py-3">Date</th>
              <th className="px-5 py-3">Title</th>
              <th className="px-5 py-3">Category</th>
              <th className="px-5 py-3">Amount</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(expenses.data ?? []).map((expense) => (
              <tr key={expense.id} className="border-t border-pos-border">
                <td className="px-5 py-3">{dateOnly(expense.expense_date)}</td>
                <td className="px-5 py-3 font-medium">{expense.title}</td>
                <td className="px-5 py-3 text-pos-text-muted">{expense.category}</td>
                <td className="tabular px-5 py-3">{pkr(expense.amount)}</td>
                <td className="px-5 py-3 text-right">
                  {isAdmin && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => remove.mutate(expense.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </td>
              </tr>
            ))}
            {!expenses.isLoading && (expenses.data?.length ?? 0) === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-pos-text-muted">
                  No expenses recorded for this month.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-sans">Add expense</DialogTitle>
            <DialogDescription>Amounts are in Pakistani rupees.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="e-title">Title *</Label>
              <Input id="e-title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="e-amount">Amount *</Label>
                <Input
                  id="e-amount"
                  inputMode="numeric"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="e-date">Date</Label>
              <Input
                id="e-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <Textarea
              rows={2}
              placeholder="Notes (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-primary text-primary-foreground hover:bg-primary-hover"
              disabled={save.isPending}
              onClick={() => save.mutate()}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
