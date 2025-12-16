import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { customersTable } from './customers';
import { invoiceSeriesTable } from './invoice-series';
import { paymentMethodsTable } from './payment-methods';
import { taxTemplatesTable } from './tax-templates';
import { invoiceFormatsTable } from './invoice-formats';

export const invoicesTable = sqliteTable('invoices', {
  id: integer().primaryKey({ autoIncrement: true }),
  invoiceNumber: text().notNull().unique(),
  invoiceSeriesId: integer()
    .notNull()
    .references(() => invoiceSeriesTable.id),
  customerId: integer()
    .notNull()
    .references(() => customersTable.id),
  invoiceFormatId: integer().references(() => invoiceFormatsTable.id),
  invoiceDate: integer({ mode: 'timestamp' }).notNull(),
  dueDate: integer({ mode: 'timestamp' }),

  // GST type (determined at invoice creation from customer state)
  gstType: text().notNull().default('INTRA'), // 'INTRA' | 'INTER'

  // Totals
  subTotal: real().notNull().default(0),
  totalItemDiscount: real().notNull().default(0),
  taxableTotal: real().notNull().default(0),
  totalCgst: real().notNull().default(0),
  totalSgst: real().notNull().default(0),
  totalIgst: real().notNull().default(0),
  totalCess: real().notNull().default(0),
  totalTax: real().notNull().default(0),

  // Additional tax (overall level)
  additionalTaxTemplateId: integer().references(() => taxTemplatesTable.id),
  additionalTaxName: text(),
  additionalTaxRate: real().notNull().default(0),
  additionalTaxAmount: real().notNull().default(0),

  // Invoice-level discount
  discountType: text(), // 'PERCENT' | 'AMOUNT'
  discountValue: real(),
  discountAmount: real().notNull().default(0),
  discountAfterTax: integer({ mode: 'boolean' }).notNull().default(false),

  // Final amounts
  grandTotal: real().notNull().default(0),
  paidAmount: real().notNull().default(0),
  dueAmount: real().notNull().default(0),

  // Payment method
  paymentMethodId: integer().references(() => paymentMethodsTable.id),

  // Notes and status
  notes: text(),
  status: text().notNull().default('UNPAID'), // UNPAID | PARTIALLY_PAID | PAID | CANCELLED
  cancelReason: text(),

  // Reverse charge applicable (Y/N)
  reverseCharge: integer({ mode: 'boolean' }).notNull().default(false),

  isArchived: integer({ mode: 'boolean' }).notNull().default(false),
  createdAt: integer({ mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer({ mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});
