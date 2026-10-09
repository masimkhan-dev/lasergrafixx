## Architecture rules

- Roles live in a separate `user_roles` table with an `app_role` enum, never a column on `profiles` — prevents privilege escalation.
- All sale money logic (create, add payment, void, customer totals) lives in SECURITY DEFINER database functions; the frontend never recomputes totals or status — one atomic source of truth.
- `EXECUTE` on every public SECURITY DEFINER function is granted to `authenticated` only, revoked from `anon`/`public` — staff-only surface.
- Admin UI lives under `src/routes/_authenticated/` (client-only gate) with pages named `admin.*`; the public site is `src/routes/index.tsx`.
- Shared POS queries/types live in `src/lib/pos.ts`, formatting in `src/lib/format.ts` — no inline Supabase queries in pages where a shared helper exists.
- Receipts print via native `window.print()` plus `@media print` (80mm), never a print library, and are never auto-triggered.
- UI uses the Bold Lotus palette with Sora/Manrope and full-width public sections — keeps clinic branding consistent across public, POS, and invoices.
- Package session redemption and day-end cash closing run through SECURITY DEFINER functions (`redeem_package_session`, `day_summary`, `close_day`) that recompute from the ledger — client figures are never trusted for cash reconciliation.
