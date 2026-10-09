import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { SaleDetailDialog } from "@/components/admin/SaleDetailDialog";
import { CustomerPackages } from "@/components/admin/CustomerPackages";
import { supabase } from "@/integrations/supabase/client";
import { dateOnly, isValidPkPhone, normalizePhone, pkr } from "@/lib/format";
import { fetchSales, statusTone, type Customer } from "@/lib/pos";
import { useStaff } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/admin/customers")({
  head: () => ({
    meta: [
      { title: "Customers — Laser Grafix POS" },
      { name: "description", content: "Clinic customer records with visit counts and lifetime spend." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Customers — Laser Grafix POS" },
      { property: "og:description", content: "Search customers and review their treatment history." },
    ],
  }),
  component: Customers,
});

type Stats = { customer_id: string; total_visits: number; total_spent: number; last_visit: string | null };

function Customers() {
  const queryClient = useQueryClient();
  const { isAdmin } = useStaff();
  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("");
  const [detail, setDetail] = useState<Customer | null>(null);
  const [openSale, setOpenSale] = useState<string | null>(null);

  const customers = useQuery({
    queryKey: ["customers", search],
    queryFn: async () => {
      let q = supabase.from("customers").select("*").eq("is_active", true).order("name");
      if (search.trim()) q = q.or(`name.ilike.%${search}%,phone.ilike.%${search}%`);
      const { data, error } = await q.limit(200);
      if (error) throw error;
      return data as Customer[];
    },
  });

  const stats = useQuery({
    queryKey: ["customer-stats"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("customer_stats");
      if (error) throw error;
      const map = new Map<string, Stats>();
      (data as Stats[] | null)?.forEach((row) => map.set(row.customer_id, row));
      return map;
    },
  });

  const customerSales = useQuery({
    queryKey: ["sales", "customer", detail?.id],
    enabled: !!detail,
    queryFn: () => fetchSales({ customerId: detail!.id, limit: 50 }),
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!name.trim()) throw new Error("Name is required");
      const phoneTrimmed = phone.trim();
      let normalized: string | null = null;
      if (phoneTrimmed) {
        normalized = normalizePhone(phoneTrimmed);
        if (!isValidPkPhone(normalized)) throw new Error("Phone must look like 03XX-XXXXXXX");
      }
      const { error } = await supabase
        .from("customers")
        .insert({ name: name.trim(), phone: normalized, gender: gender || null });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Customer added");
      setAdding(false);
      setName("");
      setPhone("");
      setGender("");
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("customers").update({ is_active: false }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Customer removed");
      setDetail(null);
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-pos-text-muted" />
          <Input
            className="pl-10"
            placeholder="Search by name or phone"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button
          className="bg-primary text-primary-foreground hover:bg-primary-hover"
          onClick={() => setAdding(true)}
        >
          <UserPlus className="mr-2 h-4 w-4" /> Add Customer
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-pos-border bg-pos-card shadow-card">
        <table className="w-full text-sm">
          <thead className="text-left text-xs tracking-wide text-pos-text-muted uppercase">
            <tr>
              <th className="px-5 py-3">Name</th>
              <th className="px-5 py-3">Phone</th>
              <th className="px-5 py-3">Visits</th>
              <th className="px-5 py-3">Total Spent</th>
              <th className="px-5 py-3">Last Visit</th>
            </tr>
          </thead>
          <tbody>
            {(customers.data ?? []).map((customer) => {
              const s = stats.data?.get(customer.id);
              return (
                <tr
                  key={customer.id}
                  onClick={() => setDetail(customer)}
                  className="cursor-pointer border-t border-pos-border hover:bg-pos-bg"
                >
                  <td className="px-5 py-3 font-medium">{customer.name}</td>
                  <td className="tabular px-5 py-3">{customer.phone || "—"}</td>
                  <td className="tabular px-5 py-3">{s?.total_visits ?? 0}</td>
                  <td className="tabular px-5 py-3">{pkr(s?.total_spent ?? 0)}</td>
                  <td className="px-5 py-3">{s?.last_visit ? dateOnly(s.last_visit) : "—"}</td>
                </tr>
              );
            })}
            {!customers.isLoading && (customers.data?.length ?? 0) === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-pos-text-muted">
                  No customers found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add customer */}
      <Dialog open={adding} onOpenChange={setAdding}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-sans">Add customer</DialogTitle>
            <DialogDescription>Name is required. Phone is optional (03XX-XXXXXXX).</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="c-name">Name *</Label>
              <Input id="c-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-phone">Phone (Optional)</Label>
              <Input
                id="c-phone"
                placeholder="03XX-XXXXXXX (optional)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Gender</Label>
              <Select value={gender} onValueChange={setGender}>
                <SelectTrigger>
                  <SelectValue placeholder="Optional" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAdding(false)}>
              Cancel
            </Button>
            <Button
              className="bg-primary text-primary-foreground hover:bg-primary-hover"
              disabled={create.isPending}
              onClick={() => create.mutate()}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Customer detail */}
      <Dialog open={!!detail} onOpenChange={(open) => !open && setDetail(null)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-sans">{detail?.name}</DialogTitle>
            <DialogDescription>{detail?.phone || "No phone recorded"}</DialogDescription>
          </DialogHeader>

          {detail && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border border-pos-border p-4">
                  <p className="text-xs text-pos-text-muted uppercase">Visits</p>
                  <p className="tabular mt-1 text-xl">{stats.data?.get(detail.id)?.total_visits ?? 0}</p>
                </div>
                <div className="rounded-lg border border-pos-border p-4">
                  <p className="text-xs text-pos-text-muted uppercase">Total spent</p>
                  <p className="tabular mt-1 text-xl">
                    {pkr(stats.data?.get(detail.id)?.total_spent ?? 0)}
                  </p>
                </div>
              </div>

              <CustomerPackages customerId={detail.id} />

              <div>
                <p className="text-sm font-semibold">Sales history</p>
                <div className="mt-2 space-y-2">
                  {(customerSales.data?.rows ?? []).map((sale) => (
                    <button
                      key={sale.id}
                      type="button"
                      onClick={() => setOpenSale(sale.id)}
                      className="flex w-full items-center justify-between rounded-lg border border-pos-border px-4 py-2.5 text-sm hover:bg-pos-bg"
                    >
                      <span className="tabular">{sale.sale_number}</span>
                      <span>{dateOnly(sale.created_at)}</span>
                      <span className="tabular">{pkr(sale.total)}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold uppercase ${statusTone(sale.payment_status)}`}
                      >
                        {sale.payment_status}
                      </span>
                    </button>
                  ))}
                  {(customerSales.data?.rows.length ?? 0) === 0 && (
                    <p className="text-sm text-pos-text-muted">No sales yet.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="sm:justify-between">
            {isAdmin && detail && (
              <Button
                variant="outline"
                className="text-destructive"
                onClick={() => remove.mutate(detail.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Remove
              </Button>
            )}
            <Button variant="ghost" onClick={() => setDetail(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SaleDetailDialog saleId={openSale} onOpenChange={(open) => !open && setOpenSale(null)} />
    </div>
  );
}
