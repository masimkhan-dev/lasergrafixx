import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Row<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type Customer = Row<"customers">;
export type Service = Row<"services">;
export type Sale = Row<"sales">;
export type SaleItem = Row<"sale_items">;
export type Payment = Row<"payments">;
export type Expense = Row<"expenses">;

export type SettingsMap = Record<string, string>;

export async function fetchSettings(): Promise<SettingsMap> {
  const { data, error } = await supabase.from("settings").select("key, value");
  if (error) throw error;
  return Object.fromEntries((data ?? []).map((r) => [r.key, r.value]));
}

export const settingsQuery = {
  queryKey: ["settings"] as const,
  queryFn: fetchSettings,
  staleTime: 5 * 60_000,
};

export async function fetchServices(activeOnly = false): Promise<Service[]> {
  let q = supabase.from("services").select("*").order("category").order("name");
  if (activeOnly) q = q.eq("is_active", true);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function searchCustomers(term: string, limit = 5): Promise<Customer[]> {
  const clean = term.trim();
  let q = supabase.from("customers").select("*").eq("is_active", true).limit(limit);
  if (clean) q = q.or(`name.ilike.%${clean}%,phone.ilike.%${clean}%`);
  const { data, error } = await q.order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export type SaleWithCustomer = Sale & { customers: Pick<Customer, "name" | "phone"> | null };

export async function fetchSales(options: {
  from?: string;
  to?: string;
  status?: string;
  search?: string;
  customerId?: string;
  limit?: number;
  offset?: number;
}): Promise<{ rows: SaleWithCustomer[]; count: number }> {
  let q = supabase
    .from("sales")
    .select("*, customers(name, phone)", { count: "exact" })
    .order("created_at", { ascending: false });

  if (options.from) q = q.gte("created_at", options.from);
  if (options.to) q = q.lte("created_at", options.to);
  if (options.status && options.status !== "all") q = q.eq("payment_status", options.status);
  if (options.search?.trim()) q = q.ilike("sale_number", `%${options.search.trim()}%`);
  if (options.customerId) q = q.eq("customer_id", options.customerId);

  const limit = options.limit ?? 20;
  const offset = options.offset ?? 0;
  const { data, error, count } = await q.range(offset, offset + limit - 1);
  if (error) throw error;
  return { rows: (data ?? []) as SaleWithCustomer[], count: count ?? 0 };
}

export type SaleDetail = {
  sale: SaleWithCustomer;
  items: SaleItem[];
  payments: Payment[];
};

export async function fetchSaleDetail(saleId: string): Promise<SaleDetail> {
  const [saleRes, itemsRes, paymentsRes] = await Promise.all([
    supabase.from("sales").select("*, customers(name, phone)").eq("id", saleId).single(),
    supabase.from("sale_items").select("*").eq("sale_id", saleId),
    supabase.from("payments").select("*").eq("sale_id", saleId).order("paid_at"),
  ]);
  if (saleRes.error) throw saleRes.error;
  if (itemsRes.error) throw itemsRes.error;
  if (paymentsRes.error) throw paymentsRes.error;
  return {
    sale: saleRes.data as SaleWithCustomer,
    items: itemsRes.data ?? [],
    payments: paymentsRes.data ?? [],
  };
}

/* ---------------- Multi-session packages ---------------- */

export type CustomerPackage = Row<"customer_packages">;
export type PackageSession = Row<"package_sessions">;

export async function fetchCustomerPackages(customerId: string): Promise<CustomerPackage[]> {
  const { data, error } = await supabase
    .from("customer_packages")
    .select("*")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchPackageSessions(packageId: string): Promise<PackageSession[]> {
  const { data, error } = await supabase
    .from("package_sessions")
    .select("*")
    .eq("package_id", packageId)
    .order("session_number");
  if (error) throw error;
  return data ?? [];
}

/* ---------------- Day-end cash closing ---------------- */

export type DaySummary = {
  cash_sales: number;
  card_total: number;
  digital_total: number;
  cash_expenses: number;
  sales_total: number;
  sales_count: number;
};

export type DailyClosing = Row<"daily_closings">;

/** Local (clinic) date as YYYY-MM-DD. */
export function todayLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export async function fetchDaySummary(date: string): Promise<DaySummary> {
  const { data, error } = await supabase.rpc("day_summary", { p_date: date });
  if (error) throw error;
  const row = (data as DaySummary[] | null)?.[0];
  return (
    row ?? {
      cash_sales: 0,
      card_total: 0,
      digital_total: 0,
      cash_expenses: 0,
      sales_total: 0,
      sales_count: 0,
    }
  );
}

export async function fetchClosing(date: string): Promise<DailyClosing | null> {
  const { data, error } = await supabase
    .from("daily_closings")
    .select("*")
    .eq("closing_date", date)
    .maybeSingle();
  if (error) throw error;
  return data ?? null;
}

export function startOfTodayIso(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export function statusTone(status: string): string {
  switch (status) {
    case "paid":
      return "bg-success/12 text-success";
    case "partial":
      return "bg-warning/18 text-warning-foreground";
    case "voided":
      return "bg-destructive/12 text-destructive";
    default:
      return "bg-muted text-muted-foreground";
  }
}
