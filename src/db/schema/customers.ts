import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const customersTable = sqliteTable('customers', {
  id: integer().primaryKey({ autoIncrement: true }),
  name: text().notNull(),
  pan: text(),
  gstin: text(),
  phone: text(),
  email: text(),
  addressLine1: text(),
  addressLine2: text(),
  city: text().notNull(),
  pinCode: text(),
  state: text().notNull(),
  stateCode: text().notNull(),
  isArchived: integer({ mode: 'boolean' }).notNull().default(false),
  createdAt: integer({ mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`), // seconds since epoch
  updatedAt: integer({ mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`), // default only for initial insert
});
