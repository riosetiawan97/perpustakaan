import { boolean, integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["admin", "member"] }).notNull().default("member"),
  memberCode: text("member_code"),
  phone: text("phone"),
  address: text("address"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
});

export const books = pgTable("books", {
  id: serial("id").primaryKey(),
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
  bookId: integer("book_id").notNull().references(() => books.id),
  userId: integer("user_id").notNull().references(() => users.id),
  borrowedAt: timestamp("borrowed_at", { withTimezone: true }).notNull().defaultNow(),
  dueAt: timestamp("due_at", { withTimezone: true }).notNull(),
  returnedAt: timestamp("returned_at", { withTimezone: true }),
  fine: integer("fine").notNull().default(0),
  finePaid: boolean("fine_paid").notNull().default(false),
});

export type User = typeof users.$inferSelect;
export type Book = typeof books.$inferSelect;
export type Loan = typeof loans.$inferSelect;
