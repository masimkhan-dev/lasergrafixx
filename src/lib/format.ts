import { format } from "date-fns";

/** Format an amount as PKR: "₨ 25,500" (no decimals). */
export function pkr(amount: number | string | null | undefined): string {
  const n = Number(amount ?? 0);
  return `₨ ${Math.round(n).toLocaleString("en-US")}`;
}

/** Plain number with thousands separators, no currency symbol. */
export function num(amount: number | string | null | undefined): string {
  return Math.round(Number(amount ?? 0)).toLocaleString("en-US");
}

export function dateTime(value: string | Date): string {
  return format(new Date(value), "dd-MMM-yyyy  hh:mm a");
}

export function dateOnly(value: string | Date): string {
  return format(new Date(value), "dd-MMM-yyyy");
}

export function timeOnly(value: string | Date): string {
  return format(new Date(value), "hh:mm a");
}

/** Pakistani mobile / landline format: 03XX-XXXXXXX or 03XXXXXXXXX. */
export const PHONE_PATTERN = /^03\d{2}-?\d{7}$/;

export function isValidPkPhone(phone: string): boolean {
  return PHONE_PATTERN.test(phone.trim());
}

export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  return phone.trim();
}

export const SERVICE_CATEGORIES = [
  "Hair Removal",
  "Skin Treatment",
  "Injectable",
  "Product",
  "Other",
] as const;
export const EXPENSE_CATEGORIES = [
  "Rent",
  "Salary",
  "Supplies",
  "Utilities",
  "Marketing",
  "Other",
] as const;
export const PAYMENT_METHODS = ["cash", "card", "digital"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
