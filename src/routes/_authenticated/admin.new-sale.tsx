import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Minus, Plus, X, Check, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { SaleDetailDialog } from "@/components/admin/SaleDetailDialog";
import { supabase } from "@/integrations/supabase/client";
import {
  PAYMENT_METHODS,
  isValidPkPhone,
  normalizePhone,
  pkr,
  type PaymentMethod,
} from "@/lib/format";
import { fetchServices, searchCustomers, type Customer, type Service } from "@/lib/pos";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/new-sale")({
  head: () => ({
    meta: [
      { title: "New Sale — Laser Grafix POS" },
      { name: "description", content: "Create a clinic sale: pick a customer, add treatments, take payment." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "New Sale — Laser Grafix POS" },
      { property: "og:description", content: "Fast three-click billing for clinic treatments." },
    ],
  }),
  component: NewSale,
});

type BillItem = { service_name: string; unit_price: number; quantity: number };

function NewSale() {
  const queryClient = useQueryClient();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [search, setSearch] = useState("");
  const [addingCustomer, setAddingCustomer] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newGender, setNewGender] = useState("");

  const [category, setCategory] = useState("All");
  const [items, setItems] = useState<BillItem[]>([]);
  const [discount, setDiscount] = useState("");
  const [method, setMethod] = useState<PaymentMethod | null>(null);
  const [received, setReceived] = useState("");
  const [notes, setNotes] = useState("");
  const [packageSessions, setPackageSessions] = useState(1);
  const [confirmClear, setConfirmClear] = useState(false);
  const [completedSaleId, setCompletedSaleId] = useState<string | null>(null);

  const services = useQuery({ queryKey: ["services", "active"], queryFn: () => fetchServices(true) });

  const debounced = useDebounced(search, 300);
  const results = useQuery({
    queryKey: ["customer-search", debounced],
    enabled: !customer && debounced.trim().length > 0,
    queryFn: () => searchCustomers(debounced),
  });

  const categories = useMemo(() => {
    const set = new Set((services.data ?? []).map((s) => s.category));
    return ["All", ...Array.from(set)];
  }, [services.data]);

  const visibleServices = (services.data ?? []).filter(
    (s) => category === "All" || s.category === category,
  );

  const subtotal = items.reduce((acc, i) => acc + i.unit_price * i.quantity, 0);
  const discountValue = Math.min(Number(discount) || 0, subtotal);
  const total = subtotal - discountValue;
  const receivedValue = received === "" ? total : Math.min(Number(received) || 0, total);
  const remaining = Math.max(total - receivedValue, 0);

  function addService(service: Service) {
    setItems((prev) => {
      const found = prev.find((i) => i.service_name === service.name);
      if (found) {
        return prev.map((i) =>
          i.service_name === service.name ? { ...i, quantity: i.quantity + 1 } : i,
        );
      }
      return [...prev, { service_name: service.name, unit_price: Number(service.price), quantity: 1 }];
    });
  }

  function clearAll() {
    setCustomer(null);
    setSearch("");
    setItems([]);
    setDiscount("");
    setMethod(null);
    setReceived("");
    setNotes("");
    setConfirmClear(false);
  }

  const createCustomer = useMutation({
    mutationFn: async () => {
      if (!newName.trim()) throw new Error("Name is required");
      const phone = normalizePhone(newPhone);
      if (!isValidPkPhone(phone)) throw new Error("Phone must look like 03XX-XXXXXXX");
      const { data, error } = await supabase
        .from("customers")
        .insert({ name: newName.trim(), phone, gender: newGender || null })
        .select()
        .single();
      if (error) throw error;
      return data as Customer;
    },
    onSuccess: (created) => {
      setCustomer(created);
      setAddingCustomer(false);
      setNewName("");
      setNewPhone("");
      setNewGender("");
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Customer added");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const completeSale = useMutation({
    mutationFn: async () => {
      if (!customer || !method) throw new Error("Customer and payment method are required");
      const { data, error } = await supabase.rpc("create_sale_with_payments", {
        p_customer_id: customer.id,
        p_items: items,
        p_discount: discountValue,
        p_paid: receivedValue,
        p_method: method,
        ...(notes ? { p_notes: notes } : {}),
      });
      if (error) throw error;
      const saleId = data as string;
      if (packageSessions > 1) {
        const name = `${items.map((i) => i.service_name).join(" + ")} (${packageSessions} Sessions)`;
        const { error: pkgError } = await supabase.from("customer_packages").insert({
          customer_id: customer.id,
          sale_id: saleId,
          package_name: name,
          total_sessions: packageSessions,
          price: total,
        });
        if (pkgError) toast.error("Sale saved, but package could not be created: " + pkgError.message);
      }
      return saleId;
    },
    onSuccess: (saleId) => {
      toast.success(packageSessions > 1 ? "Sale completed — package added!" : "Sale completed!");
      setCompletedSaleId(saleId);
      setPackageSessions(1);
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["customer-stats"] });
      queryClient.invalidateQueries({ queryKey: ["customer-packages"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const canComplete = !!customer && items.length > 0 && !!method && !completeSale.isPending;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-pos-text-muted">
          Pick a customer, tap treatments, take payment.
        </p>
        <Button variant="outline" onClick={() => setConfirmClear(true)}>
          Clear All
        </Button>
      </div>

      {/* CUSTOMER */}
      <section className="rounded-lg border border-pos-border bg-pos-card p-6 shadow-card">
        {customer ? (
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-primary">
              {customer.name} · {customer.phone}
            </span>
            <Button variant="ghost" size="sm" onClick={() => setCustomer(null)}>
              Change
            </Button>
          </div>
        ) : (
          <div>
            <div className="relative">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-pos-text-muted" />
              <Input
                autoFocus
                className="h-12 pl-10 text-base"
                placeholder="Search customer by name or phone…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {debounced.trim() && (
              <div className="mt-3 space-y-2">
                {(results.data ?? []).map((c) => (
                  <div
                    key={c.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setCustomer(c)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") setCustomer(c);
                    }}
                    className="flex cursor-pointer items-center justify-between rounded-lg border border-pos-border px-4 py-2.5 hover:border-primary"
                  >
                    <span className="text-sm">
                      <span className="font-semibold">{c.name}</span>{" "}
                      <span className="text-pos-text-muted">{c.phone}</span>
                    </span>
                    <Button size="sm" variant="outline" onClick={() => setCustomer(c)}>
                      Select
                    </Button>
                  </div>
                ))}
                {!results.isLoading && (results.data?.length ?? 0) === 0 && !addingCustomer && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setAddingCustomer(true);
                      setNewName(search);
                    }}
                  >
                    <UserPlus className="mr-2 h-4 w-4" /> Add New Customer
                  </Button>
                )}
              </div>
            )}

            {addingCustomer && (
              <div className="mt-4 grid gap-3 rounded-lg border border-pos-border p-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="n-name">Name *</Label>
                  <Input id="n-name" value={newName} onChange={(e) => setNewName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="n-phone">Phone *</Label>
                  <Input
                    id="n-phone"
                    placeholder="03XX-XXXXXXX"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Gender</Label>
                  <Select value={newGender} onValueChange={setNewGender}>
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
                <div className="flex gap-2 sm:col-span-3">
                  <Button
                    className="bg-primary text-primary-foreground hover:bg-primary-hover"
                    disabled={createCustomer.isPending}
                    onClick={() => createCustomer.mutate()}
                  >
                    Save customer
                  </Button>
                  <Button variant="ghost" onClick={() => setAddingCustomer(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      <div className="grid gap-5 lg:grid-cols-5">
        {/* SERVICES */}
        <section className="space-y-4 lg:col-span-3">
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <Button
                key={cat}
                size="sm"
                variant={category === cat ? "default" : "outline"}
                className={category === cat ? "bg-primary hover:bg-primary-hover" : ""}
                onClick={() => setCategory(cat)}
              >
                {cat}
              </Button>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {visibleServices.map((service) => (
              <Button
                key={service.id}
                type="button"
                variant="outline"
                onClick={() => addService(service)}
                className="lift h-auto min-h-[96px] items-start rounded-lg border-pos-border bg-pos-card p-4 text-left shadow-card"
              >
                <span className="flex w-full flex-col items-start whitespace-normal">
                  <span className="block text-sm font-semibold">{service.name}</span>
                  <span className="tabular mt-2 block text-sm text-primary">{pkr(service.price)}</span>
                </span>
              </Button>
            ))}
            {!services.isLoading && visibleServices.length === 0 && (
              <p className="text-sm text-pos-text-muted">No active services in this category.</p>
            )}
          </div>
        </section>

        {/* BILL */}
        <section className="lg:col-span-2">
          <div className="sticky top-20 rounded-lg border border-pos-border bg-pos-card p-6 shadow-card">
            <h2 className="font-sans text-base font-semibold">Current Bill</h2>

            <div className="mt-4 space-y-3">
              {items.length === 0 && (
                <p className="py-6 text-center text-sm text-pos-text-muted">
                  No items yet — select a service
                </p>
              )}
              {items.map((item) => (
                <div key={item.service_name} className="flex items-center gap-2 text-sm">
                  <span className="flex-1">{item.service_name}</span>
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-7 w-7"
                      onClick={() =>
                        setItems((prev) =>
                          prev.flatMap((i) =>
                            i.service_name === item.service_name
                              ? i.quantity > 1
                                ? [{ ...i, quantity: i.quantity - 1 }]
                                : []
                              : [i],
                          ),
                        )
                      }
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="tabular w-6 text-center">{item.quantity}</span>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-7 w-7"
                      onClick={() =>
                        setItems((prev) =>
                          prev.map((i) =>
                            i.service_name === item.service_name
                              ? { ...i, quantity: i.quantity + 1 }
                              : i,
                          ),
                        )
                      }
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <span className="tabular w-20 text-right">
                    {pkr(item.unit_price * item.quantity)}
                  </span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-destructive"
                    onClick={() =>
                      setItems((prev) => prev.filter((i) => i.service_name !== item.service_name))
                    }
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="mt-5 space-y-3 border-t border-pos-border pt-5 text-sm">
              <div className="flex justify-between">
                <span className="text-pos-text-muted">Subtotal</span>
                <span className="tabular">{pkr(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-pos-text-muted">Discount</span>
                <Input
                  className="h-9 w-28 text-right"
                  inputMode="numeric"
                  placeholder="0"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                />
              </div>
              <div className="flex items-baseline justify-between border-t border-pos-border pt-3">
                <span className="font-semibold">TOTAL</span>
                <span className="tabular text-[28px] leading-none">{pkr(total)}</span>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <div className="grid grid-cols-3 gap-2">
                {PAYMENT_METHODS.map((m) => (
                  <Button
                    key={m}
                    type="button"
                    variant="outline"
                    onClick={() => setMethod(m)}
                    className={cn(
                      "h-12 rounded-md border-2 py-3 text-sm font-semibold capitalize",
                      method === m
                        ? "border-primary bg-accent text-primary"
                        : "border-pos-border text-pos-text-muted",
                    )}
                  >
                    {m}
                  </Button>
                ))}
              </div>
              <div className="space-y-2">
                <Label htmlFor="received">Amount received</Label>
                <Input
                  id="received"
                  inputMode="numeric"
                  placeholder={String(Math.round(total))}
                  value={received}
                  onChange={(e) => setReceived(e.target.value)}
                />
                {remaining > 0 && (
                  <p className="text-sm font-semibold text-warning-foreground">
                    Remaining: {pkr(remaining)}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Sessions (package)</Label>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 4, 6, 8].map((n) => (
                    <Button
                      key={n}
                      type="button"
                      variant={packageSessions === n ? "default" : "outline"}
                      onClick={() => setPackageSessions(n)}
                    >
                      {n === 1 ? "Single" : `${n}`}
                    </Button>
                  ))}
                </div>
                {packageSessions > 1 && (
                  <p className="text-xs text-pos-text-muted">
                    A {packageSessions}-session package will be added to this customer.
                  </p>
                )}
              </div>
              <Textarea
                rows={2}
                placeholder="Any notes?"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
              <Button
                className="h-14 w-full bg-success text-base font-semibold text-success-foreground hover:bg-success/90"
                disabled={!canComplete}
                onClick={() => completeSale.mutate()}
              >
                <Check className="mr-2 h-5 w-5" /> COMPLETE SALE
              </Button>
              {!canComplete && !completeSale.isPending && (
                <p className="text-center text-xs text-pos-text-muted">
                  Select a customer, add at least one service and choose a payment method.
                </p>
              )}
            </div>
          </div>
        </section>
      </div>

      <AlertDialog open={confirmClear} onOpenChange={setConfirmClear}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear this sale?</AlertDialogTitle>
            <AlertDialogDescription>
              The selected customer and all items will be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep</AlertDialogCancel>
            <AlertDialogAction onClick={clearAll}>Clear all</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <SaleDetailDialog
        saleId={completedSaleId}
        onOpenChange={(open) => {
          if (!open) {
            setCompletedSaleId(null);
            clearAll();
          }
        }}
      />
    </div>
  );
}

function useDebounced(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}
