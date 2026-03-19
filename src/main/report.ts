import { ipcMain, dialog } from 'electron';
import { getActiveDb } from './company-manager';
import {
  invoicesTable,
} from '@db/schema/invoices';
import { invoicePaymentsTable } from '@db/schema/invoice-payments';
import { customersTable } from '@db/schema/customers';
import { paymentMethodsTable } from '@db/schema/payment-methods';
import {
  eq, and, gte, lte, inArray, sql, desc,
} from 'drizzle-orm';
import { ReportIpcChannel, formatIpcError } from '@shared/ipc';
import {
  InvoiceReportParams,
  InvoiceReportResponse,
  InvoiceReportRow,
  PaymentReportParams,
  PaymentReportResponse,
  PaymentReportRow,
  GstReportParams,
  GstReportResponse,
  GstReportRow,
  ExportReportParams,
  ExportReportResponse,
} from '@shared/report';
import { InvoiceStatus, INVOICE_STATUSES } from '@shared/invoice';
import { roundToTwo } from '@shared/tax-template';
import Exceljs from 'exceljs';
import { format as formatDate } from 'date-fns';

// ─── Invoice Report ───────────────────────────────────────────────────────────

function getInvoiceReport(params: InvoiceReportParams): InvoiceReportResponse {
  const db = getActiveDb();
  const { dateFrom, dateTo, customerId, statuses, invoiceSeriesId } = params;

  const conditions = [eq(invoicesTable.isArchived, false)];
  if (dateFrom) conditions.push(gte(invoicesTable.invoiceDate, dateFrom));
  if (dateTo)   conditions.push(lte(invoicesTable.invoiceDate, dateTo));
  if (customerId) conditions.push(eq(invoicesTable.customerId, customerId));
  if (statuses && statuses.length > 0) conditions.push(inArray(invoicesTable.status, statuses));
  if (invoiceSeriesId) conditions.push(eq(invoicesTable.invoiceSeriesId, invoiceSeriesId));

  const invoiceRows = db
    .select()
    .from(invoicesTable)
    .where(and(...conditions))
    .orderBy(desc(invoicesTable.invoiceDate), desc(invoicesTable.id))
    .all();

  const rows: InvoiceReportRow[] = invoiceRows.map((inv) => {
    const customer = db
      .select({ name: customersTable.name, gstin: customersTable.gstin })
      .from(customersTable)
      .where(eq(customersTable.id, inv.customerId))
      .get();

    const pm = inv.paymentMethodId
      ? db
          .select({ name: paymentMethodsTable.name })
          .from(paymentMethodsTable)
          .where(eq(paymentMethodsTable.id, inv.paymentMethodId))
          .get()
      : null;

    return {
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      invoiceDate: inv.invoiceDate,
      customerName: customer?.name ?? '',
      customerGstin: customer?.gstin ?? null,
      gstType: inv.gstType,
      reverseCharge: inv.reverseCharge,
      subTotal: inv.subTotal,
      totalDiscount: inv.totalItemDiscount,
      taxableTotal: inv.taxableTotal,
      totalCgst: inv.totalCgst,
      totalSgst: inv.totalSgst,
      totalIgst: inv.totalIgst,
      totalCess: inv.totalCess,
      grandTotal: inv.grandTotal,
      paidAmount: inv.paidAmount,
      dueAmount: inv.dueAmount,
      status: inv.status as InvoiceStatus,
      paymentMethodName: pm?.name ?? null,
    };
  });

  // Build summary
  const countByStatus = Object.fromEntries(
    INVOICE_STATUSES.map((s) => [s, 0])
  ) as Record<InvoiceStatus, number>;

  let totalGrandTotal = 0;
  let totalPaid = 0;
  let totalDue = 0;
  let totalTaxableAmount = 0;
  let totalCgst = 0;
  let totalSgst = 0;
  let totalIgst = 0;
  let totalCess = 0;

  for (const row of rows) {
    countByStatus[row.status] = (countByStatus[row.status] ?? 0) + 1;
    totalGrandTotal = roundToTwo(totalGrandTotal + row.grandTotal);
    totalPaid = roundToTwo(totalPaid + row.paidAmount);
    totalDue = roundToTwo(totalDue + row.dueAmount);
    totalTaxableAmount = roundToTwo(totalTaxableAmount + row.taxableTotal);
    totalCgst = roundToTwo(totalCgst + row.totalCgst);
    totalSgst = roundToTwo(totalSgst + row.totalSgst);
    totalIgst = roundToTwo(totalIgst + row.totalIgst);
    totalCess = roundToTwo(totalCess + row.totalCess);
  }

  return {
    rows,
    summary: {
      totalCount: rows.length,
      totalGrandTotal,
      totalPaid,
      totalDue,
      totalTaxableAmount,
      totalCgst,
      totalSgst,
      totalIgst,
      totalCess,
      countByStatus,
    },
  };
}

// ─── Payment Report ───────────────────────────────────────────────────────────

function getPaymentReport(params: PaymentReportParams): PaymentReportResponse {
  const db = getActiveDb();
  const { dateFrom, dateTo, paymentMethodId, customerId } = params;

  const conditions: any[] = [];
  if (dateFrom) conditions.push(gte(invoicePaymentsTable.paymentDate, dateFrom));
  if (dateTo)   conditions.push(lte(invoicePaymentsTable.paymentDate, dateTo));
  if (paymentMethodId) conditions.push(eq(invoicePaymentsTable.paymentMethodId, paymentMethodId));

  const paymentRows = db
    .select()
    .from(invoicePaymentsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(invoicePaymentsTable.paymentDate), desc(invoicePaymentsTable.id))
    .all();

  const rows: PaymentReportRow[] = [];
  let totalAmount = 0;

  for (const pmt of paymentRows) {
    const invoice = db
      .select({ invoiceNumber: invoicesTable.invoiceNumber, customerId: invoicesTable.customerId })
      .from(invoicesTable)
      .where(eq(invoicesTable.id, pmt.invoiceId))
      .get();

    if (!invoice) continue;

    // Apply customer filter after joining
    if (customerId && invoice.customerId !== customerId) continue;

    const customer = db
      .select({ name: customersTable.name })
      .from(customersTable)
      .where(eq(customersTable.id, invoice.customerId))
      .get();

    const pm = pmt.paymentMethodId
      ? db
          .select({ name: paymentMethodsTable.name })
          .from(paymentMethodsTable)
          .where(eq(paymentMethodsTable.id, pmt.paymentMethodId))
          .get()
      : null;

    rows.push({
      id: pmt.id,
      paymentDate: pmt.paymentDate,
      invoiceNumber: invoice.invoiceNumber,
      customerName: customer?.name ?? '',
      paymentMethodName: pm?.name ?? null,
      amount: pmt.amount,
      referenceNumber: pmt.referenceNumber ?? null,
      notes: pmt.notes ?? null,
    });

    totalAmount = roundToTwo(totalAmount + pmt.amount);
  }

  return {
    rows,
    summary: { totalCount: rows.length, totalAmount },
  };
}

// ─── GST Report ───────────────────────────────────────────────────────────────

function getGstReport(params: GstReportParams): GstReportResponse {
  const db = getActiveDb();
  const { dateFrom, dateTo, gstType } = params;

  const conditions: any[] = [
    eq(invoicesTable.isArchived, false),
    // Exclude CANCELLED invoices from GST report
    sql`${invoicesTable.status} != 'CANCELLED'`,
  ];
  if (dateFrom) conditions.push(gte(invoicesTable.invoiceDate, dateFrom));
  if (dateTo)   conditions.push(lte(invoicesTable.invoiceDate, dateTo));
  if (gstType)  conditions.push(eq(invoicesTable.gstType, gstType));

  const invoiceRows = db
    .select()
    .from(invoicesTable)
    .where(and(...conditions))
    .orderBy(desc(invoicesTable.invoiceDate), desc(invoicesTable.id))
    .all();

  let totalTaxableAmount = 0;
  let totalCgst = 0;
  let totalSgst = 0;
  let totalIgst = 0;
  let totalCess = 0;
  let totalTax = 0;
  let totalGrandTotal = 0;

  const rows: GstReportRow[] = invoiceRows.map((inv) => {
    const customer = db
      .select({ name: customersTable.name, gstin: customersTable.gstin })
      .from(customersTable)
      .where(eq(customersTable.id, inv.customerId))
      .get();

    const rowTotalTax = roundToTwo(
      inv.totalCgst + inv.totalSgst + inv.totalIgst + inv.totalCess
    );

    totalTaxableAmount = roundToTwo(totalTaxableAmount + inv.taxableTotal);
    totalCgst  = roundToTwo(totalCgst  + inv.totalCgst);
    totalSgst  = roundToTwo(totalSgst  + inv.totalSgst);
    totalIgst  = roundToTwo(totalIgst  + inv.totalIgst);
    totalCess  = roundToTwo(totalCess  + inv.totalCess);
    totalTax   = roundToTwo(totalTax   + rowTotalTax);
    totalGrandTotal = roundToTwo(totalGrandTotal + inv.grandTotal);

    return {
      invoiceNumber: inv.invoiceNumber,
      invoiceDate: inv.invoiceDate,
      customerName: customer?.name ?? '',
      customerGstin: customer?.gstin ?? null,
      gstType: inv.gstType,
      reverseCharge: inv.reverseCharge,
      taxableAmount: inv.taxableTotal,
      cgstAmount: inv.totalCgst,
      sgstAmount: inv.totalSgst,
      igstAmount: inv.totalIgst,
      cessAmount: inv.totalCess,
      totalTax: rowTotalTax,
      grandTotal: inv.grandTotal,
    };
  });

  return {
    rows,
    summary: { totalTaxableAmount, totalCgst, totalSgst, totalIgst, totalCess, totalTax, totalGrandTotal },
  };
}

// ─── Export Helpers ───────────────────────────────────────────────────────────

function escapeCSV(value: string | number | boolean | null | undefined): string {
  if (value == null) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function rowToCSV(cells: (string | number | boolean | null | undefined)[]): string {
  return cells.map(escapeCSV).join(',');
}

function formatDateForExport(date: Date): string {
  return formatDate(new Date(date), 'dd/MM/yyyy');
}

async function exportReport(params: ExportReportParams): Promise<ExportReportResponse> {
  const { reportType, format } = params;

  const dateStr = formatDate(new Date(), 'yyyy-MM-dd');
  const nameMap: Record<string, string> = {
    invoice: `invoice-report-${dateStr}`,
    payment: `payment-report-${dateStr}`,
    gst: `gst-report-${dateStr}`,
  };
  const defaultName = nameMap[reportType] ?? `report-${dateStr}`;
  const ext = format === 'csv' ? 'csv' : 'xlsx';

  const { filePath, canceled } = await dialog.showSaveDialog({
    defaultPath: `${defaultName}.${ext}`,
    filters: format === 'csv'
      ? [{ name: 'CSV Files', extensions: ['csv'] }]
      : [{ name: 'Excel Files', extensions: ['xlsx'] }],
  });

  if (canceled || !filePath) {
    return { success: false };
  }

  if (reportType === 'invoice') {
    const data = getInvoiceReport(params.invoiceParams ?? {});
    if (format === 'csv') await exportInvoiceCSV(data, filePath);
    else await exportInvoiceExcel(data, filePath);
  } else if (reportType === 'payment') {
    const data = getPaymentReport(params.paymentParams ?? {});
    if (format === 'csv') await exportPaymentCSV(data, filePath);
    else await exportPaymentExcel(data, filePath);
  } else if (reportType === 'gst') {
    const data = getGstReport(params.gstParams ?? {});
    if (format === 'csv') await exportGstCSV(data, filePath);
    else await exportGstExcel(data, filePath);
  }

  return { success: true, filePath };
}

// ─── CSV Export Functions ─────────────────────────────────────────────────────

async function exportInvoiceCSV(data: InvoiceReportResponse, filePath: string) {
  const { writeFile } = await import('node:fs/promises');
  const header = rowToCSV([
    'Invoice #', 'Date', 'Customer', 'GSTIN', 'GST Type', 'Reverse Charge',
    'Sub Total', 'Discount', 'Taxable Total', 'CGST', 'SGST', 'IGST', 'CESS',
    'Grand Total', 'Paid', 'Due', 'Status', 'Payment Method',
  ]);
  const lines = data.rows.map((r) =>
    rowToCSV([
      r.invoiceNumber, formatDateForExport(r.invoiceDate), r.customerName,
      r.customerGstin, r.gstType, r.reverseCharge ? 'Yes' : 'No',
      r.subTotal, r.totalDiscount, r.taxableTotal,
      r.totalCgst, r.totalSgst, r.totalIgst, r.totalCess,
      r.grandTotal, r.paidAmount, r.dueAmount, r.status, r.paymentMethodName,
    ])
  );
  await writeFile(filePath, [header, ...lines].join('\n'), 'utf-8');
}

async function exportPaymentCSV(data: PaymentReportResponse, filePath: string) {
  const { writeFile } = await import('node:fs/promises');
  const header = rowToCSV(['Date', 'Invoice #', 'Customer', 'Payment Method', 'Amount', 'Reference', 'Notes']);
  const lines = data.rows.map((r) =>
    rowToCSV([
      formatDateForExport(r.paymentDate), r.invoiceNumber, r.customerName,
      r.paymentMethodName, r.amount, r.referenceNumber, r.notes,
    ])
  );
  await writeFile(filePath, [header, ...lines].join('\n'), 'utf-8');
}

async function exportGstCSV(data: GstReportResponse, filePath: string) {
  const { writeFile } = await import('node:fs/promises');
  const header = rowToCSV([
    'Invoice #', 'Date', 'Customer', 'GSTIN', 'GST Type', 'Reverse Charge',
    'Taxable Amount', 'CGST', 'SGST', 'IGST', 'CESS', 'Total Tax', 'Grand Total',
  ]);
  const lines = data.rows.map((r) =>
    rowToCSV([
      r.invoiceNumber, formatDateForExport(r.invoiceDate), r.customerName,
      r.customerGstin, r.gstType, r.reverseCharge ? 'Yes' : 'No',
      r.taxableAmount, r.cgstAmount, r.sgstAmount, r.igstAmount,
      r.cessAmount, r.totalTax, r.grandTotal,
    ])
  );
  await writeFile(filePath, [header, ...lines].join('\n'), 'utf-8');
}

// ─── Excel Export Functions ───────────────────────────────────────────────────

async function exportInvoiceExcel(data: InvoiceReportResponse, filePath: string) {
  const wb = new Exceljs.Workbook();
  const ws = wb.addWorksheet('Invoice Report');

  ws.columns = [
    { header: 'Invoice #',      key: 'invoiceNumber',   width: 18 },
    { header: 'Date',           key: 'invoiceDate',     width: 14 },
    { header: 'Customer',       key: 'customerName',    width: 28 },
    { header: 'GSTIN',          key: 'customerGstin',   width: 20 },
    { header: 'GST Type',       key: 'gstType',         width: 12 },
    { header: 'Rev. Charge',    key: 'reverseCharge',   width: 12 },
    { header: 'Sub Total',      key: 'subTotal',        width: 14, style: { numFmt: '#,##0.00' } },
    { header: 'Discount',       key: 'totalDiscount',   width: 14, style: { numFmt: '#,##0.00' } },
    { header: 'Taxable Total',  key: 'taxableTotal',    width: 16, style: { numFmt: '#,##0.00' } },
    { header: 'CGST',           key: 'totalCgst',       width: 12, style: { numFmt: '#,##0.00' } },
    { header: 'SGST',           key: 'totalSgst',       width: 12, style: { numFmt: '#,##0.00' } },
    { header: 'IGST',           key: 'totalIgst',       width: 12, style: { numFmt: '#,##0.00' } },
    { header: 'CESS',           key: 'totalCess',       width: 12, style: { numFmt: '#,##0.00' } },
    { header: 'Grand Total',    key: 'grandTotal',      width: 14, style: { numFmt: '#,##0.00' } },
    { header: 'Paid',           key: 'paidAmount',      width: 14, style: { numFmt: '#,##0.00' } },
    { header: 'Due',            key: 'dueAmount',       width: 14, style: { numFmt: '#,##0.00' } },
    { header: 'Status',         key: 'status',          width: 16 },
    { header: 'Payment Method', key: 'paymentMethodName', width: 18 },
  ];

  ws.getRow(1).font = { bold: true };
  ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F5E9' } };

  for (const row of data.rows) {
    ws.addRow({
      ...row,
      invoiceDate: formatDateForExport(row.invoiceDate),
      reverseCharge: row.reverseCharge ? 'Yes' : 'No',
    });
  }

  // Summary sheet
  const ws2 = wb.addWorksheet('Summary');
  ws2.addRow(['Total Invoices', data.summary.totalCount]);
  ws2.addRow(['Total Grand Total', data.summary.totalGrandTotal]);
  ws2.addRow(['Total Paid', data.summary.totalPaid]);
  ws2.addRow(['Total Due', data.summary.totalDue]);
  ws2.addRow(['Total Taxable', data.summary.totalTaxableAmount]);
  ws2.addRow(['Total CGST', data.summary.totalCgst]);
  ws2.addRow(['Total SGST', data.summary.totalSgst]);
  ws2.addRow(['Total IGST', data.summary.totalIgst]);
  ws2.addRow(['Total CESS', data.summary.totalCess]);
  ws2.addRow([]);
  ws2.addRow(['By Status']);
  for (const [status, count] of Object.entries(data.summary.countByStatus)) {
    ws2.addRow([status, count]);
  }
  ws2.getColumn(1).width = 22;
  ws2.getColumn(2).width = 16;

  await wb.xlsx.writeFile(filePath);
}

async function exportPaymentExcel(data: PaymentReportResponse, filePath: string) {
  const wb = new Exceljs.Workbook();
  const ws = wb.addWorksheet('Payment Report');

  ws.columns = [
    { header: 'Date',           key: 'paymentDate',       width: 14 },
    { header: 'Invoice #',      key: 'invoiceNumber',     width: 18 },
    { header: 'Customer',       key: 'customerName',      width: 28 },
    { header: 'Payment Method', key: 'paymentMethodName', width: 18 },
    { header: 'Amount',         key: 'amount',            width: 14, style: { numFmt: '#,##0.00' } },
    { header: 'Reference',      key: 'referenceNumber',   width: 20 },
    { header: 'Notes',          key: 'notes',             width: 30 },
  ];

  ws.getRow(1).font = { bold: true };
  ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE3F2FD' } };

  for (const row of data.rows) {
    ws.addRow({ ...row, paymentDate: formatDateForExport(row.paymentDate) });
  }

  const ws2 = wb.addWorksheet('Summary');
  ws2.addRow(['Total Payments', data.summary.totalCount]);
  ws2.addRow(['Total Amount', data.summary.totalAmount]);
  ws2.getColumn(1).width = 20;
  ws2.getColumn(2).width = 16;

  await wb.xlsx.writeFile(filePath);
}

async function exportGstExcel(data: GstReportResponse, filePath: string) {
  const wb = new Exceljs.Workbook();
  const ws = wb.addWorksheet('GST Report');

  ws.columns = [
    { header: 'Invoice #',      key: 'invoiceNumber',   width: 18 },
    { header: 'Date',           key: 'invoiceDate',     width: 14 },
    { header: 'Customer',       key: 'customerName',    width: 28 },
    { header: 'GSTIN',          key: 'customerGstin',   width: 20 },
    { header: 'GST Type',       key: 'gstType',         width: 12 },
    { header: 'Rev. Charge',    key: 'reverseCharge',   width: 12 },
    { header: 'Taxable Amount', key: 'taxableAmount',   width: 16, style: { numFmt: '#,##0.00' } },
    { header: 'CGST',           key: 'cgstAmount',      width: 12, style: { numFmt: '#,##0.00' } },
    { header: 'SGST',           key: 'sgstAmount',      width: 12, style: { numFmt: '#,##0.00' } },
    { header: 'IGST',           key: 'igstAmount',      width: 12, style: { numFmt: '#,##0.00' } },
    { header: 'CESS',           key: 'cessAmount',      width: 12, style: { numFmt: '#,##0.00' } },
    { header: 'Total Tax',      key: 'totalTax',        width: 14, style: { numFmt: '#,##0.00' } },
    { header: 'Grand Total',    key: 'grandTotal',      width: 14, style: { numFmt: '#,##0.00' } },
  ];

  ws.getRow(1).font = { bold: true };
  ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF3E0' } };

  for (const row of data.rows) {
    ws.addRow({ ...row, invoiceDate: formatDateForExport(row.invoiceDate), reverseCharge: row.reverseCharge ? 'Yes' : 'No' });
  }

  ws.addRow({});
  const totalsRow = ws.addRow({
    invoiceNumber: 'TOTALS',
    taxableAmount: data.summary.totalTaxableAmount,
    cgstAmount: data.summary.totalCgst,
    sgstAmount: data.summary.totalSgst,
    igstAmount: data.summary.totalIgst,
    cessAmount: data.summary.totalCess,
    totalTax: data.summary.totalTax,
    grandTotal: data.summary.totalGrandTotal,
  });
  totalsRow.font = { bold: true };

  await wb.xlsx.writeFile(filePath);
}

// ─── IPC Registration ─────────────────────────────────────────────────────────

export function registerReportHandlers() {
  ipcMain.handle(ReportIpcChannel.GetInvoiceReport, async (_event, params: InvoiceReportParams) => {
    try {
      if (params.dateFrom) params.dateFrom = new Date(params.dateFrom);
      if (params.dateTo)   params.dateTo   = new Date(params.dateTo);
      return getInvoiceReport(params);
    } catch (error) {
      throw new Error(formatIpcError(error));
    }
  });

  ipcMain.handle(ReportIpcChannel.GetPaymentReport, async (_event, params: PaymentReportParams) => {
    try {
      if (params.dateFrom) params.dateFrom = new Date(params.dateFrom);
      if (params.dateTo)   params.dateTo   = new Date(params.dateTo);
      return getPaymentReport(params);
    } catch (error) {
      throw new Error(formatIpcError(error));
    }
  });

  ipcMain.handle(ReportIpcChannel.GetGstReport, async (_event, params: GstReportParams) => {
    try {
      if (params.dateFrom) params.dateFrom = new Date(params.dateFrom);
      if (params.dateTo)   params.dateTo   = new Date(params.dateTo);
      return getGstReport(params);
    } catch (error) {
      throw new Error(formatIpcError(error));
    }
  });

  ipcMain.handle(ReportIpcChannel.Export, async (_event, params: ExportReportParams) => {
    try {
      if (params.invoiceParams?.dateFrom) params.invoiceParams.dateFrom = new Date(params.invoiceParams.dateFrom);
      if (params.invoiceParams?.dateTo)   params.invoiceParams.dateTo   = new Date(params.invoiceParams.dateTo);
      if (params.paymentParams?.dateFrom) params.paymentParams.dateFrom = new Date(params.paymentParams.dateFrom);
      if (params.paymentParams?.dateTo)   params.paymentParams.dateTo   = new Date(params.paymentParams.dateTo);
      if (params.gstParams?.dateFrom) params.gstParams.dateFrom = new Date(params.gstParams.dateFrom);
      if (params.gstParams?.dateTo)   params.gstParams.dateTo   = new Date(params.gstParams.dateTo);
      return await exportReport(params);
    } catch (error) {
      throw new Error(formatIpcError(error));
    }
  });
}
