"use client";
import { useActionState } from "react";
import { saveBookAction } from "@/app/actions";
import type { Book } from "@/lib/db/schema";
import { Notice } from "./ui";

export function BookForm({ slug, book, categories }: { slug: string; book?: Book; categories: { id: number; name: string }[] }) {
  const [state, action, pending] = useActionState(saveBookAction, undefined);
  const F = ({ name, label, type = "text", value, span }: { name: string; label: string; type?: string; value?: string | number | null; span?: boolean }) => (
    <div className={span ? "sm:col-span-2" : ""}>
      <label htmlFor={name} className="label">{label}</label>
      <input id={name} name={name} type={type} defaultValue={value ?? ""} className="field" />
    </div>
  );
  return (
    <form action={action} className="panel grid gap-4 p-5 sm:grid-cols-2">
      <input type="hidden" name="slug" value={slug} />
      {book && <input type="hidden" name="id" value={book.id} />}
      {state?.error && <div className="sm:col-span-2"><Notice kind="error">{state.error}</Notice></div>}
      <F name="title" label="Judul" value={book?.title} span />
      <F name="author" label="Penulis" value={book?.author} />
      <F name="publisher" label="Penerbit" value={book?.publisher} />
      <F name="isbn" label="ISBN" value={book?.isbn} />
      <F name="year" label="Tahun terbit" type="number" value={book?.year} />
      <div>
        <label htmlFor="categoryId" className="label">Kategori</label>
        <select id="categoryId" name="categoryId" defaultValue={book?.categoryId ?? ""} className="field">
          <option value="">Tanpa kategori</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <F name="newCategory" label="Atau kategori baru" />
      <F name="shelf" label="Lokasi rak" value={book?.shelf} />
      <F name="totalCopies" label="Jumlah eksemplar" type="number" value={book?.totalCopies ?? 1} />
      <div className="sm:col-span-2">
        <label htmlFor="description" className="label">Sinopsis</label>
        <textarea id="description" name="description" rows={4} defaultValue={book?.description ?? ""} className="field" />
      </div>
      <div className="sm:col-span-2">
        <button className="btn-primary" disabled={pending}>{pending ? "Menyimpan…" : book ? "Simpan perubahan" : "Tambah buku"}</button>
      </div>
    </form>
  );
}
