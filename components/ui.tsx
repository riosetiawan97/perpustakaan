import type { LoanStatus } from "@/lib/rules";

const SPINES = ["#1f3d34", "#a87a1f", "#4a5a8a", "#8a4a5a", "#3f7a6a", "#6a5a3f", "#5a4a8a"];
export const spineColor = (categoryId: number | null | undefined) => SPINES[(categoryId ?? 0) % SPINES.length];

export function StatusBadge({ status }: { status: LoanStatus }) {
  const cls = {
    dipinjam: "bg-shelf-soft text-shelf",
    terlambat: "bg-late-soft text-late",
    dikembalikan: "bg-paper text-muted",
  }[status];
  const label = { dipinjam: "Dipinjam", terlambat: "Terlambat", dikembalikan: "Dikembalikan" }[status];
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>{label}</span>;
}

export function Notice({ kind = "info", children }: { kind?: "info" | "error" | "ok"; children: React.ReactNode }) {
  const cls = { info: "bg-shelf-soft text-shelf", error: "bg-late-soft text-late", ok: "bg-brass-soft text-[#6b4d10]" }[kind];
  return <p role={kind === "error" ? "alert" : "status"} className={`rounded-md px-3 py-2 text-sm ${cls}`}>{children}</p>;
}

export function PageTitle({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <h1 className="text-2xl font-bold text-shelf sm:text-3xl">{title}</h1>
      {children}
    </div>
  );
}
