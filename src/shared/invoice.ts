import { invoicesTable } from '@db/schema/invoices';
import { invoiceItemsTable } from '@db/schema/invoice-items';
import { invoiceItemTaxesDiscountsTable } from '@db/schema/invoice-item-taxes-discounts';
import { invoiceTaxesDiscountsTable } from '@db/schema/invoice-taxes-discounts';
import { invoicePaymentsTable } from '@db/schema/invoice-payments';
import { InferSelectModel } from 'drizzle-orm';
import { Customer } from './customer';
import { InvoiceSeries } from './invoice-series';
import { PaymentMethod } from './payment-method';
import {
  calculateGstBreakdown,
  calculateCess,
  roundToTwo,
} from './tax-template';
import { DiscountType, calculateDiscount } from './discount';

// ============================================
// Database Model Types
// ============================================

export type Invoice = InferSelectModel<typeof invoicesTable>;
export type InvoiceItem = InferSelectModel<typeof invoiceItemsTable>;
export type InvoiceItemTaxDiscount = InferSelectModel<
  typeof invoiceItemTaxesDiscountsTable
>;
export type InvoiceTaxDiscount = InferSelectModel<
  typeof invoiceTaxesDiscountsTable
>;
export type InvoicePayment = InferSelectModel<typeof invoicePaymentsTable>;

// ============================================
// Tax/Discount Entry Types
// ============================================

export type TaxDiscountType =
  | 'CGST'
  | 'SGST'
  | 'IGST'
  | 'CESS'
  | 'DISCOUNT'
  | 'CHARGE';

export interface TaxDiscountEntry {
  type: TaxDiscountType;
  taxTemplateId?: number | null;
  discountTemplateId?: number | null;
  name: string;
  rate: number;
  rateType: 'PERCENT' | 'AMOUNT';
  taxableAmount: number;
  amount: number;
  sortOrder: number;
}

// ============================================
// Invoice-Level Tax/Discount Entry Types
// ============================================

export type InvoiceTaxDiscountEntryType = 'TAX' | 'DISCOUNT';
export type ApplicationMode = 'BEFORE_TAX' | 'AFTER_TAX';
export type RateType = 'PERCENT' | 'AMOUNT';

export interface InvoiceTaxDiscountEntry {
  id?: number;
  entryType: InvoiceTaxDiscountEntryType;
  taxTemplateId?: number | null;
  discountTemplateId?: number | null;
  name: string;
  rateType: RateType;
  rate: number;
  applicationMode: ApplicationMode;
  baseAmount: number;
  amount: number;
  sortOrder: number;
}

export interface InvoiceTaxDiscountInput {
  entryType: InvoiceTaxDiscountEntryType;
  taxTemplateId?: number | null;
  discountTemplateId?: number | null;
  name: string;
  rateType: RateType;
  rate: number;
  applicationMode: ApplicationMode;
  sortOrder?: number;
}

export interface InvoiceTaxDiscountCalculation {
  entries: InvoiceTaxDiscountEntry[];
  totalBeforeTaxAdditions: number;
  totalBeforeTaxDiscounts: number;
  totalAfterTaxAdditions: number;
  totalAfterTaxDiscounts: number;
  totalAdditionalTax: number;
  totalInvoiceDiscount: number;
}

// ============================================
// Invoice Status
// ============================================

export const INVOICE_STATUSES = [
  'UNPAID',
  'PARTIALLY_PAID',
  'PAID',
  'CANCELLED',
] as const;

export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  UNPAID: 'Unpaid',
  PARTIALLY_PAID: 'Partially Paid',
  PAID: 'Paid',
  CANCELLED: 'Cancelled',
};

export const INVOICE_STATUS_COLORS: Record<
  InvoiceStatus,
  'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info'
> = {
  UNPAID: 'info',
  PARTIALLY_PAID: 'warning',
  PAID: 'success',
  CANCELLED: 'error',
};

// ============================================
// GST Type
// ============================================

export type GstType = 'INTRA' | 'INTER';

// ============================================
// Extended Types for Display
// ============================================

export interface InvoiceWithDetails extends Invoice {
  customer?: Customer;
  invoiceSeries?: InvoiceSeries;
  paymentMethod?: PaymentMethod;
  items?: InvoiceItemWithDetails[];
  payments?: InvoicePaymentWithDetails[];
  taxDiscountEntries?: InvoiceTaxDiscount[];
}

export interface InvoiceItemWithDetails extends InvoiceItem {
  taxesDiscounts?: InvoiceItemTaxDiscount[];
}

export interface InvoicePaymentWithDetails extends InvoicePayment {
  paymentMethod?: PaymentMethod | null;
}

// ============================================
// Request Types
// ============================================

export interface InvoiceItemInput {
  itemId?: number | null;
  name: string;
  description?: string;
  hsnCode?: string;
  quantity: number;
  unit: string;
  rate: number;
  // Tax can come from template OR custom rate (one or the other)
  taxTemplateId?: number | null;
  customTaxRate?: number | null; // Used when taxTemplateId is null
  cessTemplateId?: number | null;
  customCessRate?: number | null; // Used when cessTemplateId is null
  // Item-level discount
  discountType?: DiscountType | null;
  discountValue?: number;
  discountTemplateId?: number | null;
  sortOrder?: number;
}

export interface CreateInvoiceRequest {
  invoiceSeriesId: number;
  customerId: number;
  invoiceFormatId?: number | null;
  invoiceDate: Date;
  items: InvoiceItemInput[];
  // Additional tax (overall level) - DEPRECATED: use taxDiscountEntries instead
  additionalTaxTemplateId?: number | null;
  additionalTaxRate?: number;
  // Invoice-level discount - DEPRECATED: use taxDiscountEntries instead
  discountType?: DiscountType | null;
  discountValue?: number;
  discountAfterTax?: boolean;
  // NEW: Multiple tax/discount entries
  taxDiscountEntries?: InvoiceTaxDiscountInput[];
  paymentMethodId?: number | null;
  notes?: string;
  status?: InvoiceStatus;
  // Payment info (for Paid status on creation)
  paidAmount?: number;
  paidDate?: Date | string; // Can be string through IPC serialization
  // Reverse charge applicable (Y/N)
  reverseCharge?: boolean;
}

export interface UpdateInvoiceRequest {
  id: number;
  invoiceFormatId?: number | null;
  invoiceDate?: Date;
  items?: InvoiceItemInput[];
  // Additional tax (overall level) - DEPRECATED: use taxDiscountEntries instead
  additionalTaxTemplateId?: number | null;
  additionalTaxRate?: number;
  // Invoice-level discount - DEPRECATED: use taxDiscountEntries instead
  discountType?: DiscountType | null;
  discountValue?: number;
  discountAfterTax?: boolean;
  // NEW: Multiple tax/discount entries
  taxDiscountEntries?: InvoiceTaxDiscountInput[];
  paymentMethodId?: number | null;
  notes?: string;
  // Reverse charge applicable (Y/N)
  reverseCharge?: boolean;
}

export interface UpdateInvoiceStatusRequest {
  id: number;
  status: InvoiceStatus;
  cancelReason?: string;
}

export interface RecordPaymentRequest {
  invoiceId: number;
  paymentMethodId: number; // Required
  amount: number;
  paymentDate: Date;
  referenceNumber?: string;
  notes?: string;
}

// ============================================
// List/Filter Types
// ============================================

export interface InvoiceListParams {
  search?: string;
  status?: InvoiceStatus;
  customerId?: number;
  dateFrom?: Date;
  dateTo?: Date;
  isArchived?: boolean;
  limit?: number;
  offset?: number;
}

export interface InvoiceListResponse {
  invoices: InvoiceWithDetails[];
  total: number;
  limit: number;
  offset: number;
}

// ============================================
// Calculation Types
// ============================================

export interface CalculatedInvoiceItem {
  name: string;
  description?: string;
  hsnCode?: string;
  quantity: number;
  unit: string;
  rate: number;
  amount: number;
  taxableAmount: number;
  totalDiscount: number;
  totalTax: number;
  total: number;
  // Individual tax/discount entries for storage
  taxesDiscounts: TaxDiscountEntry[];
}

export interface InvoiceCalculation {
  items: CalculatedInvoiceItem[];
  subTotal: number;
  totalItemDiscount: number;
  taxableTotal: number;
  totalCgst: number;
  totalSgst: number;
  totalIgst: number;
  totalCess: number;
  totalTax: number;
  additionalTaxAmount: number;
  discountAmount: number;
  grandTotal: number;
}

// ============================================
// Tax Summary for Display (Grouped by Tax ID/Rate)
// ============================================

export interface TaxSummaryRow {
  taxTemplateId?: number | null;
  type: TaxDiscountType;
  name: string;
  rate: number;
  taxableAmount: number;
  amount: number;
}

export interface TaxSummary {
  // All entries grouped by (type, name, rate)
  entries: TaxSummaryRow[];
  // Totals by type
  totalCgst: number;
  totalSgst: number;
  totalIgst: number;
  totalCess: number;
  totalDiscount: number;
  totalCharges: number;
  grandTotalTax: number;
}

// ============================================
// Calculation Functions
// ============================================

/**
 * Calculate a single invoice line item and generate tax/discount entries
 */
export function calculateInvoiceItem(input: {
  quantity: number;
  rate: number;
  discountType?: DiscountType | null;
  discountValue?: number;
  discountTemplateId?: number | null;
  discountName?: string;
  taxRate: number;
  taxTemplateId?: number | null;
  taxTemplateName?: string;
  cessRate: number;
  cessTemplateId?: number | null;
  cessTemplateName?: string;
  gstType: GstType;
}): {
  amount: number;
  taxableAmount: number;
  totalDiscount: number;
  totalTax: number;
  total: number;
  taxesDiscounts: TaxDiscountEntry[];
} {
  const {
    quantity,
    rate,
    discountType,
    discountValue,
    discountTemplateId,
    discountName,
    taxRate,
    taxTemplateId,
    taxTemplateName,
    cessRate,
    cessTemplateId,
    cessTemplateName,
    gstType,
  } = input;

  const taxesDiscounts: TaxDiscountEntry[] = [];
  let sortOrder = 0;

  // 1. Calculate base amount
  const amount = roundToTwo(quantity * rate);

  // 2. Calculate discount if any
  let totalDiscount = 0;
  let taxableAmount = amount;

  if (discountType && discountValue && discountValue > 0) {
    const discountResult = calculateDiscount(amount, {
      type: discountType,
      value: discountValue,
    });
    totalDiscount = discountResult.discountAmount;
    taxableAmount = discountResult.amountAfterDiscount;

    // Add discount entry
    taxesDiscounts.push({
      type: 'DISCOUNT',
      discountTemplateId: discountTemplateId ?? null,
      name:
        discountName ??
        `Discount ${discountType === 'PERCENT' ? `${discountValue}%` : `₹${discountValue}`}`,
      rate: discountValue,
      rateType: discountType,
      taxableAmount: amount,
      amount: discountResult.discountAmount,
      sortOrder: sortOrder++,
    });
  }

  // 3. Calculate GST breakdown and create entries
  const gstBreakdown = calculateGstBreakdown(taxableAmount, taxRate, gstType);
  let totalTax = 0;

  if (gstType === 'INTRA') {
    // CGST
    if (gstBreakdown.cgstRate > 0) {
      taxesDiscounts.push({
        type: 'CGST',
        taxTemplateId: taxTemplateId ?? null,
        name: `CGST @ ${gstBreakdown.cgstRate}%`,
        rate: gstBreakdown.cgstRate,
        rateType: 'PERCENT',
        taxableAmount,
        amount: gstBreakdown.cgstAmount,
        sortOrder: sortOrder++,
      });
      totalTax += gstBreakdown.cgstAmount;
    }
    // SGST
    if (gstBreakdown.sgstRate > 0) {
      taxesDiscounts.push({
        type: 'SGST',
        taxTemplateId: taxTemplateId ?? null,
        name: `SGST @ ${gstBreakdown.sgstRate}%`,
        rate: gstBreakdown.sgstRate,
        rateType: 'PERCENT',
        taxableAmount,
        amount: gstBreakdown.sgstAmount,
        sortOrder: sortOrder++,
      });
      totalTax += gstBreakdown.sgstAmount;
    }
  } else {
    // IGST
    if (gstBreakdown.igstRate > 0) {
      taxesDiscounts.push({
        type: 'IGST',
        taxTemplateId: taxTemplateId ?? null,
        name: `IGST @ ${gstBreakdown.igstRate}%`,
        rate: gstBreakdown.igstRate,
        rateType: 'PERCENT',
        taxableAmount,
        amount: gstBreakdown.igstAmount,
        sortOrder: sortOrder++,
      });
      totalTax += gstBreakdown.igstAmount;
    }
  }

  // 4. Calculate Cess if any
  if (cessRate > 0) {
    const cessAmount = calculateCess(taxableAmount, cessRate);
    taxesDiscounts.push({
      type: 'CESS',
      taxTemplateId: cessTemplateId ?? null,
      name: cessTemplateName ?? `Cess @ ${cessRate}%`,
      rate: cessRate,
      rateType: 'PERCENT',
      taxableAmount,
      amount: cessAmount,
      sortOrder: sortOrder++,
    });
    totalTax += cessAmount;
  }

  totalTax = roundToTwo(totalTax);

  // 5. Line total
  const total = roundToTwo(taxableAmount + totalTax);

  return {
    amount,
    taxableAmount,
    totalDiscount,
    totalTax,
    total,
    taxesDiscounts,
  };
}

/**
 * Calculate invoice-level tax and discount entries
 */
export function calculateInvoiceTaxDiscountEntries(
  inputs: InvoiceTaxDiscountInput[],
  taxableTotal: number,
  intermediateTotal: number // Total after line item taxes
): InvoiceTaxDiscountCalculation {
  const entries: InvoiceTaxDiscountEntry[] = [];

  let totalBeforeTaxAdditions = 0;
  let totalBeforeTaxDiscounts = 0;
  let totalAfterTaxAdditions = 0;
  let totalAfterTaxDiscounts = 0;

  // Sort by sortOrder
  const sortedInputs = [...inputs].sort(
    (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
  );

  for (let i = 0; i < sortedInputs.length; i++) {
    const input = sortedInputs[i];
    const baseAmount =
      input.applicationMode === 'BEFORE_TAX' ? taxableTotal : intermediateTotal;

    let amount: number;
    if (input.rateType === 'PERCENT') {
      amount = roundToTwo((baseAmount * input.rate) / 100);
    } else {
      amount = roundToTwo(Math.min(input.rate, baseAmount)); // Cap at base amount
    }

    entries.push({
      entryType: input.entryType,
      taxTemplateId: input.taxTemplateId ?? null,
      discountTemplateId: input.discountTemplateId ?? null,
      name: input.name,
      rateType: input.rateType,
      rate: input.rate,
      applicationMode: input.applicationMode,
      baseAmount,
      amount,
      sortOrder: input.sortOrder ?? i,
    });

    // Accumulate totals
    if (input.applicationMode === 'BEFORE_TAX') {
      if (input.entryType === 'TAX') {
        totalBeforeTaxAdditions += amount;
      } else {
        totalBeforeTaxDiscounts += amount;
      }
    } else {
      if (input.entryType === 'TAX') {
        totalAfterTaxAdditions += amount;
      } else {
        totalAfterTaxDiscounts += amount;
      }
    }
  }

  return {
    entries,
    totalBeforeTaxAdditions: roundToTwo(totalBeforeTaxAdditions),
    totalBeforeTaxDiscounts: roundToTwo(totalBeforeTaxDiscounts),
    totalAfterTaxAdditions: roundToTwo(totalAfterTaxAdditions),
    totalAfterTaxDiscounts: roundToTwo(totalAfterTaxDiscounts),
    totalAdditionalTax: roundToTwo(
      totalBeforeTaxAdditions + totalAfterTaxAdditions
    ),
    totalInvoiceDiscount: roundToTwo(
      totalBeforeTaxDiscounts + totalAfterTaxDiscounts
    ),
  };
}

/**
 * Calculate full invoice totals from calculated items
 */
export function calculateInvoiceTotals(
  items: CalculatedInvoiceItem[],
  invoiceDiscount?: {
    type: DiscountType | null;
    value: number;
    afterTax: boolean;
  },
  additionalTax?: { rate: number }
): InvoiceCalculation {
  // Sum up item totals
  const subTotal = roundToTwo(
    items.reduce((sum, item) => sum + item.amount, 0)
  );
  const totalItemDiscount = roundToTwo(
    items.reduce((sum, item) => sum + item.totalDiscount, 0)
  );
  const taxableTotal = roundToTwo(
    items.reduce((sum, item) => sum + item.taxableAmount, 0)
  );

  // Calculate totals by tax type from taxesDiscounts entries
  let totalCgst = 0;
  let totalSgst = 0;
  let totalIgst = 0;
  let totalCess = 0;

  for (const item of items) {
    for (const td of item.taxesDiscounts) {
      switch (td.type) {
        case 'CGST':
          totalCgst += td.amount;
          break;
        case 'SGST':
          totalSgst += td.amount;
          break;
        case 'IGST':
          totalIgst += td.amount;
          break;
        case 'CESS':
          totalCess += td.amount;
          break;
      }
    }
  }

  totalCgst = roundToTwo(totalCgst);
  totalSgst = roundToTwo(totalSgst);
  totalIgst = roundToTwo(totalIgst);
  totalCess = roundToTwo(totalCess);
  const totalTax = roundToTwo(totalCgst + totalSgst + totalIgst + totalCess);

  // Calculate additional tax (overall level)
  let additionalTaxAmount = 0;
  if (additionalTax && additionalTax.rate > 0) {
    additionalTaxAmount = roundToTwo((taxableTotal * additionalTax.rate) / 100);
  }

  // Calculate invoice-level discount
  let discountAmount = 0;
  let grandTotal = roundToTwo(taxableTotal + totalTax + additionalTaxAmount);

  if (invoiceDiscount?.type && invoiceDiscount.value > 0) {
    const baseForDiscount = invoiceDiscount.afterTax
      ? grandTotal
      : taxableTotal;

    const discountResult = calculateDiscount(baseForDiscount, {
      type: invoiceDiscount.type,
      value: invoiceDiscount.value,
    });
    discountAmount = discountResult.discountAmount;

    if (invoiceDiscount.afterTax) {
      grandTotal = discountResult.amountAfterDiscount;
    } else {
      grandTotal = roundToTwo(grandTotal - discountAmount);
    }
  }

  return {
    items,
    subTotal,
    totalItemDiscount,
    taxableTotal,
    totalCgst,
    totalSgst,
    totalIgst,
    totalCess,
    totalTax,
    additionalTaxAmount,
    discountAmount,
    grandTotal,
  };
}

/**
 * Calculate full invoice totals with new tax/discount entries system
 */
export function calculateInvoiceTotalsWithEntries(
  items: CalculatedInvoiceItem[],
  taxDiscountInputs: InvoiceTaxDiscountInput[] = []
): InvoiceCalculation & { taxDiscountCalc: InvoiceTaxDiscountCalculation } {
  // Sum up item totals
  const subTotal = roundToTwo(
    items.reduce((sum, item) => sum + item.amount, 0)
  );
  const totalItemDiscount = roundToTwo(
    items.reduce((sum, item) => sum + item.totalDiscount, 0)
  );
  const taxableTotal = roundToTwo(
    items.reduce((sum, item) => sum + item.taxableAmount, 0)
  );

  // Calculate totals by tax type from taxesDiscounts entries
  let totalCgst = 0;
  let totalSgst = 0;
  let totalIgst = 0;
  let totalCess = 0;

  for (const item of items) {
    for (const td of item.taxesDiscounts) {
      switch (td.type) {
        case 'CGST':
          totalCgst += td.amount;
          break;
        case 'SGST':
          totalSgst += td.amount;
          break;
        case 'IGST':
          totalIgst += td.amount;
          break;
        case 'CESS':
          totalCess += td.amount;
          break;
      }
    }
  }

  totalCgst = roundToTwo(totalCgst);
  totalSgst = roundToTwo(totalSgst);
  totalIgst = roundToTwo(totalIgst);
  totalCess = roundToTwo(totalCess);
  const totalTax = roundToTwo(totalCgst + totalSgst + totalIgst + totalCess);

  // Intermediate total (before invoice-level entries)
  const intermediateTotal = roundToTwo(taxableTotal + totalTax);

  // Calculate invoice-level tax/discount entries
  const taxDiscountCalc = calculateInvoiceTaxDiscountEntries(
    taxDiscountInputs,
    taxableTotal,
    intermediateTotal
  );

  // Calculate grand total
  const grandTotal = roundToTwo(
    intermediateTotal +
      taxDiscountCalc.totalBeforeTaxAdditions -
      taxDiscountCalc.totalBeforeTaxDiscounts +
      taxDiscountCalc.totalAfterTaxAdditions -
      taxDiscountCalc.totalAfterTaxDiscounts
  );

  return {
    items,
    subTotal,
    totalItemDiscount,
    taxableTotal,
    totalCgst,
    totalSgst,
    totalIgst,
    totalCess,
    totalTax,
    additionalTaxAmount: taxDiscountCalc.totalAdditionalTax,
    discountAmount: taxDiscountCalc.totalInvoiceDiscount,
    grandTotal,
    taxDiscountCalc,
  };
}

/**
 * Generate tax summary grouped by tax_id (or type+name+rate) for invoice display
 * This allows showing taxes grouped together, e.g., "CGST @ 9%" with total taxable and tax amount
 */
export function generateTaxSummary(items: CalculatedInvoiceItem[]): TaxSummary {
  // Key: `${type}-${taxTemplateId ?? 'custom'}-${rate}`
  const summaryMap = new Map<string, TaxSummaryRow>();

  for (const item of items) {
    for (const td of item.taxesDiscounts) {
      // Create a unique key for grouping - prefer taxTemplateId if available
      const key = td.taxTemplateId
        ? `${td.type}-${td.taxTemplateId}`
        : `${td.type}-${td.name}-${td.rate}`;

      const existing = summaryMap.get(key);
      if (existing) {
        existing.taxableAmount = roundToTwo(
          existing.taxableAmount + td.taxableAmount
        );
        existing.amount = roundToTwo(existing.amount + td.amount);
      } else {
        summaryMap.set(key, {
          taxTemplateId: td.taxTemplateId ?? null,
          type: td.type,
          name: td.name,
          rate: td.rate,
          taxableAmount: td.taxableAmount,
          amount: td.amount,
        });
      }
    }
  }

  const entries = Array.from(summaryMap.values());

  // Calculate totals by type
  let totalCgst = 0;
  let totalSgst = 0;
  let totalIgst = 0;
  let totalCess = 0;
  let totalDiscount = 0;
  let totalCharges = 0;

  for (const entry of entries) {
    switch (entry.type) {
      case 'CGST':
        totalCgst += entry.amount;
        break;
      case 'SGST':
        totalSgst += entry.amount;
        break;
      case 'IGST':
        totalIgst += entry.amount;
        break;
      case 'CESS':
        totalCess += entry.amount;
        break;
      case 'DISCOUNT':
        totalDiscount += entry.amount;
        break;
      case 'CHARGE':
        totalCharges += entry.amount;
        break;
    }
  }

  return {
    entries,
    totalCgst: roundToTwo(totalCgst),
    totalSgst: roundToTwo(totalSgst),
    totalIgst: roundToTwo(totalIgst),
    totalCess: roundToTwo(totalCess),
    totalDiscount: roundToTwo(totalDiscount),
    totalCharges: roundToTwo(totalCharges),
    grandTotalTax: roundToTwo(totalCgst + totalSgst + totalIgst + totalCess),
  };
}

// ============================================
// Formatting Helpers
// ============================================

/**
 * Format currency for display (INR)
 */
export function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Format date for display
 */
export function formatInvoiceDate(date: Date | number): string {
  const d = typeof date === 'number' ? new Date(date * 1000) : date;
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Check if invoice can be edited
 * Allows editing all invoices except cancelled and archived
 */
export function canEditInvoice(invoice: Invoice): boolean {
  return !invoice.isArchived && invoice.status !== 'CANCELLED';
}

/**
 * Check if invoice has payments recorded
 */
export function hasPayments(invoice: Invoice): boolean {
  return invoice.paidAmount > 0;
}

/**
 * Recalculate invoice status based on payment amounts
 */
export function recalculateInvoiceStatus(
  grandTotal: number,
  paidAmount: number,
  currentStatus: InvoiceStatus
): InvoiceStatus {
  // Don't change CANCELLED
  if (currentStatus === 'CANCELLED') {
    return currentStatus;
  }

  if (paidAmount <= 0) return 'UNPAID';
  if (paidAmount >= grandTotal) return 'PAID';
  return 'PARTIALLY_PAID';
}

/**
 * Check if invoice can be cancelled
 */
export function canCancelInvoice(invoice: Invoice): boolean {
  return (
    !invoice.isArchived &&
    invoice.status !== 'PAID' &&
    invoice.status !== 'CANCELLED'
  );
}

/**
 * Check if payment can be recorded
 */
export function canRecordPayment(invoice: Invoice): boolean {
  return (
    !invoice.isArchived &&
    invoice.status !== 'CANCELLED' &&
    invoice.dueAmount > 0
  );
}

/**
 * Determine GST type based on state codes
 */
export function determineGstType(
  companyStateCode: string,
  customerStateCode: string
): GstType {
  return companyStateCode === customerStateCode ? 'INTRA' : 'INTER';
}
