import { describe, expect, it } from "vitest";
import { calcFine, daysLate, DEFAULT_RULES, dueDateFrom, loanStatus, nextCode, SLUG_RE, slugify } from "./rules";

const d = (s: string) => new Date(s);

describe("aturan peminjaman", () => {
  it("jatuh tempo = tanggal pinjam + lama pinjam", () => {
    expect(dueDateFrom(d("2026-01-01T10:00:00Z")).toISOString()).toBe("2026-01-08T10:00:00.000Z");
    expect(dueDateFrom(d("2026-01-01T10:00:00Z"), 14).toISOString()).toBe("2026-01-15T10:00:00.000Z");
  });

  it("tidak ada denda jika dikembalikan tepat waktu", () => {
    expect(daysLate(d("2026-01-08T10:00:00Z"), d("2026-01-08T09:00:00Z"))).toBe(0);
    expect(calcFine(d("2026-01-08T10:00:00Z"), d("2026-01-08T10:00:00Z"))).toBe(0);
  });

  it("keterlambatan sebagian hari dihitung satu hari", () => {
    expect(daysLate(d("2026-01-08T10:00:00Z"), d("2026-01-08T11:00:00Z"))).toBe(1);
  });

  it("denda = hari terlambat x tarif perpustakaan", () => {
    expect(calcFine(d("2026-01-08T10:00:00Z"), d("2026-01-11T10:00:00Z"))).toBe(3 * DEFAULT_RULES.finePerDay);
    expect(calcFine(d("2026-01-08T10:00:00Z"), d("2026-01-11T10:00:00Z"), 500)).toBe(1500);
  });

  it("status pinjaman", () => {
    const now = d("2026-01-10T00:00:00Z");
    expect(loanStatus({ dueAt: d("2026-01-12T00:00:00Z"), returnedAt: null }, now)).toBe("dipinjam");
    expect(loanStatus({ dueAt: d("2026-01-09T00:00:00Z"), returnedAt: null }, now)).toBe("terlambat");
    expect(loanStatus({ dueAt: d("2026-01-09T00:00:00Z"), returnedAt: now }, now)).toBe("dikembalikan");
  });
});

describe("perpustakaan", () => {
  it("slug dari nama", () => {
    expect(slugify("Perpustakaan Daerah Kota Bekasi")).toBe("perpustakaan-daerah-kota-bekasi");
    expect(slugify("  Taman Baca 'Melati' #2 ")).toBe("taman-baca-melati-2");
    expect(slugify("Café Literasi")).toBe("cafe-literasi");
    expect(SLUG_RE.test("taman-baca-melati")).toBe(true);
    expect(SLUG_RE.test("-salah")).toBe(false);
    expect(SLUG_RE.test("a")).toBe(false);
  });

  it("kode anggota berurutan per jenis", () => {
    expect(nextCode("AGT", [])).toBe("AGT-0001");
    expect(nextCode("AGT", ["AGT-0001", "PTG-0001", "AGT-0009"])).toBe("AGT-0010");
    expect(nextCode("PTG", ["AGT-0001", "PTG-0001"])).toBe("PTG-0002");
  });
});
