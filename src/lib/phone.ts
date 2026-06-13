/** US-style phone: 10 digits displayed as XXX-XXX-XXXX */

export function digitsOnlyPhone(value: string): string {
  return value.replace(/\D/g, "").slice(0, 10);
}

export function formatPhoneMask(value: string): string {
  const digits = digitsOnlyPhone(value);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export function phoneFromStorage(value: string | null | undefined): string {
  if (!value) return "";
  return formatPhoneMask(value);
}

export function phoneToStorage(value: string | null | undefined): string {
  return digitsOnlyPhone(value ?? "");
}

export function isValidPhone10(value: string | null | undefined): boolean {
  return digitsOnlyPhone(value ?? "").length === 10;
}

export function formatPhoneDisplay(value: string | null | undefined): string {
  const digits = digitsOnlyPhone(value ?? "");
  if (!digits) return "—";
  return formatPhoneMask(digits);
}
