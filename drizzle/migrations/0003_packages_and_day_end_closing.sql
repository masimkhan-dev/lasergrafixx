-- ============ Multi-session packages ============
CREATE TABLE public.customer_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customers(id),
  sale_id uuid REFERENCES public.sales(id),
  package_name text NOT NULL,
  total_sessions integer NOT NULL DEFAULT 1,
  used_sessions integer NOT NULL DEFAULT 0,
  price numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  expires_on date,
  notes text,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT customer_packages_total_positive CHECK (total_sessions > 0),
  CONSTRAINT customer_packages_used_range CHECK (used_sessions >= 0 AND used_sessions <= total_sessions),
  CONSTRAINT customer_packages_status_valid CHECK (status IN ('active', 'completed', 'cancelled'))
);

CREATE INDEX customer_packages_customer_idx ON public.customer_packages (customer_id, status);

GRANT SELECT, INSERT, UPDATE ON public.customer_packages TO authenticated;
GRANT ALL ON public.customer_packages TO service_role;
ALTER TABLE public.customer_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff read customer_packages" ON public.customer_packages
  FOR SELECT TO authenticated USING (public.is_active_staff());
CREATE POLICY "staff insert customer_packages" ON public.customer_packages
  FOR INSERT TO authenticated WITH CHECK (public.is_active_staff());
CREATE POLICY "staff update customer_packages" ON public.customer_packages
  FOR UPDATE TO authenticated USING (public.is_active_staff()) WITH CHECK (public.is_active_staff());

CREATE TABLE public.package_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id uuid NOT NULL REFERENCES public.customer_packages(id) ON DELETE CASCADE,
  session_number integer NOT NULL,
  performed_at timestamptz NOT NULL DEFAULT now(),
  notes text,
  performed_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (package_id, session_number)
);

CREATE INDEX package_sessions_package_idx ON public.package_sessions (package_id, session_number);

GRANT SELECT, INSERT ON public.package_sessions TO authenticated;
GRANT ALL ON public.package_sessions TO service_role;
ALTER TABLE public.package_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff read package_sessions" ON public.package_sessions
  FOR SELECT TO authenticated USING (public.is_active_staff());
CREATE POLICY "staff insert package_sessions" ON public.package_sessions
  FOR INSERT TO authenticated WITH CHECK (public.is_active_staff());

-- Atomic session redemption: increments usage and auto-completes the package.
CREATE OR REPLACE FUNCTION public.redeem_package_session(p_package_id uuid, p_notes text DEFAULT NULL)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
declare
  pkg public.customer_packages;
  v_next integer;
begin
  if not public.is_active_staff() then
    raise exception 'not authorized';
  end if;

  select * into pkg from public.customer_packages where id = p_package_id for update;
  if pkg.id is null then raise exception 'package not found'; end if;
  if pkg.status <> 'active' then raise exception 'package is not active'; end if;
  if pkg.used_sessions >= pkg.total_sessions then raise exception 'all sessions already used'; end if;

  v_next := pkg.used_sessions + 1;

  insert into public.package_sessions (package_id, session_number, notes, performed_by)
  values (p_package_id, v_next, p_notes, auth.uid());

  update public.customer_packages
  set used_sessions = v_next,
      status = case when v_next >= pkg.total_sessions then 'completed' else 'active' end,
      updated_at = now()
  where id = p_package_id;

  return v_next;
end;
$$;

REVOKE ALL ON FUNCTION public.redeem_package_session(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.redeem_package_session(uuid, text) TO authenticated;

-- ============ Day-end cash closing (Z-Report) ============
CREATE TABLE public.daily_closings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  closing_date date NOT NULL UNIQUE,
  opening_cash numeric NOT NULL DEFAULT 0,
  cash_sales numeric NOT NULL DEFAULT 0,
  card_total numeric NOT NULL DEFAULT 0,
  digital_total numeric NOT NULL DEFAULT 0,
  cash_expenses numeric NOT NULL DEFAULT 0,
  expected_cash numeric NOT NULL DEFAULT 0,
  counted_cash numeric NOT NULL DEFAULT 0,
  difference numeric NOT NULL DEFAULT 0,
  sales_count integer NOT NULL DEFAULT 0,
  notes text,
  closed_by uuid REFERENCES public.profiles(id),
  closed_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.daily_closings TO authenticated;
GRANT ALL ON public.daily_closings TO service_role;
ALTER TABLE public.daily_closings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff read daily_closings" ON public.daily_closings
  FOR SELECT TO authenticated USING (public.is_active_staff());
CREATE POLICY "staff insert daily_closings" ON public.daily_closings
  FOR INSERT TO authenticated WITH CHECK (public.is_active_staff());
CREATE POLICY "admin update daily_closings" ON public.daily_closings
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Live counter figures for a given day (voided sales excluded).
CREATE OR REPLACE FUNCTION public.day_summary(p_date date)
RETURNS TABLE(
  cash_sales numeric,
  card_total numeric,
  digital_total numeric,
  cash_expenses numeric,
  sales_total numeric,
  sales_count integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  select
    coalesce((select sum(p.amount) from public.payments p
      join public.sales s on s.id = p.sale_id
      where s.payment_status <> 'voided' and p.payment_method = 'cash'
        and (p.paid_at at time zone 'Asia/Karachi')::date = p_date), 0),
    coalesce((select sum(p.amount) from public.payments p
      join public.sales s on s.id = p.sale_id
      where s.payment_status <> 'voided' and p.payment_method = 'card'
        and (p.paid_at at time zone 'Asia/Karachi')::date = p_date), 0),
    coalesce((select sum(p.amount) from public.payments p
      join public.sales s on s.id = p.sale_id
      where s.payment_status <> 'voided' and p.payment_method = 'digital'
        and (p.paid_at at time zone 'Asia/Karachi')::date = p_date), 0),
    coalesce((select sum(e.amount) from public.expenses e where e.expense_date = p_date), 0),
    coalesce((select sum(s.total) from public.sales s
      where s.payment_status <> 'voided'
        and (s.created_at at time zone 'Asia/Karachi')::date = p_date), 0),
    coalesce((select count(*)::int from public.sales s
      where s.payment_status <> 'voided'
        and (s.created_at at time zone 'Asia/Karachi')::date = p_date), 0)
  where public.is_active_staff();
$$;

REVOKE ALL ON FUNCTION public.day_summary(date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.day_summary(date) TO authenticated;

-- Close the day: recomputes from the ledger, never trusts client figures.
CREATE OR REPLACE FUNCTION public.close_day(
  p_date date,
  p_opening_cash numeric,
  p_counted_cash numeric,
  p_notes text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
declare
  s record;
  v_expected numeric;
  v_id uuid;
begin
  if not public.is_active_staff() then
    raise exception 'not authorized';
  end if;
  if p_opening_cash is null or p_opening_cash < 0 then raise exception 'invalid opening cash'; end if;
  if p_counted_cash is null or p_counted_cash < 0 then raise exception 'invalid counted cash'; end if;

  select * into s from public.day_summary(p_date);
  v_expected := p_opening_cash + s.cash_sales - s.cash_expenses;

  insert into public.daily_closings (
    closing_date, opening_cash, cash_sales, card_total, digital_total, cash_expenses,
    expected_cash, counted_cash, difference, sales_count, notes, closed_by, closed_at
  ) values (
    p_date, p_opening_cash, s.cash_sales, s.card_total, s.digital_total, s.cash_expenses,
    v_expected, p_counted_cash, p_counted_cash - v_expected, s.sales_count, p_notes, auth.uid(), now()
  )
  on conflict (closing_date) do update set
    opening_cash = excluded.opening_cash,
    cash_sales = excluded.cash_sales,
    card_total = excluded.card_total,
    digital_total = excluded.digital_total,
    cash_expenses = excluded.cash_expenses,
    expected_cash = excluded.expected_cash,
    counted_cash = excluded.counted_cash,
    difference = excluded.difference,
    sales_count = excluded.sales_count,
    notes = excluded.notes,
    closed_by = excluded.closed_by,
    closed_at = now()
  returning id into v_id;

  return v_id;
end;
$$;

REVOKE ALL ON FUNCTION public.close_day(date, numeric, numeric, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.close_day(date, numeric, numeric, text) TO authenticated;