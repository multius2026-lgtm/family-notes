export function useCurrency() {
  function fmt(n: number | string): string {
    const num = Math.round(Number(n) || 0);
    const neg = num < 0;
    const abs = Math.abs(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return (neg ? "-" : "") + "Rp " + abs;
  }

  function fmtCompact(n: number): string {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "jt";
    if (n >= 1_000) return (n / 1_000).toFixed(0) + "rb";
    return String(Math.round(n));
  }

  return { fmt, fmtCompact };
}
