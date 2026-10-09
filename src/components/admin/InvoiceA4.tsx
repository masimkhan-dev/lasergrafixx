import logo from "@/assets/laser-grafix-logo-transparent.png";
import { dateOnly, pkr } from "@/lib/format";
import type { SaleDetail, SettingsMap } from "@/lib/pos";

/** Delicate botanical corner flourish (line art), matching the invoice's hand-drawn style. */
function Botanical({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M8 112C28 96 44 74 54 48" />
      <path d="M52 62c-12 2-20-4-24-14 11-3 20 3 24 14z" />
      <path d="M60 40c-12 1-21-6-24-16 12-2 21 5 24 16z" />
      <path d="M58 56c11-4 17-13 16-25-11 3-17 13-16 25z" />
      <path d="M66 30c10-5 14-15 12-26-10 5-14 15-12 26z" />
      <circle cx="82" cy="20" r="3" />
      <circle cx="96" cy="34" r="2" />
    </svg>
  );
}

export function InvoiceA4({
  detail,
  settings,
}: {
  detail: SaleDetail;
  settings: SettingsMap;
}) {
  const { sale, items, payments } = detail;
  const clinicName = settings["clinic_name"] ?? "Laser Grafix";
  const methods = [...new Set(payments.map((p) => p.payment_method))].join(" · ");

  return (
    <div className="invoice-print print-sheet relative overflow-hidden bg-invoice-paper text-invoice-ink">
      <Botanical className="absolute -top-2 -left-3 h-28 w-28 text-invoice-gold/45" />
      <Botanical className="absolute right-0 bottom-0 h-32 w-32 scale-x-[-1] scale-y-[-1] text-invoice-gold/35" />

      <div className="invoice-body relative px-10 py-9">
        {/* HEADER */}
        <header className="flex items-start justify-between gap-6 border-b border-invoice-line pb-7">
          <div className="flex items-center gap-4">
            <span className="flex h-16 w-24 items-center justify-center">
              <img src={logo} alt={clinicName} className="max-h-full max-w-full object-contain" />
            </span>
            <div>
              <p className="font-display text-[26px] leading-tight tracking-[0.14em] uppercase">
                {clinicName}
              </p>
              <p className="mt-1 text-[11px] tracking-[0.2em] text-invoice-muted uppercase">
                {settings["receipt_header"] ?? "Skin & Hair — Advanced Care"}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-display text-[22px] tracking-[0.2em] text-invoice-gold uppercase">
              Invoice
            </p>
            <p className="mt-2 text-xs text-invoice-muted">
              No. <span className="font-semibold text-invoice-ink">{sale.sale_number}</span>
            </p>
            <p className="text-xs text-invoice-muted">
              Date <span className="font-semibold text-invoice-ink">{dateOnly(sale.created_at)}</span>
            </p>
            {sale.payment_status === "voided" && (
              <p className="mt-2 text-xs font-bold tracking-[0.18em] uppercase">VOIDED</p>
            )}
          </div>
        </header>

        {/* BILLED TO */}
        <section className="mt-7 grid grid-cols-2 gap-8">
          <div>
            <p className="text-[10px] tracking-[0.22em] text-invoice-muted uppercase">Billed to</p>
            <p className="mt-2 font-display text-lg">{sale.customers?.name ?? "Walk-in Guest"}</p>
            <p className="text-sm text-invoice-muted">{sale.customers?.phone ?? "—"}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] tracking-[0.22em] text-invoice-muted uppercase">Clinic</p>
            <p className="mt-2 text-sm leading-relaxed text-invoice-muted">
              {settings["clinic_address"] ?? ""}
            </p>
            <p className="text-sm text-invoice-muted">{settings["clinic_phone"] ?? ""}</p>
          </div>
        </section>

        {/* ITEMS */}
        <table className="mt-8 w-full border-collapse text-sm">
          <thead>
            <tr className="bg-invoice-head text-invoice-head-foreground">
              <th className="px-4 py-2.5 text-left text-[10px] font-semibold tracking-[0.18em] uppercase">
                Treatment
              </th>
              <th className="px-3 py-2.5 text-center text-[10px] font-semibold tracking-[0.18em] uppercase">
                Qty
              </th>
              <th className="px-3 py-2.5 text-right text-[10px] font-semibold tracking-[0.18em] uppercase">
                Rate
              </th>
              <th className="px-4 py-2.5 text-right text-[10px] font-semibold tracking-[0.18em] uppercase">
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-invoice-line">
                <td className="px-4 py-3">{item.service_name}</td>
                <td className="px-3 py-3 text-center">{item.quantity}</td>
                <td className="px-3 py-3 text-right tabular">{pkr(item.unit_price)}</td>
                <td className="px-4 py-3 text-right tabular">{pkr(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* TOTALS */}
        <section className="mt-6 flex justify-end">
          <dl className="w-72 text-sm">
            <div className="flex justify-between py-1.5">
              <dt className="text-invoice-muted">Subtotal</dt>
              <dd className="tabular">{pkr(sale.subtotal)}</dd>
            </div>
            <div className="flex justify-between py-1.5">
              <dt className="text-invoice-muted">Discount</dt>
              <dd className="tabular">{pkr(sale.discount)}</dd>
            </div>
            <div className="mt-1 flex justify-between border-y border-invoice-line py-2.5">
              <dt className="font-display text-base tracking-wide">Net Total</dt>
              <dd className="tabular text-base">{pkr(sale.total)}</dd>
            </div>
            <div className="flex justify-between py-1.5">
              <dt className="text-invoice-muted">Paid {methods ? `(${methods})` : ""}</dt>
              <dd className="tabular">{pkr(sale.paid_amount)}</dd>
            </div>
            <div className="flex justify-between py-1.5 font-semibold">
              <dt>Remaining</dt>
              <dd className="tabular">{pkr(sale.remaining_amount)}</dd>
            </div>
          </dl>
        </section>

        {sale.notes && (
          <p className="mt-6 max-w-md text-xs leading-relaxed text-invoice-muted">
            <span className="tracking-[0.18em] uppercase">Notes — </span>
            {sale.notes}
          </p>
        )}

        {/* FOOTER */}
        <footer className="mt-10 border-t border-invoice-line pt-5 text-xs text-invoice-muted">
          <p className="font-display text-sm tracking-[0.16em] text-invoice-ink uppercase">
            {settings["receipt_footer"] ?? "Thank you for visiting"}
          </p>
          <p className="mt-2">
            {settings["clinic_address"] ?? ""}
            {settings["clinic_phone"] ? ` · ${settings["clinic_phone"]}` : ""}
            {settings["social_handle"] ? ` · ${settings["social_handle"]}` : ""}
          </p>
          <p className="mt-1">
            Payment accepted in cash, by card or digital transfer. Results may vary between
            individuals.
          </p>
        </footer>
      </div>
    </div>
  );
}
