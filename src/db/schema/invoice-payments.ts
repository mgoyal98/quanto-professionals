import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { invoicesTable } from './invoices';
import { paymentMethodsTable } from './payment-methods';

export const invoicePaymentsTable = sqliteTable('invoice_payments', {
  id: integer().primaryKey({ autoIncrement: true }),
  invoiceId: integer()
    .notNull()
    .references(() => invoicesTable.id, { onDelete: 'cascade' }),
  paymentMethodId: integer().references(() => paymentMethodsTable.id),
  amount: real().notNull(),
  paymentDate: integer({ mode: 'timestamp' }).notNull(),
  referenceNumber: text(),
  notes: text(),
  createdAt: integer({ mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});
