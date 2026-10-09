import { dateOnly, dateTime, num } from "@/lib/format";
import type { DailyClosing, SettingsMap } from "@/lib/pos";

const WIDTH = 32;

function center(text: string) {
  const pad = Math.max(0, Math.floor((WIDTH - text.length) / 2));
  return " ".repeat(pad) + text;
}

function row(left: string, right: string) {
  const l = left.length + right.length > WIDTH ? left.slice(0, WIDTH - right.length - 1) : left;
  return l + " ".repeat(Math.max(1, WIDTH - l.length - right.length)) + right;
}

export function ZReport({
  closing,
  settings,
  staffName,
}: {
  closing: DailyClosing;
  settings: SettingsMap;
  staffName: string;
}) {
  const lines: string[] = [];
  const divider = "-".repeat(WIDTH);
  const heavy = "=".repeat(WIDTH);

  lines.push(heavy);
  lines.push(center((settings["clinic_name"] ?? "Laser Grafix").toUpperCase()));
  lines.push(center("DAY-END CASH CLOSING"));
  lines.push(center("(Z-REPORT)"));
  lines.push(heavy);
  lines.push(`Date: ${dateOnly(closing.closing_date)}`);
  lines.push(`Closed: ${dateTime(closing.closed_at)}`);
  lines.push(`By: ${staffName}`);
  lines.push(divider);
  lines.push(row("Sales count:", String(closing.sales_count)));
  lines.push(divider);
  lines.push(row("Opening cash:", num(closing.opening_cash)));
  lines.push(row("+ Cash sales:", num(closing.cash_sales)));
  lines.push(row("- Cash expenses:", num(closing.cash_expenses)));
  lines.push(divider);
  lines.push(row("EXPECTED CASH:", num(closing.expected_cash)));
  lines.push(row("COUNTED CASH:", num(closing.counted_cash)));
  const diff = Number(closing.difference);
  lines.push(
    row(
      diff === 0 ? "BALANCED:" : diff > 0 ? "SURPLUS:" : "SHORTAGE:",
      num(Math.abs(diff)),
    ),
  );
  lines.push(divider);
  lines.push(center("NON-CASH RECEIPTS"));
  lines.push(row("Card:", num(closing.card_total)));
  lines.push(row("Digital:", num(closing.digital_total)));
  lines.push(divider);
  if (closing.notes) {
    lines.push("Notes:");
    lines.push(closing.notes);
    lines.push(divider);
  }
  lines.push("");
  lines.push("Counted by: ____________________");
  lines.push("");
  lines.push("Verified by: ____________________");
  lines.push(heavy);

  return <div className="receipt-print print-sheet z-report-sheet">{lines.join("\n")}</div>;
}
