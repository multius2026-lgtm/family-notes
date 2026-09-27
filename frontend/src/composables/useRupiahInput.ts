/** Format angka ke pemisah ribuan Indonesia: 1000000 → "1.000.000" */
export function formatRupiahInput(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === "") return "";
  const num = typeof value === "string" ? parseRupiahInput(value) : Number(value);
  if (num === null || !Number.isFinite(num)) return "";
  const abs = Math.abs(Math.round(num)).toString();
  return abs.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/** Ambil angka murni dari input berformat: "1.000.000" → 1000000 */
export function parseRupiahInput(raw: string): number | null {
  const digits = String(raw).replace(/\D/g, "");
  if (!digits) return null;
  const n = Number(digits);
  return Number.isFinite(n) ? n : null;
}
