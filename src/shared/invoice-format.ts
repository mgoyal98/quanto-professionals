import { invoiceFormatsTable } from '@db/schema/invoice-formats';
import { InferSelectModel } from 'drizzle-orm';

// ============================================
// Database Model Type
// ============================================

export type InvoiceFormat = InferSelectModel<typeof invoiceFormatsTable>;

// ============================================
// Paper & Orientation Types
// ============================================

export const PAPER_SIZES = ['A4', 'Letter', 'Legal'] as const;
export type PaperSize = (typeof PAPER_SIZES)[number];

export const ORIENTATIONS = ['portrait', 'landscape'] as const;
export type Orientation = (typeof ORIENTATIONS)[number];

// ============================================
// Request Types
// ============================================

export interface CreateInvoiceFormatRequest {
  name: string;
  description?: string;
  htmlTemplate: string;
  cssStyles: string;
  paperSize?: PaperSize;
  orientation?: Orientation;
  marginTop?: number;
  marginRight?: number;
  marginBottom?: number;
  marginLeft?: number;
}

export interface UpdateInvoiceFormatRequest {
  id: number;
  name?: string;
  description?: string;
  htmlTemplate?: string;
  cssStyles?: string;
  isActive?: boolean;
  paperSize?: PaperSize;
  orientation?: Orientation;
  marginTop?: number;
  marginRight?: number;
  marginBottom?: number;
  marginLeft?: number;
}

export interface RenderInvoiceRequest {
  invoiceId: number;
  formatId?: number; // If not provided, uses invoice's saved format or default
}

export interface RenderInvoiceResponse {
  html: string;
  css: string;
}

export interface GeneratePdfRequest {
  invoiceId: number;
  formatId?: number;
  savePath?: string; // If provided, saves to this path. Otherwise, prompts user.
}

export interface GeneratePdfResponse {
  success: boolean;
  filePath?: string;
  error?: string;
}

export interface PreviewFormatRequest {
  htmlTemplate: string;
  cssStyles: string;
}

export interface PreviewFormatResponse {
  html: string;
}

// ============================================
// Template Data Types (for EJS rendering)
// ============================================

export interface CompanyTemplateData {
  name: string;
  profession: string | null;
  pan: string | null;
  gstin: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string;
  state: string;
  stateCode: string;
  pinCode: string;
  phone: string | null;
  email: string | null;
}

export interface CustomerTemplateData {
  name: string;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string;
  state: string;
  stateCode: string;
  pinCode: string | null;
  phone: string | null;
  email: string | null;
  gstin: string | null;
  pan: string | null;
}

export interface InvoiceTemplateData {
  invoiceNumber: string;
  invoiceDate: string;
  invoiceDateRaw: Date;
  dueDate: string | null;
  gstType: 'INTRA' | 'INTER';
  status: string;
  cancelReason: string | null;
  notes: string | null;
  // Reverse charge (Y/N)
  reverseCharge: boolean;
  reverseChargeText: string; // 'Y' or 'N' for display
  // Totals
  subTotal: number;
  subTotalFormatted: string;
  taxableTotal: number;
  taxableTotalFormatted: string;
  totalTax: number;
  totalTaxFormatted: string;
  grandTotal: number;
  grandTotalFormatted: string;
  grandTotalInWords: string;
  paidAmount: number;
  paidAmountFormatted: string;
  dueAmount: number;
  dueAmountFormatted: string;
  // GST breakdown
  totalCgst: number;
  totalSgst: number;
  totalIgst: number;
  totalCess: number;
}

export interface ItemTaxTemplateData {
  type: 'CGST' | 'SGST' | 'IGST' | 'CESS';
  name: string;
  rate: number;
  amount: number;
  amountFormatted: string;
}

export interface ItemTemplateData {
  index: number;
  name: string;
  description: string | null;
  hsnCode: string | null;
  quantity: number;
  unit: string;
  rate: number;
  rateFormatted: string;
  amount: number;
  amountFormatted: string;
  taxableAmount: number;
  taxableAmountFormatted: string;
  totalTax: number;
  totalTaxFormatted: string;
  total: number;
  totalFormatted: string;
  taxes: ItemTaxTemplateData[];
}

export interface TaxSummaryTemplateData {
  type: 'CGST' | 'SGST' | 'IGST' | 'CESS';
  name: string;
  rate: number;
  taxableAmount: number;
  taxableAmountFormatted: string;
  amount: number;
  amountFormatted: string;
}

export interface TaxDiscountEntryTemplateData {
  entryType: 'TAX' | 'DISCOUNT';
  name: string;
  rate: number;
  rateType: 'PERCENT' | 'AMOUNT';
  applicationMode: 'BEFORE_TAX' | 'AFTER_TAX';
  amount: number;
  amountFormatted: string;
}

export interface PaymentTemplateData {
  date: string;
  dateRaw: Date;
  amount: number;
  amountFormatted: string;
  method: string | null;
  reference: string | null;
  notes: string | null;
}

export interface BankDetailsTemplateData {
  hasBankDetails: boolean;
  bankName: string | null;
  accountNumber: string | null;
  accountHolder: string | null;
  ifscCode: string | null;
  branchName: string | null;
  upiId: string | null;
  paymentMethodName: string | null;
  paymentMethodType: string | null;
}

export interface TemplateData {
  company: CompanyTemplateData;
  customer: CustomerTemplateData;
  invoice: InvoiceTemplateData;
  items: ItemTemplateData[];
  taxSummary: TaxSummaryTemplateData[];
  taxDiscountEntries: TaxDiscountEntryTemplateData[];
  payments: PaymentTemplateData[];
  bankDetails: BankDetailsTemplateData;
  currencySymbol: string;
  printDate: string;
  printDateTime: string;
  styles: string;
  // Helper functions
  formatCurrency: (amount: number) => string;
  formatDate: (date: Date) => string;
  formatNumber: (num: number, decimals?: number) => string;
}

// ============================================
// Utility Functions
// ============================================

/**
 * Format currency for display (INR)
 */
export function formatCurrencyForTemplate(amount: number): string {
  return amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Format date for display
 */
export function formatDateForTemplate(date: Date): string {
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format number with specified decimal places
 */
export function formatNumberForTemplate(
  num: number,
  decimals: number = 2
): string {
  return num.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}
