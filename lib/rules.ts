// Aturan peminjaman. Nilai bawaan; tiap perpustakaan bisa mengatur sendiri.
export const DEFAULT_RULES = { loanDays: 7, maxLoans: 3, finePerDay: 1000 };
export type Rules = typeof DEFAULT_RULES;

const DAY_MS = 24 * 60 * 60 * 1000;

export function dueDateFrom(borrowedAt: Date, days = DEFAULT_RULES.loanDays): Date {
  return new Date(borrowedAt.getTime() + days * DAY_MS);
}

/** Jumlah hari terlambat (dibulatkan ke atas), 0 jika belum lewat jatuh tempo. */
export function daysLate(dueAt: Date, at: Date = new Date()): number {
  const diff = at.getTime() - dueAt.getTime();
  return diff <= 0 ? 0 : Math.ceil(diff / DAY_MS);
}

export function calcFine(dueAt: Date, at: Date = new Date(), finePerDay = DEFAULT_RULES.finePerDay): number {
  return daysLate(dueAt, at) * finePerDay;
}

export type LoanStatus = "dipinjam" | "terlambat" | "dikembalikan";

export function loanStatus(loan: { dueAt: Date; returnedAt: Date | null }, now: Date = new Date()): LoanStatus {
  if (loan.returnedAt) return "dikembalikan";
  return daysLate(loan.dueAt, now) > 0 ? "terlambat" : "dipinjam";
}

/** Slug URL dari nama perpustakaan: huruf kecil, angka, dan tanda hubung. */
export function slugify(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/g, "");
}

export const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$/;

/** Kode anggota berikutnya, mis. AGT-0007 atau PTG-0002. */
export function nextCode(prefix: "AGT" | "PTG", existing: string[]): string {
  const nums = existing
    .filter((c) => c.startsWith(prefix + "-"))
    .map((c) => Number(c.slice(prefix.length + 1)))
    .filter(Number.isFinite);
  const n = (nums.length ? Math.max(...nums) : 0) + 1;
  return `${prefix}-${String(n).padStart(4, "0")}`;
}
