import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { invoiceItemsTable } from './invoice-items';
import { taxTemplatesTable } from './tax-templates';
import { discountTemplatesTable } from './discount-templates';

/**
 * Stores individual tax and discount entries for each invoice item.
 * This allows for flexible tax/discount application and easy grouping by rate.
 *
 * When displaying on invoices, group by (type, name, rate) to show:
 * - "CGST @ 9%" with total taxable amount and total tax
 * - "SGST @ 9%" with total taxable amount and total tax
 * - etc.
 */
export const invoiceItemTaxesDiscountsTable = sqliteTable(
  'invoice_item_taxes_discounts',
  {
    id: integer().primaryKey({ autoIncrement: true }),
    invoiceItemId: integer()
      .notNull()
      .references(() => invoiceItemsTable.id, { onDelete: 'cascade' }),

    // Reference to the original template (optional - for grouping and display)
    // Can be null if custom rate was entered
    taxTemplateId: integer().references(() => taxTemplatesTable.id),
    discountTemplateId: integer().references(() => discountTemplatesTable.id),

    // Type of entry: TAX (CGST/SGST/IGST), CESS, DISCOUNT, CHARGE
    type: text().notNull(), // 'CGST' | 'SGST' | 'IGST' | 'CESS' | 'DISCOUNT' | 'CHARGE'

    // Snapshot of name and rate at the time of invoice creation
    name: text().notNull(),
    rate: real().notNull(), // Percentage rate

    // For discounts that can be flat amounts
    rateType: text().notNull().default('PERCENT'), // 'PERCENT' | 'AMOUNT'

    // Calculation basis
    taxableAmount: real().notNull(), // Base amount for calculation

    // Calculated amount
    amount: real().notNull(),

    // Order for display
    sortOrder: integer().notNull().default(0),
  }
);
