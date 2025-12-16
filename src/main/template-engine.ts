import ejs from 'ejs';
import { InvoiceWithDetails } from '@shared/invoice';
import { Company } from '@shared/company';
import {
  InvoiceFormat,
  TemplateData,
  CompanyTemplateData,
  CustomerTemplateData,
  InvoiceTemplateData,
  ItemTemplateData,
  TaxSummaryTemplateData,
  TaxDiscountEntryTemplateData,
  PaymentTemplateData,
  BankDetailsTemplateData,
  formatCurrencyForTemplate,
  formatDateForTemplate,
  formatNumberForTemplate,
} from '@shared/invoice-format';
import { numberToWordsIndian } from '@shared/utils/number-to-words';
import { roundToTwo } from '@shared/tax-template';
import { getActiveDb } from './company-manager';
import { paymentMethodsTable } from '@db/schema/payment-methods';
import { eq, and } from 'drizzle-orm';
import { PaymentMethod } from '@shared/payment-method';

/**
 * Build company template data from Company model
 */
function buildCompanyData(company: Company): CompanyTemplateData {
  return {
    name: company.name,
    profession: company.profession ?? null,
    pan: company.pan ?? null,
    gstin: company.gstin ?? null,
    addressLine1: company.addressLine1 ?? null,
    addressLine2: company.addressLine2 ?? null,
    city: company.city,
    state: company.state,
    stateCode: company.stateCode,
    pinCode: company.pinCode,
    phone: company.phone ?? null,
    email: company.email ?? null,
  };
}

/**
 * Build customer template data from InvoiceWithDetails
 */
function buildCustomerData(invoice: InvoiceWithDetails): CustomerTemplateData {
  const customer = invoice.customer;
  if (!customer) {
    return {
      name: 'Unknown Customer',
      addressLine1: null,
      addressLine2: null,
      city: '',
      state: '',
      stateCode: '',
      pinCode: null,
      phone: null,
      email: null,
      gstin: null,
      pan: null,
    };
  }

  return {
    name: customer.name,
    addressLine1: customer.addressLine1 ?? null,
    addressLine2: customer.addressLine2 ?? null,
    city: customer.city,
    state: customer.state,
    stateCode: customer.stateCode,
    pinCode: customer.pinCode ?? null,
    phone: customer.phone ?? null,
    email: customer.email ?? null,
    gstin: customer.gstin ?? null,
    pan: customer.pan ?? null,
  };
}

/**
 * Build invoice template data
 */
function buildInvoiceData(invoice: InvoiceWithDetails): InvoiceTemplateData {
  const invoiceDate =
    invoice.invoiceDate instanceof Date
      ? invoice.invoiceDate
      : new Date((invoice.invoiceDate as number) * 1000);

  const dueDate = invoice.dueDate
    ? invoice.dueDate instanceof Date
      ? invoice.dueDate
      : new Date((invoice.dueDate as number) * 1000)
    : null;

  return {
    invoiceNumber: invoice.invoiceNumber,
    invoiceDate: formatDateForTemplate(invoiceDate),
    invoiceDateRaw: invoiceDate,
    dueDate: dueDate ? formatDateForTemplate(dueDate) : null,
    gstType: invoice.gstType as 'INTRA' | 'INTER',
    status: invoice.status,
    notes: invoice.notes ?? null,
    // Reverse charge
    reverseCharge: invoice.reverseCharge ?? false,
    reverseChargeText: invoice.reverseCharge ? 'Y' : 'N',
    // Totals
    subTotal: invoice.subTotal,
    subTotalFormatted: formatCurrencyForTemplate(invoice.subTotal),
    taxableTotal: invoice.taxableTotal,
    taxableTotalFormatted: formatCurrencyForTemplate(invoice.taxableTotal),
    totalTax: invoice.totalTax,
    totalTaxFormatted: formatCurrencyForTemplate(invoice.totalTax),
    grandTotal: invoice.grandTotal,
    grandTotalFormatted: formatCurrencyForTemplate(invoice.grandTotal),
    grandTotalInWords: numberToWordsIndian(invoice.grandTotal),
    paidAmount: invoice.paidAmount,
    paidAmountFormatted: formatCurrencyForTemplate(invoice.paidAmount),
    dueAmount: invoice.dueAmount,
    dueAmountFormatted: formatCurrencyForTemplate(invoice.dueAmount),
    // GST breakdown
    totalCgst: invoice.totalCgst,
    totalSgst: invoice.totalSgst,
    totalIgst: invoice.totalIgst,
    totalCess: invoice.totalCess,
  };
}

/**
 * Build items template data
 */
function buildItemsData(invoice: InvoiceWithDetails): ItemTemplateData[] {
  if (!invoice.items) return [];

  return invoice.items.map((item, index) => {
    const taxes = (item.taxesDiscounts ?? [])
      .filter(
        (td) =>
          td.type === 'CGST' ||
          td.type === 'SGST' ||
          td.type === 'IGST' ||
          td.type === 'CESS'
      )
      .map((td) => ({
        type: td.type as 'CGST' | 'SGST' | 'IGST' | 'CESS',
        name: td.name,
        rate: td.rate,
        amount: td.amount,
        amountFormatted: formatCurrencyForTemplate(td.amount),
      }));

    return {
      index: index + 1,
      name: item.name,
      description: item.description ?? null,
      hsnCode: item.hsnCode ?? null,
      quantity: item.quantity,
      unit: item.unit,
      rate: item.rate,
      rateFormatted: formatCurrencyForTemplate(item.rate),
      amount: item.amount,
      amountFormatted: formatCurrencyForTemplate(item.amount),
      taxableAmount: item.taxableAmount,
      taxableAmountFormatted: formatCurrencyForTemplate(item.taxableAmount),
      totalTax: item.totalTax,
      totalTaxFormatted: formatCurrencyForTemplate(item.totalTax),
      total: item.total,
      totalFormatted: formatCurrencyForTemplate(item.total),
      taxes,
    };
  });
}

/**
 * Build tax summary data (grouped by tax type/rate)
 */
function buildTaxSummaryData(
  invoice: InvoiceWithDetails
): TaxSummaryTemplateData[] {
  if (!invoice.items) return [];

  // Group taxes by type and rate
  const summaryMap = new Map<
    string,
    {
      type: 'CGST' | 'SGST' | 'IGST' | 'CESS';
      name: string;
      rate: number;
      taxableAmount: number;
      amount: number;
    }
  >();

  for (const item of invoice.items) {
    for (const td of item.taxesDiscounts ?? []) {
      if (
        td.type !== 'CGST' &&
        td.type !== 'SGST' &&
        td.type !== 'IGST' &&
        td.type !== 'CESS'
      ) {
        continue;
      }

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
          type: td.type as 'CGST' | 'SGST' | 'IGST' | 'CESS',
          name: td.name,
          rate: td.rate,
          taxableAmount: td.taxableAmount,
          amount: td.amount,
        });
      }
    }
  }

  return Array.from(summaryMap.values()).map((entry) => ({
    type: entry.type,
    name: entry.name,
    rate: entry.rate,
    taxableAmount: entry.taxableAmount,
    taxableAmountFormatted: formatCurrencyForTemplate(entry.taxableAmount),
    amount: entry.amount,
    amountFormatted: formatCurrencyForTemplate(entry.amount),
  }));
}

/**
 * Build tax/discount entries data
 */
function buildTaxDiscountEntriesData(
  invoice: InvoiceWithDetails
): TaxDiscountEntryTemplateData[] {
  if (!invoice.taxDiscountEntries) return [];

  return invoice.taxDiscountEntries.map((entry) => ({
    entryType: entry.entryType as 'TAX' | 'DISCOUNT',
    name: entry.name,
    rate: entry.rate,
    rateType: entry.rateType as 'PERCENT' | 'AMOUNT',
    applicationMode: entry.applicationMode as 'BEFORE_TAX' | 'AFTER_TAX',
    amount: entry.amount,
    amountFormatted: formatCurrencyForTemplate(entry.amount),
  }));
}

/**
 * Build payments data
 */
function buildPaymentsData(invoice: InvoiceWithDetails): PaymentTemplateData[] {
  if (!invoice.payments) return [];

  return invoice.payments.map((payment) => {
    const paymentDate =
      payment.paymentDate instanceof Date
        ? payment.paymentDate
        : new Date((payment.paymentDate as number) * 1000);

    return {
      date: formatDateForTemplate(paymentDate),
      dateRaw: paymentDate,
      amount: payment.amount,
      amountFormatted: formatCurrencyForTemplate(payment.amount),
      method: payment.paymentMethod?.name ?? null,
      reference: payment.referenceNumber ?? null,
      notes: payment.notes ?? null,
    };
  });
}

/**
 * Get the default payment method from the database
 */
function getDefaultPaymentMethod(): PaymentMethod | undefined {
  const db = getActiveDb();
  return db
    .select()
    .from(paymentMethodsTable)
    .where(
      and(
        eq(paymentMethodsTable.isDefault, true),
        eq(paymentMethodsTable.isActive, true)
      )
    )
    .get();
}

/**
 * Build bank details data from default payment method
 */
function buildBankDetailsData(): BankDetailsTemplateData {
  // Always use the default payment method for bank details on invoice
  const paymentMethod = getDefaultPaymentMethod();

  if (!paymentMethod) {
    return {
      hasBankDetails: false,
      bankName: null,
      accountNumber: null,
      accountHolder: null,
      ifscCode: null,
      branchName: null,
      upiId: null,
      paymentMethodName: null,
      paymentMethodType: null,
    };
  }

  // Check if there are actual bank details to show
  const hasBankDetails = !!(
    paymentMethod.bankName ||
    paymentMethod.accountNumber ||
    paymentMethod.ifscCode ||
    paymentMethod.upiId
  );

  return {
    hasBankDetails,
    bankName: paymentMethod.bankName ?? null,
    accountNumber: paymentMethod.accountNumber ?? null,
    accountHolder: paymentMethod.accountHolder ?? null,
    ifscCode: paymentMethod.ifscCode ?? null,
    branchName: paymentMethod.branchName ?? null,
    upiId: paymentMethod.upiId ?? null,
    paymentMethodName: paymentMethod.name,
    paymentMethodType: paymentMethod.type,
  };
}

/**
 * Build complete template data object
 */
export function buildTemplateData(
  invoice: InvoiceWithDetails,
  company: Company,
  format: InvoiceFormat
): TemplateData {
  const now = new Date();

  return {
    company: buildCompanyData(company),
    customer: buildCustomerData(invoice),
    invoice: buildInvoiceData(invoice),
    items: buildItemsData(invoice),
    taxSummary: buildTaxSummaryData(invoice),
    taxDiscountEntries: buildTaxDiscountEntriesData(invoice),
    payments: buildPaymentsData(invoice),
    bankDetails: buildBankDetailsData(),
    currencySymbol: '₹',
    printDate: formatDateForTemplate(now),
    printDateTime: now.toLocaleString('en-IN'),
    styles: format.cssStyles,
    // Helper functions
    formatCurrency: formatCurrencyForTemplate,
    formatDate: formatDateForTemplate,
    formatNumber: formatNumberForTemplate,
  };
}

/**
 * Render an EJS template with data
 */
export function renderTemplate(template: string, data: TemplateData): string {
  try {
    return ejs.render(template, data, {
      rmWhitespace: false,
    });
  } catch (error) {
    console.error('Template rendering error:', error);
    throw new Error(
      `Failed to render template: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Render a complete invoice HTML using the format template
 */
export function renderInvoiceHtml(
  invoice: InvoiceWithDetails,
  company: Company,
  format: InvoiceFormat
): string {
  const data = buildTemplateData(invoice, company, format);
  return renderTemplate(format.htmlTemplate, data);
}

/**
 * Get full HTML document with embedded CSS for PDF generation
 */
export function getFullHtmlDocument(
  invoice: InvoiceWithDetails,
  company: Company,
  format: InvoiceFormat
): string {
  const data = buildTemplateData(invoice, company, format);
  const bodyHtml = renderTemplate(format.htmlTemplate, data);

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${company.name} - Invoice ${invoice.invoiceNumber}</title>
  <style>
${format.cssStyles}
  </style>
</head>
<body>
${bodyHtml}
</body>
</html>`;
}
