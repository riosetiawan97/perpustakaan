"use client";
import { useActionState, useState } from "react";
import type { FormState } from "@/app/actions";
import type { Library } from "@/lib/db/schema";
import { slugify } from "@/lib/rules";
import { Notice } from "./ui";

type Props = {
  action: (s: FormState, f: FormData) => Promise<FormState>;
  library?: Library;
  submit: string;
};

export function LibraryForm({ action, library, submit }: Props) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [name, setName] = useState(library?.name ?? "");
  const [slug, setSlug] = useState<string | null>(null);
  const editing = !!library;
  const shownSlug = slug ?? slugify(name);

  return (
    <form action={formAction} className="panel grid gap-4 p-5 sm:grid-cols-2">
      {library && <input type="hidden" name="slug" value={library.slug} />}
      {state?.error && <div className="sm:col-span-2"><Notice kind="error">{state.error}</Notice></div>}
      {state?.ok && <div className="sm:col-span-2"><Notice kind="ok">{state.ok}</Notice></div>}

      <div className="sm:col-span-2">
        <label htmlFor="name" className="label">Nama perpustakaan</label>
        <input id="name" name="name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Taman Baca Melati" className="field" />
      </div>
      {!editing && (
        <div className="sm:col-span-2">
          <label htmlFor="slugInput" className="label">Alamat halaman</label>
          <div className="flex items-center overflow-hidden rounded-md border border-line bg-sheet focus-within:border-shelf">
            <span className="shrink-0 border-r border-line bg-paper px-3 py-2 text-sm text-muted">/p/</span>
            <input
              id="slugInput"
              name="slug"
              value={shownSlug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
              className="w-full px-3 py-2 text-sm focus:outline-none"
              aria-describedby="slug-help"
            />
          </div>
          <p id="slug-help" className="mt-1 text-xs text-muted">Bagikan alamat ini ke calon anggota. Tidak bisa diubah setelah dibuat.</p>
        </div>
      )}
      <div>
        <label htmlFor="city" className="label">Kota</label>
        <input id="city" name="city" defaultValue={library?.city ?? ""} className="field" />
      </div>
      <div>
        <label htmlFor="address" className="label">Alamat</label>
        <input id="address" name="address" defaultValue={library?.address ?? ""} className="field" />
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="description" className="label">Tentang perpustakaan</label>
        <textarea id="description" name="description" rows={3} defaultValue={library?.description ?? ""} className="field" placeholder="Jam buka, koleksi unggulan, siapa yang boleh bergabung" />
      </div>

      {editing && (
        <fieldset className="grid gap-4 border-t border-line pt-4 sm:col-span-2 sm:grid-cols-3">
          <legend className="mb-2 font-serif text-lg font-bold">Aturan peminjaman</legend>
          <div>
            <label htmlFor="loanDays" className="label">Lama pinjam (hari)</label>
            <input id="loanDays" name="loanDays" type="number" min={1} max={365} defaultValue={library.loanDays} className="field" />
          </div>
          <div>
            <label htmlFor="maxLoans" className="label">Maks. buku per anggota</label>
            <input id="maxLoans" name="maxLoans" type="number" min={1} max={100} defaultValue={library.maxLoans} className="field" />
          </div>
          <div>
            <label htmlFor="finePerDay" className="label">Denda per hari (Rp)</label>
            <input id="finePerDay" name="finePerDay" type="number" min={0} step={100} defaultValue={library.finePerDay} className="field" />
          </div>
          <label className="flex items-center gap-2 text-sm sm:col-span-3">
            <input type="checkbox" name="openJoin" defaultChecked={library.openJoin} className="h-4 w-4 accent-[#1f3d34]" />
            Siapa saja boleh bergabung jadi anggota lewat halaman katalog
          </label>
        </fieldset>
      )}

      <div className="sm:col-span-2">
        <button className="btn-primary" disabled={pending}>{pending ? "Menyimpan…" : submit}</button>
      </div>
    </form>
  );
}
