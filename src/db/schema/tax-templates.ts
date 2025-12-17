import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const taxTemplatesTable = sqliteTable('tax_templates', {
  id: integer().primaryKey({ autoIncrement: true }),
  name: text().notNull(),
  rate: real().notNull(),
  rateType: text().notNull().default('PERCENT'), // 'PERCENT' | 'AMOUNT' - Only applicable for CUSTOM taxes
  taxType: text().notNull().default('GST'), // 'GST' | 'CESS' | 'CUSTOM'
  description: text(),
  isDefault: integer({ mode: 'boolean' }).notNull().default(false),
  isActive: integer({ mode: 'boolean' }).notNull().default(true),
  createdAt: integer({ mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer({ mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});
