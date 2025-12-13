import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const invoiceSeriesTable = sqliteTable('invoice_series', {
  id: integer().primaryKey({ autoIncrement: true }),
  name: text().notNull(),
  prefix: text(),
  suffix: text(),
  startWith: integer().notNull().default(1),
  nextNumber: integer().notNull().default(1),
  isDefault: integer({ mode: 'boolean' }).notNull().default(false),
  isArchived: integer({ mode: 'boolean' }).notNull().default(false),
  createdAt: integer({ mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer({ mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

