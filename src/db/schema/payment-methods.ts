import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const paymentMethodsTable = sqliteTable('payment_methods', {
  id: integer().primaryKey({ autoIncrement: true }),
  name: text().notNull(),
  type: text().notNull(), // 'CASH' | 'BANK_TRANSFER' | 'UPI' | 'CHEQUE' | 'CARD' | 'ONLINE' | 'OTHER'
  description: text(),
  instructions: text(),
  bankName: text(),
  accountNumber: text(),
  ifscCode: text(),
  accountHolder: text(),
  branchName: text(),
  upiId: text(),
  isDefault: integer({ mode: 'boolean' }).notNull().default(false),
  isActive: integer({ mode: 'boolean' }).notNull().default(true),
  createdAt: integer({ mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer({ mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

