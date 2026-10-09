import { dateTime, num } from "@/lib/format";
import type { SaleDetail, SettingsMap } from "@/lib/pos";

const WIDTH = 32;

function center(text: string) {
  const pad = Math.max(0, Math.floor((WIDTH - text.length) / 2));
  return " ".repeat(pad) + text;
}

function row(left: string, right: string) {
  const l = left.length + right.length > WIDTH ? left.slice(0, WIDTH - right.length - 1) : left;
  return l + " ".repeat(Math.max(1, WIDTH - l.length - right.length)) + right;
}

function itemRow(name: string, qty: number, total: number) {
  const amount = num(total);
  const q = String(qty);
  const nameWidth = WIDTH - amount.length - q.length - 4;
  const shown = name.length > nameWidth ? name.slice(0, nameWidth - 1) + "…" : name;
  return (
    shown +
    " ".repeat(Math.max(1, nameWidth - shown.length + 1)) +
    q +
    " ".repeat(3) +
    amount
  );
}

export function Receipt({ detail, settings }: { detail: SaleDetail; settings: SettingsMap }) {
  const { sale, items, payments } = detail;
  const lines: string[] = [];
  const divider = "-".repeat(WIDTH);
  const heavy = "=".repeat(WIDTH);

  lines.push(heavy);
  lines.push(center((settings['clinic_name'] ?? "Laser Grafix").toUpperCase()));
  if (settings['receipt_header']) lines.push(center(settings['receipt_header']));
  if (settings['clinic_address']) lines.push(center(settings['clinic_address']));
  if (settings['clinic_phone']) lines.push(center(`Tel: ${settings['clinic_phone']}`));
  lines.push(heavy);
  lines.push(`Sale #: ${sale.sale_number}`);
  lines.push(`Date: ${dateTime(sale.created_at)}`);
  lines.push(`Customer: ${sale.customers?.name ?? "Walk-in"}`);
  if (sale.customers?.phone) lines.push(`Phone: ${sale.customers.phone}`);
  lines.push(divider);
  lines.push(row("ITEM", "QTY  PRICE"));
  lines.push(divider);
  items.forEach((item) => lines.push(itemRow(item.service_name, item.quantity, Number(item.total))));
  lines.push(divider);
  lines.push(row("Subtotal:", num(sale.subtotal)));
  lines.push(row("Discount:", num(sale.discount)));
  lines.push(divider);
  lines.push(row("TOTAL:", num(sale.total)));
  lines.push("");
  lines.push(row("Paid:", num(sale.paid_amount)));
  lines.push(row("Remaining:", num(sale.remaining_amount)));
  const methods = [...new Set(payments.map((p) => p.payment_method))].join(", ");
  lines.push(row("Payment:", methods ? methods.toUpperCase() : "—"));
  if (sale.payment_status === "voided") {
    lines.push("");
    lines.push(center("*** VOIDED ***"));
  }
  lines.push(divider);
  if (settings['receipt_footer']) lines.push(center(settings['receipt_footer']));
  if (settings['social_handle']) lines.push(center(`Follow ${settings['social_handle']}`));
  lines.push(heavy);

  return <div className="receipt-print print-sheet">{lines.join("\n")}</div>;
}
