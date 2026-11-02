"use client";
import { useActionState, useEffect, useRef } from "react";
import { createLoanAction } from "@/app/actions";
import { Notice } from "./ui";

export function LoanForm({
  slug,
  members,
  books,
  loanDays,
}: {
  slug: string;
  members: { code: string; name: string }[];
  books: { id: number; title: string; available: number }[];
  loanDays: number;
}) {
  const [state, action, pending] = useActionState(createLoanAction, undefined);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) ref.current?.reset();
  }, [state]);
  return (
    <form ref={ref} action={action} className="panel space-y-4 p-5">
      <h2 className="text-xl font-bold">Peminjaman baru</h2>
      <input type="hidden" name="slug" value={slug} />
      {state?.error && <Notice kind="error">{state.error}</Notice>}
      {state?.ok && <Notice kind="ok">{state.ok}</Notice>}
      <div>
        <label htmlFor="member" className="label">No. anggota atau email</label>
        <input id="member" name="member" list="daftar-anggota" required placeholder="AGT-0001" className="field" autoComplete="off" />
        <datalist id="daftar-anggota">
          {members.map((m) => <option key={m.code} value={m.code}>{m.name}</option>)}
        </datalist>
      </div>
      <div>
        <label htmlFor="bookId" className="label">Buku</label>
        <select id="bookId" name="bookId" required defaultValue="" className="field">
          <option value="" disabled>Pilih buku yang ada di rak</option>
          {books.map((b) => <option key={b.id} value={b.id}>{b.title} ({b.available} tersedia)</option>)}
        </select>
      </div>
      <p className="text-sm text-muted">Jatuh tempo otomatis {loanDays} hari dari hari ini.</p>
      <button className="btn-primary w-full" disabled={pending}>{pending ? "Mencatat…" : "Pinjamkan buku"}</button>
    </form>
  );
}
