import { and, asc, eq, gt, isNotNull, isNull } from "drizzle-orm";
import { payFineAction, returnLoanAction } from "@/app/actions";
import { requireLibAdmin } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { formatDate, formatRupiah } from "@/lib/format";
import { calcFine, loanStatus } from "@/lib/rules";
import { LoanForm } from "@/components/LoanForm";
import { StatusBadge } from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sirkulasi" };
const { loans, books, users, memberships } = schema;

export default async function Sirkulasi({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { library } = await requireLibAdmin(slug);
  const db = await getDb();
  const now = new Date();
  const lib = library.id;
  const memberJoin = and(eq(memberships.userId, loans.userId), eq(memberships.libraryId, lib));

  const [members, available, active, fines] = await Promise.all([
    db
      .select({ code: memberships.memberCode, name: users.name })
      .from(memberships)
      .innerJoin(users, eq(users.id, memberships.userId))
      .where(and(eq(memberships.libraryId, lib), eq(memberships.active, true)))
      .orderBy(asc(users.name)),
    db
      .select({ id: books.id, title: books.title, available: books.availableCopies })
      .from(books)
      .where(and(eq(books.libraryId, lib), gt(books.availableCopies, 0)))
      .orderBy(asc(books.title)),
    db
      .select({ l: loans, title: books.title, member: users.name, code: memberships.memberCode })
      .from(loans)
      .innerJoin(books, eq(loans.bookId, books.id))
      .innerJoin(users, eq(loans.userId, users.id))
      .leftJoin(memberships, memberJoin)
      .where(and(eq(loans.libraryId, lib), isNull(loans.returnedAt)))
      .orderBy(asc(loans.dueAt)),
    db
      .select({ l: loans, title: books.title, member: users.name })
      .from(loans)
      .innerJoin(books, eq(loans.bookId, books.id))
      .innerJoin(users, eq(loans.userId, users.id))
      .where(and(eq(loans.libraryId, lib), isNotNull(loans.returnedAt), eq(loans.finePaid, false), gt(loans.fine, 0)))
      .orderBy(asc(loans.returnedAt)),
  ]);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-shelf sm:text-3xl">Sirkulasi</h1>
      <div className="grid gap-6 lg:grid-cols-[22rem_1fr]">
        <div className="space-y-6">
          <LoanForm slug={slug} members={members} books={available} loanDays={library.loanDays} />
          {fines.length > 0 && (
            <section className="panel p-5">
              <h2 className="mb-3 text-lg font-bold">Denda belum lunas</h2>
              <ul className="divide-y divide-line">
                {fines.map(({ l, title, member }) => (
                  <li key={l.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="text-sm">
                      <p className="font-medium">{member}</p>
                      <p className="text-muted">{title}</p>
                    </div>
                    <form action={payFineAction} className="text-right">
                      <input type="hidden" name="slug" value={slug} />
                      <input type="hidden" name="id" value={l.id} />
                      <p className="text-sm font-semibold text-late">{formatRupiah(l.fine)}</p>
                      <button className="text-sm font-medium text-shelf underline">Tandai lunas</button>
                    </form>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <section>
          <h2 className="mb-3 text-xl font-bold">Sedang dipinjam ({active.length})</h2>
          {active.length === 0 ? (
            <p className="panel p-6 text-center text-muted">Semua buku sudah kembali ke rak.</p>
          ) : (
            <ul className="space-y-3">
              {active.map(({ l, title, member, code }) => {
                const fine = calcFine(l.dueAt, now, library.finePerDay);
                return (
                  <li key={l.id} className="panel flex flex-wrap items-center justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <p className="font-serif font-bold">{title}</p>
                      <p className="text-sm text-muted">{member}{code ? ` · ${code}` : ""}</p>
                      <p className="mt-1 text-sm">
                        <StatusBadge status={loanStatus(l, now)} /> <span className="text-muted">kembali {formatDate(l.dueAt)}</span>
                        {fine > 0 && <span className="text-late"> · denda {formatRupiah(fine)}</span>}
                      </p>
                    </div>
                    <form action={returnLoanAction}>
                      <input type="hidden" name="slug" value={slug} />
                      <input type="hidden" name="id" value={l.id} />
                      <button className="btn-ghost">Terima kembali</button>
                    </form>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
