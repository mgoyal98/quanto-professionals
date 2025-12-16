import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { invoicesTable } from './invoices';
import { itemsTable } from './items';

/**
 * Invoice line items.
 * Tax and discount details are stored in the separate `invoice_item_taxes_discounts` table
 * and linked via invoiceItemId for normalization and easy grouping by rate.
 */
export const invoiceItemsTable = sqliteTable('invoice_items', {
  id: integer().primaryKey({ autoIncrement: true }),
  invoiceId: integer()
    .notNull()
    .references(() => invoicesTable.id, { onDelete: 'cascade' }),
  itemId: integer().references(() => itemsTable.id),
  name: text().notNull(),
  description: text(),
  hsnCode: text(),
  quantity: real().notNull().default(1),
  unit: text().notNull().default('NOS'),
  rate: real().notNull(),

  // Base amount (quantity * rate)
  amount: real().notNull(),

  // Taxable amount (amount after any item-level discount)
  taxableAmount: real().notNull(),

  // Summary totals (calculated from invoice_item_taxes_discounts entries)
  totalDiscount: real().notNull().default(0),
  totalTax: real().notNull().default(0),
  total: real().notNull(),

  // Order
  sortOrder: integer().notNull().default(0),
});
