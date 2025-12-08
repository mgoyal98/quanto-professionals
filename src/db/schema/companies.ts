import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const companiesTable = sqliteTable('companies', {
  id: integer().primaryKey({ autoIncrement: true }),
  name: text().notNull(),
  profession: text(),
  pan: text(),
  gstin: text(),
  addressLine1: text(),
  addressLine2: text(),
  city: text().notNull(),
  pinCode: text().notNull(),
  state: text().notNull(),
  stateCode: text().notNull(),
  phone: text(),
  email: text(),
  createdAt: integer({ mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`), // seconds since epoch
  updatedAt: integer({ mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`), // default only for initial insert
});
