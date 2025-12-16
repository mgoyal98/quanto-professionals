import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { invoicesTable } from './invoices';
import { taxTemplatesTable } from './tax-templates';
import { discountTemplatesTable } from './discount-templates';

/**
 * Stores invoice-level tax (charges) and discount entries.
 * Each invoice can have multiple entries of different types.
 *
 * Entry Types:
 * - 'TAX': Additional tax/charge (e.g., TCS, Service Charge, Convenience Fee)
 * - 'DISCOUNT': Invoice-level discount (e.g., Early Payment, Loyalty, Bulk)
 *
 * Application Modes:
 * - 'BEFORE_TAX': Applied to taxable amount (before GST)
 * - 'AFTER_TAX': Applied to grand total (after all taxes)
 */
export const invoiceTaxesDiscountsTable = sqliteTable(
  'invoice_taxes_discounts',
  {
    id: integer().primaryKey({ autoIncrement: true }),
    invoiceId: integer()
      .notNull()
      .references(() => invoicesTable.id, { onDelete: 'cascade' }),

    // Entry type: TAX (charge) or DISCOUNT
    entryType: text().notNull(), // 'TAX' | 'DISCOUNT'

    // Reference to template (optional - for quick selection and default values)
    taxTemplateId: integer().references(() => taxTemplatesTable.id),
    discountTemplateId: integer().references(() => discountTemplatesTable.id),

    // Snapshot of name and rate at invoice creation time
    name: text().notNull(),

    // Rate type and value
    rateType: text().notNull().default('PERCENT'), // 'PERCENT' | 'AMOUNT'
    rate: real().notNull(), // Percentage or fixed amount

    // When to apply this entry
    applicationMode: text().notNull().default('AFTER_TAX'), // 'BEFORE_TAX' | 'AFTER_TAX'

    // Base amount for calculation (snapshot at creation)
    baseAmount: real().notNull(),

    // Calculated amount
    amount: real().notNull(),

    // Display order
    sortOrder: integer().notNull().default(0),
  }
);
