import { describe, expect, it } from "vitest";
import { calcFine, daysLate, dueDateFrom, FINE_PER_DAY, LOAN_DAYS, loanStatus } from "./rules";

const d = (s: string) => new Date(s);

describe("aturan peminjaman", () => {
  it("jatuh tempo = tanggal pinjam + LOAN_DAYS", () => {
    const due = dueDateFrom(d("2026-01-01T10:00:00Z"));
    expect(due.toISOString()).toBe(new Date(Date.UTC(2026, 0, 1 + LOAN_DAYS, 10)).toISOString());
  });

  it("tidak ada denda jika dikembalikan tepat waktu", () => {
    expect(daysLate(d("2026-01-08T10:00:00Z"), d("2026-01-08T09:00:00Z"))).toBe(0);
    expect(calcFine(d("2026-01-08T10:00:00Z"), d("2026-01-08T10:00:00Z"))).toBe(0);
  });

  it("keterlambatan sebagian hari dihitung satu hari", () => {
    expect(daysLate(d("2026-01-08T10:00:00Z"), d("2026-01-08T11:00:00Z"))).toBe(1);
  });

  it("denda = hari terlambat x tarif", () => {
    expect(calcFine(d("2026-01-08T10:00:00Z"), d("2026-01-11T10:00:00Z"))).toBe(3 * FINE_PER_DAY);
  });

  it("status pinjaman", () => {
    const now = d("2026-01-10T00:00:00Z");
    expect(loanStatus({ dueAt: d("2026-01-12T00:00:00Z"), returnedAt: null }, now)).toBe("dipinjam");
    expect(loanStatus({ dueAt: d("2026-01-09T00:00:00Z"), returnedAt: null }, now)).toBe("terlambat");
    expect(loanStatus({ dueAt: d("2026-01-09T00:00:00Z"), returnedAt: now }, now)).toBe("dikembalikan");
  });
});
