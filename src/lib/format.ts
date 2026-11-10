export function inr(n: number): string {
  const a = Math.abs(n);
  if (a >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`;
  if (a >= 1e5) return `₹${(n / 1e5).toFixed(1)} L`;
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
}
export const pct = (n: number, d = 1) => `${n.toFixed(d)}%`;
export const num = (n: number) => Math.round(n).toLocaleString('en-IN');
export const secToMin = (s: number) => `${Math.floor(s / 60)}m ${String(Math.round(s % 60)).padStart(2, '0')}s`;
