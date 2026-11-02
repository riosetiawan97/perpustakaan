// Aturan peminjaman perpustakaan.
export const LOAN_DAYS = 7;
export const MAX_ACTIVE_LOANS = 3;
export const FINE_PER_DAY = 1000; // Rupiah per hari keterlambatan
export const MAX_RENEWALS_INFO = "Perpanjangan dilakukan di meja petugas.";

const DAY_MS = 24 * 60 * 60 * 1000;

export function dueDateFrom(borrowedAt: Date, days = LOAN_DAYS): Date {
  return new Date(borrowedAt.getTime() + days * DAY_MS);
}

/** Jumlah hari terlambat (dibulatkan ke atas), 0 jika belum lewat jatuh tempo. */
export function daysLate(dueAt: Date, at: Date = new Date()): number {
  const diff = at.getTime() - dueAt.getTime();
  return diff <= 0 ? 0 : Math.ceil(diff / DAY_MS);
}

export function calcFine(dueAt: Date, at: Date = new Date()): number {
  return daysLate(dueAt, at) * FINE_PER_DAY;
}

export type LoanStatus = "dipinjam" | "terlambat" | "dikembalikan";

export function loanStatus(loan: { dueAt: Date; returnedAt: Date | null }, now: Date = new Date()): LoanStatus {
  if (loan.returnedAt) return "dikembalikan";
  return daysLate(loan.dueAt, now) > 0 ? "terlambat" : "dipinjam";
}
