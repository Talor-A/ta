import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const guestBook = sqliteTable("guestBook", {
  id: integer().primaryKey({ autoIncrement: true }),
  name: text().notNull(),
  email: text().notNull().unique(),
});

export const testPosts = sqliteTable("testPosts", {
  id: integer().primaryKey({ autoIncrement: true }),
  title: text().notNull(),
  content: text().notNull(),
});

export const blogPosts = sqliteTable("blogPosts", {
  id: integer().primaryKey({ autoIncrement: true }),
  slug: text().notNull().unique(),
  title: text().notNull(),
  body: text().notNull(),
  publishedDate: integer(),
});
