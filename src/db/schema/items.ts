import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { taxTemplatesTable } from './tax-templates';

export const itemsTable = sqliteTable('items', {
  id: integer().primaryKey({ autoIncrement: true }),
  name: text().notNull(),
  description: text(),
  hsnCode: text(),
  rate: real().notNull().default(0),
  unit: text().notNull().default('NOS'),
  taxTemplateId: integer().references(() => taxTemplatesTable.id),
  cessTemplateId: integer().references(() => taxTemplatesTable.id),
  isActive: integer({ mode: 'boolean' }).notNull().default(true),
  createdAt: integer({ mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer({ mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

