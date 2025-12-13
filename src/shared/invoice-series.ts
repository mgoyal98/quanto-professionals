import { invoiceSeriesTable } from '@db/schema/invoice-series';
import { InferSelectModel } from 'drizzle-orm';

export type InvoiceSeries = InferSelectModel<typeof invoiceSeriesTable>;

export interface CreateInvoiceSeriesRequest {
  name: string;
  prefix?: string;
  suffix?: string;
  startWith?: number;
  isDefault?: boolean;
}

export interface UpdateInvoiceSeriesRequest {
  id: number;
  name: string;
  prefix?: string;
  suffix?: string;
  startWith?: number;
  isDefault?: boolean;
}

/**
 * Generate the invoice number string from a series
 * @param prefix - The prefix (e.g., "INV-")
 * @param number - The invoice number
 * @param suffix - The suffix (e.g., "-A")
 * @param padding - Zero-padding length (default: 4)
 * @returns Formatted invoice number (e.g., "INV-0001-A")
 */
export function formatInvoiceNumber(
  prefix: string | null | undefined,
  number: number,
  suffix: string | null | undefined,
  padding: number = 4
): string {
  const paddedNumber = number.toString().padStart(padding, '0');
  return `${prefix || ''}${paddedNumber}${suffix || ''}`;
}

/**
 * Preview what the next invoice number will look like
 */
export function previewNextInvoiceNumber(
  series: Pick<InvoiceSeries, 'prefix' | 'suffix' | 'nextNumber'>,
  padding: number = 4
): string {
  return formatInvoiceNumber(
    series.prefix,
    series.nextNumber,
    series.suffix,
    padding
  );
}

