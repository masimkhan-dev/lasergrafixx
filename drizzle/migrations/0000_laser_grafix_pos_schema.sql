-- ===== roles enum =====
create type public.app_role as enum ('admin','staff');

-- ===== profiles =====
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
grant select, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

-- ===== user_roles =====
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create or replace function public.is_active_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and is_active)
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_active_staff() and public.has_role(auth.uid(), 'admin')
$$;

create policy "own profile select" on public.profiles for select to authenticated using (id = auth.uid());
create policy "admin profile select" on public.profiles for select to authenticated using (public.is_admin());
create policy "own profile update" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "own roles select" on public.user_roles for select to authenticated using (user_id = auth.uid() or public.is_admin());

-- bootstrap / self-provision profile on first login
create or replace function public.ensure_profile()
returns public.profiles language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  mail text := coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email', '');
  first_user boolean;
  prof public.profiles;
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;
  select not exists (select 1 from public.profiles) into first_user;
  insert into public.profiles (id, email)
  values (uid, mail)
  on conflict (id) do update set email = excluded.email
  returning * into prof;
  insert into public.user_roles (user_id, role)
  values (uid, case when first_user then 'admin'::public.app_role else 'staff'::public.app_role end)
  on conflict (user_id, role) do nothing;
  return prof;
end;
$$;

-- ===== customers =====
create table public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null unique,
  gender text,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.customers to authenticated;
grant all on public.customers to service_role;
alter table public.customers enable row level security;
create policy "staff read customers" on public.customers for select to authenticated using (public.is_active_staff());
create policy "staff insert customers" on public.customers for insert to authenticated with check (public.is_active_staff());
create policy "staff update customers" on public.customers for update to authenticated using (public.is_active_staff()) with check (public.is_active_staff());

-- ===== services =====
create table public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  price numeric(12,2) not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.services to authenticated;
grant all on public.services to service_role;
alter table public.services enable row level security;
create policy "staff read services" on public.services for select to authenticated using (public.is_active_staff());
create policy "staff insert services" on public.services for insert to authenticated with check (public.is_active_staff());
create policy "staff update services" on public.services for update to authenticated using (public.is_active_staff()) with check (public.is_active_staff());

-- ===== sales =====
create sequence public.sale_number_seq;
create table public.sales (
  id uuid primary key default gen_random_uuid(),
  sale_number text not null unique,
  customer_id uuid references public.customers(id),
  subtotal numeric(12,2) not null,
  discount numeric(12,2) not null default 0,
  total numeric(12,2) not null,
  paid_amount numeric(12,2) not null default 0,
  remaining_amount numeric(12,2) not null,
  payment_status text not null default 'unpaid',
  notes text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.sales to authenticated;
grant all on public.sales to service_role;
alter table public.sales enable row level security;
create policy "staff read sales" on public.sales for select to authenticated using (public.is_active_staff());
create policy "staff insert sales" on public.sales for insert to authenticated with check (public.is_active_staff());
create policy "admin update sales" on public.sales for update to authenticated using (public.is_admin()) with check (public.is_admin());

create table public.sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales(id) on delete cascade,
  service_name text not null,
  quantity int not null default 1,
  unit_price numeric(12,2) not null,
  total numeric(12,2) not null
);
grant select, insert on public.sale_items to authenticated;
grant all on public.sale_items to service_role;
alter table public.sale_items enable row level security;
create policy "staff read sale_items" on public.sale_items for select to authenticated using (public.is_active_staff());
create policy "staff insert sale_items" on public.sale_items for insert to authenticated with check (public.is_active_staff());

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales(id) on delete cascade,
  amount numeric(12,2) not null,
  payment_method text not null,
  notes text,
  paid_at timestamptz not null default now(),
  created_by uuid references public.profiles(id)
);
grant select, insert on public.payments to authenticated;
grant all on public.payments to service_role;
alter table public.payments enable row level security;
create policy "staff read payments" on public.payments for select to authenticated using (public.is_active_staff());
create policy "staff insert payments" on public.payments for insert to authenticated with check (public.is_active_staff());

-- ===== expenses =====
create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null,
  amount numeric(12,2) not null,
  notes text,
  expense_date date not null default current_date,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.expenses to authenticated;
grant all on public.expenses to service_role;
alter table public.expenses enable row level security;
create policy "staff read expenses" on public.expenses for select to authenticated using (public.is_active_staff());
create policy "staff insert expenses" on public.expenses for insert to authenticated with check (public.is_active_staff());
create policy "staff update expenses" on public.expenses for update to authenticated using (public.is_active_staff()) with check (public.is_active_staff());
create policy "admin delete expenses" on public.expenses for delete to authenticated using (public.is_admin());

-- ===== settings =====
create table public.settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);
grant select on public.settings to authenticated;
grant insert, update on public.settings to authenticated;
grant all on public.settings to service_role;
alter table public.settings enable row level security;
create policy "staff read settings" on public.settings for select to authenticated using (public.is_active_staff());
create policy "admin insert settings" on public.settings for insert to authenticated with check (public.is_admin());
create policy "admin update settings" on public.settings for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- ===== functions =====
create or replace function public.generate_sale_number()
returns text language sql volatile security definer set search_path = public as $$
  select 'LG-' || lpad(nextval('public.sale_number_seq')::text, 5, '0')
$$;

create or replace function public.create_sale_with_payments(
  p_customer_id uuid,
  p_items jsonb,
  p_discount numeric default 0,
  p_paid numeric default 0,
  p_method text default null,
  p_notes text default null
) returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_sale_id uuid;
  v_subtotal numeric := 0;
  v_total numeric;
  v_paid numeric := coalesce(p_paid, 0);
  v_status text;
  item jsonb;
begin
  if not public.is_active_staff() then
    raise exception 'not authorized';
  end if;
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'no items';
  end if;

  for item in select * from jsonb_array_elements(p_items) loop
    v_subtotal := v_subtotal + (item->>'unit_price')::numeric * (item->>'quantity')::int;
  end loop;

  v_total := greatest(v_subtotal - coalesce(p_discount, 0), 0);
  if v_paid > v_total then v_paid := v_total; end if;
  v_status := case when v_paid >= v_total then 'paid' when v_paid > 0 then 'partial' else 'unpaid' end;

  insert into public.sales (sale_number, customer_id, subtotal, discount, total, paid_amount,
    remaining_amount, payment_status, notes, created_by)
  values (public.generate_sale_number(), p_customer_id, v_subtotal, coalesce(p_discount,0), v_total,
    v_paid, v_total - v_paid, v_status, p_notes, auth.uid())
  returning id into v_sale_id;

  for item in select * from jsonb_array_elements(p_items) loop
    insert into public.sale_items (sale_id, service_name, quantity, unit_price, total)
    values (v_sale_id, item->>'service_name', (item->>'quantity')::int, (item->>'unit_price')::numeric,
      (item->>'unit_price')::numeric * (item->>'quantity')::int);
  end loop;

  if v_paid > 0 then
    insert into public.payments (sale_id, amount, payment_method, created_by)
    values (v_sale_id, v_paid, coalesce(p_method, 'cash'), auth.uid());
  end if;

  return v_sale_id;
end;
$$;

create or replace function public.add_payment_to_sale(
  p_sale_id uuid,
  p_amount numeric,
  p_method text,
  p_notes text default null
) returns void language plpgsql security definer set search_path = public as $$
declare
  s public.sales;
  v_paid numeric;
begin
  if not public.is_active_staff() then
    raise exception 'not authorized';
  end if;
  select * into s from public.sales where id = p_sale_id for update;
  if s.id is null then raise exception 'sale not found'; end if;
  if s.payment_status = 'voided' then raise exception 'sale is voided'; end if;
  if p_amount is null or p_amount <= 0 then raise exception 'invalid amount'; end if;

  insert into public.payments (sale_id, amount, payment_method, notes, created_by)
  values (p_sale_id, p_amount, p_method, p_notes, auth.uid());

  select coalesce(sum(amount), 0) into v_paid from public.payments where sale_id = p_sale_id;
  if v_paid > s.total then v_paid := s.total; end if;

  update public.sales
  set paid_amount = v_paid,
      remaining_amount = s.total - v_paid,
      payment_status = case when v_paid >= s.total then 'paid' when v_paid > 0 then 'partial' else 'unpaid' end,
      updated_at = now()
  where id = p_sale_id;
end;
$$;

create or replace function public.void_sale(p_sale_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'only admins can void sales';
  end if;
  update public.sales set payment_status = 'voided', updated_at = now() where id = p_sale_id;
end;
$$;

create or replace function public.get_customer_totals(p_customer_id uuid)
returns table (total_spent numeric, total_visits bigint, last_visit timestamptz)
language sql stable security definer set search_path = public as $$
  select coalesce(sum(total), 0), count(*), max(created_at)
  from public.sales
  where customer_id = p_customer_id and payment_status <> 'voided'
$$;

create or replace function public.customer_stats()
returns table (customer_id uuid, total_spent numeric, total_visits bigint, last_visit timestamptz)
language sql stable security definer set search_path = public as $$
  select customer_id, coalesce(sum(total), 0), count(*), max(created_at)
  from public.sales
  where payment_status <> 'voided' and customer_id is not null
  group by customer_id
$$;

revoke all on function public.ensure_profile() from public;
grant execute on function public.ensure_profile() to authenticated;
grant execute on function public.create_sale_with_payments(uuid, jsonb, numeric, numeric, text, text) to authenticated;
grant execute on function public.add_payment_to_sale(uuid, numeric, text, text) to authenticated;
grant execute on function public.void_sale(uuid) to authenticated;
grant execute on function public.get_customer_totals(uuid) to authenticated;
grant execute on function public.customer_stats() to authenticated;

-- ===== seed data =====
insert into public.services (name, category, price) values
  ('Hydrafacial', 'Facial', 8000),
  ('Laser Hair Removal (Full Face)', 'Laser', 5000),
  ('Laser Hair Removal (Underarms)', 'Laser', 3000),
  ('Botox (Forehead)', 'Injectable', 15000),
  ('Dermal Fillers (Lips)', 'Injectable', 25000),
  ('Chemical Peel', 'Peel', 6000),
  ('PRP Hair Treatment', 'Facial', 10000),
  ('Carbon Facial', 'Facial', 7000),
  ('Vitamin C Serum 30ml', 'Product', 2500),
  ('Sunblock SPF 50', 'Product', 1800);

insert into public.customers (name, phone, gender) values
  ('Ayesha Khan', '0300-1234567', 'female'),
  ('Fatima Malik', '0321-9876543', 'female'),
  ('Sana Ahmed', '0333-5551234', 'female');

insert into public.settings (key, value) values
  ('clinic_name', 'Laser Grafix'),
  ('clinic_phone', '091-XXXXXXX'),
  ('clinic_address', 'University Road, Peshawar'),
  ('receipt_header', 'Aesthetic Skin Clinic'),
  ('receipt_footer', 'Thank you for choosing Laser Grafix!'),
  ('social_handle', '@lasergrafix.pk');