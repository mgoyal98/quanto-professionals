import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const invoiceFormatsTable = sqliteTable('invoice_formats', {
  id: integer().primaryKey({ autoIncrement: true }),

  // Basic info
  name: text().notNull().unique(),
  description: text(),

  // Template content
  htmlTemplate: text().notNull(),
  cssStyles: text().notNull(),

  // Metadata
  isDefault: integer({ mode: 'boolean' }).notNull().default(false),
  isActive: integer({ mode: 'boolean' }).notNull().default(true),
  isSystemTemplate: integer({ mode: 'boolean' }).notNull().default(false),

  // Paper settings
  paperSize: text().notNull().default('A4'), // 'A4' | 'Letter' | 'Legal'
  orientation: text().notNull().default('portrait'), // 'portrait' | 'landscape'
  marginTop: real().notNull().default(10), // in mm
  marginRight: real().notNull().default(10),
  marginBottom: real().notNull().default(10),
  marginLeft: real().notNull().default(10),

  createdAt: integer({ mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer({ mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});
