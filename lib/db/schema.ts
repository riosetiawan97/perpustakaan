import { boolean, integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  phone: text("phone"),
  address: text("address"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const libraries = pgTable("libraries", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  city: text("city"),
  address: text("address"),
  description: text("description"),
  loanDays: integer("loan_days").notNull().default(7),
  maxLoans: integer("max_loans").notNull().default(3),
  finePerDay: integer("fine_per_day").notNull().default(1000),
  openJoin: boolean("open_join").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const memberships = pgTable("memberships", {
  id: serial("id").primaryKey(),
  libraryId: integer("library_id").notNull().references(() => libraries.id),
  userId: integer("user_id").notNull().references(() => users.id),
  role: text("role", { enum: ["admin", "member"] }).notNull().default("member"),
  memberCode: text("member_code").notNull(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  libraryId: integer("library_id").references(() => libraries.id),
  name: text("name").notNull(),
});

export const books = pgTable("books", {
  id: serial("id").primaryKey(),
  libraryId: integer("library_id").references(() => libraries.id),
  isbn: text("isbn"),
  title: text("title").notNull(),
  author: text("author").notNull(),
  publisher: text("publisher"),
  year: integer("year"),
  categoryId: integer("category_id").references(() => categories.id),
  description: text("description"),
  shelf: text("shelf"),
  totalCopies: integer("total_copies").notNull().default(1),
  availableCopies: integer("available_copies").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const loans = pgTable("loans", {
  id: serial("id").primaryKey(),
  libraryId: integer("library_id").references(() => libraries.id),
  bookId: integer("book_id").notNull().references(() => books.id),
  userId: integer("user_id").notNull().references(() => users.id),
  borrowedAt: timestamp("borrowed_at", { withTimezone: true }).notNull().defaultNow(),
  dueAt: timestamp("due_at", { withTimezone: true }).notNull(),
  returnedAt: timestamp("returned_at", { withTimezone: true }),
  fine: integer("fine").notNull().default(0),
  finePaid: boolean("fine_paid").notNull().default(false),
});

export type User = typeof users.$inferSelect;
export type Library = typeof libraries.$inferSelect;
export type Membership = typeof memberships.$inferSelect;
export type Book = typeof books.$inferSelect;
export type Loan = typeof loans.$inferSelect;
