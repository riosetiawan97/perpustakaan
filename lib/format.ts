const tgl = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" });
const rp = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });

export const formatDate = (d: Date | string | null | undefined) => (d ? tgl.format(new Date(d)) : "—");
export const formatRupiah = (n: number) => rp.format(n);
