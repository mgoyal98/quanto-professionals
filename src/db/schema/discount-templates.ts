import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const discountTemplatesTable = sqliteTable('discount_templates', {
  id: integer().primaryKey({ autoIncrement: true }),
  name: text().notNull(),
  type: text().notNull().default('PERCENT'), // 'PERCENT' | 'AMOUNT'
  value: real().notNull(),
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

