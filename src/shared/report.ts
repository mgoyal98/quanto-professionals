import type { InvoiceStatus } from './invoice';

// ─── Filter Params ────────────────────────────────────────────────────────────

export interface InvoiceReportParams {
  dateFrom?: Date;
  dateTo?: Date;
  customerId?: number;
  statuses?: InvoiceStatus[];
  invoiceSeriesId?: number;
}

export interface PaymentReportParams {
  dateFrom?: Date;
  dateTo?: Date;
  paymentMethodId?: number;
  customerId?: number;
}

export interface GstReportParams {
  dateFrom?: Date;
  dateTo?: Date;
  gstType?: 'INTRA' | 'INTER';
}

// ─── Row Shapes ───────────────────────────────────────────────────────────────

export interface InvoiceReportRow {
  id: number;
  invoiceNumber: string;
  invoiceDate: Date;
  customerName: string;
  customerGstin: string | null;
  gstType: string;
  reverseCharge: boolean;
  subTotal: number;
  totalDiscount: number;
  taxableTotal: number;
  totalCgst: number;
  totalSgst: number;
  totalIgst: number;
  totalCess: number;
  grandTotal: number;
  paidAmount: number;
  dueAmount: number;
  status: InvoiceStatus;
  paymentMethodName: string | null;
}

export interface PaymentReportRow {
  id: number;
  paymentDate: Date;
  invoiceNumber: string;
  customerName: string;
  paymentMethodName: string | null;
  amount: number;
  referenceNumber: string | null;
  notes: string | null;
}

export interface GstReportRow {
  invoiceNumber: string;
  invoiceDate: Date;
  customerName: string;
  customerGstin: string | null;
  gstType: string;
  reverseCharge: boolean;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  cessAmount: number;
  totalTax: number;
  grandTotal: number;
}

// ─── Response Shapes ──────────────────────────────────────────────────────────

export interface InvoiceReportSummary {
  totalCount: number;
  totalGrandTotal: number;
  totalPaid: number;
  totalDue: number;
  totalTaxableAmount: number;
  totalCgst: number;
  totalSgst: number;
  totalIgst: number;
  totalCess: number;
  countByStatus: Record<InvoiceStatus, number>;
}

export interface InvoiceReportResponse {
  rows: InvoiceReportRow[];
  summary: InvoiceReportSummary;
}

export interface PaymentReportSummary {
  totalCount: number;
  totalAmount: number;
}

export interface PaymentReportResponse {
  rows: PaymentReportRow[];
  summary: PaymentReportSummary;
}

export interface GstReportSummary {
  totalTaxableAmount: number;
  totalCgst: number;
  totalSgst: number;
  totalIgst: number;
  totalCess: number;
  totalTax: number;
  totalGrandTotal: number;
}

export interface GstReportResponse {
  rows: GstReportRow[];
  summary: GstReportSummary;
}

// ─── Export ───────────────────────────────────────────────────────────────────

export type ExportFormat = 'csv' | 'excel';
export type ReportType = 'invoice' | 'payment' | 'gst';

export interface ExportReportParams {
  reportType: ReportType;
  format: ExportFormat;
  invoiceParams?: InvoiceReportParams;
  paymentParams?: PaymentReportParams;
  gstParams?: GstReportParams;
}

export interface ExportReportResponse {
  success: boolean;
  filePath?: string;
  error?: string;
}
