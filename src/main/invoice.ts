import { invoicesTable } from '@db/schema/invoices';
import { invoiceItemsTable } from '@db/schema/invoice-items';
import { invoiceItemTaxesDiscountsTable } from '@db/schema/invoice-item-taxes-discounts';
import { invoiceTaxesDiscountsTable } from '@db/schema/invoice-taxes-discounts';
import { invoicePaymentsTable } from '@db/schema/invoice-payments';
import { customersTable } from '@db/schema/customers';
import { invoiceSeriesTable } from '@db/schema/invoice-series';
import { taxTemplatesTable } from '@db/schema/tax-templates';
import { discountTemplatesTable } from '@db/schema/discount-templates';
import { paymentMethodsTable } from '@db/schema/payment-methods';
import { companiesTable } from '@db/schema/companies';
import { getActiveDb } from './company-manager';
import { dialog, ipcMain } from 'electron';
import { InvoiceIpcChannel, formatIpcError } from '@shared/ipc';
import {
  CreateInvoiceRequest,
  UpdateInvoiceRequest,
  UpdateInvoiceStatusRequest,
  RecordPaymentRequest,
  InvoiceListParams,
  InvoiceListResponse,
  InvoiceWithDetails,
  InvoiceItemWithDetails,
  InvoicePaymentWithDetails,
  calculateInvoiceItem,
  calculateInvoiceTotalsWithEntries,
  CalculatedInvoiceItem,
  GstType,
  determineGstType,
  recalculateInvoiceStatus,
  InvoiceStatus,
  InvoiceTaxDiscountInput,
} from '@shared/invoice';
import { formatInvoiceNumber } from '@shared/invoice-series';
import { roundToTwo } from '@shared/tax-template';
import {
  eq,
  asc,
  desc,
  and,
  or,
  like,
  sql,
  gte,
  lte,
  inArray,
} from 'drizzle-orm';

// ============================================
// Helper Functions
// ============================================

function getCompanyStateCode(): string {
  const db = getActiveDb();
  const company = db
    .select({ stateCode: companiesTable.stateCode })
    .from(companiesTable)
    .limit(1)
    .get();
  return company?.stateCode ?? '';
}

function buildCalculatedItems(
  items: CreateInvoiceRequest['items'],
  gstType: GstType,
  db: ReturnType<typeof getActiveDb>
): CalculatedInvoiceItem[] {
  return items.map((item) => {
    let taxRate = 0;
    let taxTemplateName: string | undefined;
    let cessRate = 0;
    let cessTemplateName: string | undefined;
    let discountName: string | undefined;

    // Get tax template info
    if (item.taxTemplateId) {
      const taxTemplate = db
        .select()
        .from(taxTemplatesTable)
        .where(eq(taxTemplatesTable.id, item.taxTemplateId))
        .get();
      taxRate = taxTemplate?.rate ?? 0;
      taxTemplateName = taxTemplate?.name;
    } else if (item.customTaxRate != null) {
      taxRate = item.customTaxRate;
    }

    // Get cess template info
    if (item.cessTemplateId) {
      const cessTemplate = db
        .select()
        .from(taxTemplatesTable)
        .where(eq(taxTemplatesTable.id, item.cessTemplateId))
        .get();
      cessRate = cessTemplate?.rate ?? 0;
      cessTemplateName = cessTemplate?.name;
    } else if (item.customCessRate != null) {
      cessRate = item.customCessRate;
    }

    // Get discount template info
    if (item.discountTemplateId) {
      const discountTemplate = db
        .select()
        .from(discountTemplatesTable)
        .where(eq(discountTemplatesTable.id, item.discountTemplateId))
        .get();
      discountName = discountTemplate?.name;
    }

    const calculated = calculateInvoiceItem({
      quantity: item.quantity,
      rate: item.rate,
      discountType: item.discountType ?? null,
      discountValue: item.discountValue ?? 0,
      discountTemplateId: item.discountTemplateId ?? null,
      discountName,
      taxRate,
      taxTemplateId: item.taxTemplateId ?? null,
      taxTemplateName,
      cessRate,
      cessTemplateId: item.cessTemplateId ?? null,
      cessTemplateName,
      gstType,
    });

    return {
      name: item.name,
      description: item.description,
      hsnCode: item.hsnCode,
      quantity: item.quantity,
      unit: item.unit,
      rate: item.rate,
      amount: calculated.amount,
      taxableAmount: calculated.taxableAmount,
      totalDiscount: calculated.totalDiscount,
      totalTax: calculated.totalTax,
      total: calculated.total,
      taxesDiscounts: calculated.taxesDiscounts,
    };
  });
}

// ============================================
// Database Operations
// ============================================

function createInvoice(data: CreateInvoiceRequest): InvoiceWithDetails {
  const db = getActiveDb();

  const customer = db
    .select()
    .from(customersTable)
    .where(eq(customersTable.id, data.customerId))
    .get();

  if (!customer) {
    throw new Error('Customer not found');
  }

  const series = db
    .select()
    .from(invoiceSeriesTable)
    .where(eq(invoiceSeriesTable.id, data.invoiceSeriesId))
    .get();

  if (!series) {
    throw new Error('Invoice series not found');
  }

  const companyStateCode = getCompanyStateCode();
  const gstType = determineGstType(companyStateCode, customer.stateCode);
  const invoiceNumber = formatInvoiceNumber(
    series.prefix,
    series.nextNumber,
    series.suffix
  );
  const calculatedItems = buildCalculatedItems(data.items, gstType, db);

  // Build tax/discount entries - support both new format and legacy format
  const taxDiscountInputs: InvoiceTaxDiscountInput[] = [];

  // Support legacy single-entry format for backward compatibility
  if (data.additionalTaxTemplateId || data.additionalTaxRate) {
    const taxTemplate = data.additionalTaxTemplateId
      ? db
          .select()
          .from(taxTemplatesTable)
          .where(eq(taxTemplatesTable.id, data.additionalTaxTemplateId))
          .get()
      : null;
    taxDiscountInputs.push({
      entryType: 'TAX',
      taxTemplateId: data.additionalTaxTemplateId ?? null,
      name:
        taxTemplate?.name ?? `Additional Tax @ ${data.additionalTaxRate ?? 0}%`,
      rateType: 'PERCENT',
      rate: taxTemplate?.rate ?? data.additionalTaxRate ?? 0,
      applicationMode: 'AFTER_TAX',
      sortOrder: 0,
    });
  }

  if (data.discountType && data.discountValue && data.discountValue > 0) {
    taxDiscountInputs.push({
      entryType: 'DISCOUNT',
      name:
        data.discountType === 'PERCENT'
          ? `Discount ${data.discountValue}%`
          : `Discount ₹${data.discountValue}`,
      rateType: data.discountType,
      rate: data.discountValue,
      applicationMode: data.discountAfterTax ? 'AFTER_TAX' : 'BEFORE_TAX',
      sortOrder: 1,
    });
  }

  // Add new-style entries (these take precedence if provided)
  if (data.taxDiscountEntries && data.taxDiscountEntries.length > 0) {
    // If new entries are provided, use them instead of legacy fields
    taxDiscountInputs.length = 0;
    taxDiscountInputs.push(...data.taxDiscountEntries);
  }

  // Use the new calculation function with entries
  const totals = calculateInvoiceTotalsWithEntries(
    calculatedItems,
    taxDiscountInputs
  );

  // For backward compatibility, store first tax and discount in legacy fields
  const firstTaxEntry = totals.taxDiscountCalc.entries.find(
    (e) => e.entryType === 'TAX'
  );
  const firstDiscountEntry = totals.taxDiscountCalc.entries.find(
    (e) => e.entryType === 'DISCOUNT'
  );

  const invoice = db
    .insert(invoicesTable)
    .values({
      invoiceNumber,
      invoiceSeriesId: data.invoiceSeriesId,
      customerId: data.customerId,
      invoiceFormatId: data.invoiceFormatId ?? null,
      invoiceDate: data.invoiceDate,
      gstType,
      subTotal: totals.subTotal,
      totalItemDiscount: totals.totalItemDiscount,
      taxableTotal: totals.taxableTotal,
      totalCgst: totals.totalCgst,
      totalSgst: totals.totalSgst,
      totalIgst: totals.totalIgst,
      totalCess: totals.totalCess,
      totalTax: totals.totalTax,
      // Legacy fields for backward compatibility
      additionalTaxTemplateId: firstTaxEntry?.taxTemplateId ?? null,
      additionalTaxName: firstTaxEntry?.name,
      additionalTaxRate: firstTaxEntry?.rate ?? 0,
      additionalTaxAmount: totals.additionalTaxAmount,
      discountType:
        firstDiscountEntry?.rateType === 'PERCENT' ? 'PERCENT' : 'AMOUNT',
      discountValue: firstDiscountEntry?.rate,
      discountAmount: totals.discountAmount,
      discountAfterTax: firstDiscountEntry?.applicationMode === 'AFTER_TAX',
      grandTotal: totals.grandTotal,
      paidAmount: data.paidAmount ?? 0,
      dueAmount: roundToTwo(totals.grandTotal - (data.paidAmount ?? 0)),
      paymentMethodId: data.paymentMethodId,
      notes: data.notes,
      status: data.status ?? 'UNPAID',
      reverseCharge: data.reverseCharge ?? false,
    })
    .returning()
    .get();

  for (let i = 0; i < data.items.length; i++) {
    const item = data.items[i];
    const calculated = calculatedItems[i];

    // Insert invoice item
    const invoiceItem = db
      .insert(invoiceItemsTable)
      .values({
        invoiceId: invoice.id,
        itemId: item.itemId,
        name: item.name,
        description: item.description,
        hsnCode: item.hsnCode,
        quantity: item.quantity,
        unit: item.unit,
        rate: item.rate,
        amount: calculated.amount,
        taxableAmount: calculated.taxableAmount,
        totalDiscount: calculated.totalDiscount,
        totalTax: calculated.totalTax,
        total: calculated.total,
        sortOrder: item.sortOrder ?? i,
      })
      .returning()
      .get();

    // Insert tax/discount entries for this item
    for (const td of calculated.taxesDiscounts) {
      db.insert(invoiceItemTaxesDiscountsTable)
        .values({
          invoiceItemId: invoiceItem.id,
          taxTemplateId: td.taxTemplateId ?? null,
          discountTemplateId: td.discountTemplateId ?? null,
          type: td.type,
          name: td.name,
          rate: td.rate,
          rateType: td.rateType,
          taxableAmount: td.taxableAmount,
          amount: td.amount,
          sortOrder: td.sortOrder,
        })
        .run();
    }
  }

  // Insert invoice-level tax/discount entries
  for (const entry of totals.taxDiscountCalc.entries) {
    db.insert(invoiceTaxesDiscountsTable)
      .values({
        invoiceId: invoice.id,
        entryType: entry.entryType,
        taxTemplateId: entry.taxTemplateId ?? null,
        discountTemplateId: entry.discountTemplateId ?? null,
        name: entry.name,
        rateType: entry.rateType,
        rate: entry.rate,
        applicationMode: entry.applicationMode,
        baseAmount: entry.baseAmount,
        amount: entry.amount,
        sortOrder: entry.sortOrder,
      })
      .run();
  }

  db.update(invoiceSeriesTable)
    .set({ nextNumber: series.nextNumber + 1, updatedAt: new Date() })
    .where(eq(invoiceSeriesTable.id, data.invoiceSeriesId))
    .run();

  // If paid amount is provided, create a payment record
  if (data.paidAmount && data.paidAmount > 0) {
    // paidDate may come as string (ISO) through IPC, convert to Date
    let paymentDate: Date;
    if (data.paidDate) {
      paymentDate =
        typeof data.paidDate === 'string'
          ? new Date(data.paidDate)
          : data.paidDate;
    } else {
      paymentDate = new Date();
    }

    db.insert(invoicePaymentsTable)
      .values({
        invoiceId: invoice.id,
        amount: data.paidAmount,
        paymentDate,
        paymentMethodId: data.paymentMethodId ?? null,
        referenceNumber: null,
        notes: 'Initial payment at invoice creation',
      })
      .run();
  }

  return getInvoice(invoice.id)!;
}

function getInvoice(id: number): InvoiceWithDetails | undefined {
  const db = getActiveDb();
  const invoice = db
    .select()
    .from(invoicesTable)
    .where(eq(invoicesTable.id, id))
    .get();

  if (!invoice) return undefined;

  const customer = db
    .select()
    .from(customersTable)
    .where(eq(customersTable.id, invoice.customerId))
    .get();
  const invoiceSeries = db
    .select()
    .from(invoiceSeriesTable)
    .where(eq(invoiceSeriesTable.id, invoice.invoiceSeriesId))
    .get();

  let paymentMethod;
  if (invoice.paymentMethodId) {
    paymentMethod = db
      .select()
      .from(paymentMethodsTable)
      .where(eq(paymentMethodsTable.id, invoice.paymentMethodId))
      .get();
  }

  const items = db
    .select()
    .from(invoiceItemsTable)
    .where(eq(invoiceItemsTable.invoiceId, id))
    .orderBy(asc(invoiceItemsTable.sortOrder))
    .all();

  const itemsWithDetails: InvoiceItemWithDetails[] = items.map((item) => {
    // Fetch tax/discount entries for this item
    const taxesDiscounts = db
      .select()
      .from(invoiceItemTaxesDiscountsTable)
      .where(eq(invoiceItemTaxesDiscountsTable.invoiceItemId, item.id))
      .orderBy(asc(invoiceItemTaxesDiscountsTable.sortOrder))
      .all();

    return {
      ...item,
      taxesDiscounts,
    };
  });

  const payments = db
    .select()
    .from(invoicePaymentsTable)
    .where(eq(invoicePaymentsTable.invoiceId, id))
    .orderBy(desc(invoicePaymentsTable.paymentDate))
    .all();

  const paymentsWithDetails: InvoicePaymentWithDetails[] = payments.map(
    (payment) => {
      let method;
      if (payment.paymentMethodId) {
        method = db
          .select()
          .from(paymentMethodsTable)
          .where(eq(paymentMethodsTable.id, payment.paymentMethodId))
          .get();
      }
      return { ...payment, paymentMethod: method ?? null };
    }
  );

  // Fetch invoice-level tax/discount entries
  const taxDiscountEntries = db
    .select()
    .from(invoiceTaxesDiscountsTable)
    .where(eq(invoiceTaxesDiscountsTable.invoiceId, id))
    .orderBy(asc(invoiceTaxesDiscountsTable.sortOrder))
    .all();

  return {
    ...invoice,
    customer,
    invoiceSeries,
    paymentMethod,
    items: itemsWithDetails,
    payments: paymentsWithDetails,
    taxDiscountEntries,
  };
}

function updateInvoice(
  id: number,
  data: Omit<UpdateInvoiceRequest, 'id'>
): InvoiceWithDetails {
  const db = getActiveDb();
  const existing = db
    .select()
    .from(invoicesTable)
    .where(eq(invoicesTable.id, id))
    .get();

  if (!existing) throw new Error('Invoice not found');
  if (existing.status === 'CANCELLED') {
    throw new Error('Cancelled invoices cannot be edited');
  }
  if (existing.isArchived) {
    throw new Error('Archived invoices cannot be edited');
  }

  const gstType = existing.gstType as GstType;

  if (data.items) {
    // Build tax/discount entries - support both new format and legacy format
    const taxDiscountInputs: InvoiceTaxDiscountInput[] = [];

    // Support legacy single-entry format for backward compatibility
    if (data.additionalTaxTemplateId || data.additionalTaxRate) {
      const taxTemplate = data.additionalTaxTemplateId
        ? db
            .select()
            .from(taxTemplatesTable)
            .where(eq(taxTemplatesTable.id, data.additionalTaxTemplateId))
            .get()
        : null;
      taxDiscountInputs.push({
        entryType: 'TAX',
        taxTemplateId: data.additionalTaxTemplateId ?? null,
        name:
          taxTemplate?.name ??
          `Additional Tax @ ${data.additionalTaxRate ?? 0}%`,
        rateType: 'PERCENT',
        rate: taxTemplate?.rate ?? data.additionalTaxRate ?? 0,
        applicationMode: 'AFTER_TAX',
        sortOrder: 0,
      });
    }

    if (data.discountType && data.discountValue && data.discountValue > 0) {
      taxDiscountInputs.push({
        entryType: 'DISCOUNT',
        name:
          data.discountType === 'PERCENT'
            ? `Discount ${data.discountValue}%`
            : `Discount ₹${data.discountValue}`,
        rateType: data.discountType,
        rate: data.discountValue,
        applicationMode: data.discountAfterTax ? 'AFTER_TAX' : 'BEFORE_TAX',
        sortOrder: 1,
      });
    }

    // Add new-style entries (these take precedence if provided)
    if (data.taxDiscountEntries && data.taxDiscountEntries.length > 0) {
      taxDiscountInputs.length = 0;
      taxDiscountInputs.push(...data.taxDiscountEntries);
    }

    const calculatedItems = buildCalculatedItems(data.items, gstType, db);
    const totals = calculateInvoiceTotalsWithEntries(
      calculatedItems,
      taxDiscountInputs
    );

    // For backward compatibility, store first tax and discount in legacy fields
    const firstTaxEntry = totals.taxDiscountCalc.entries.find(
      (e) => e.entryType === 'TAX'
    );
    const firstDiscountEntry = totals.taxDiscountCalc.entries.find(
      (e) => e.entryType === 'DISCOUNT'
    );

    // Calculate new due amount and status
    // Handle overpayment: if paid amount exceeds new total, cap it at new total
    const newPaidAmount =
      existing.paidAmount > totals.grandTotal
        ? totals.grandTotal
        : existing.paidAmount;
    const newDueAmount = roundToTwo(totals.grandTotal - newPaidAmount);
    const newStatus = recalculateInvoiceStatus(
      totals.grandTotal,
      newPaidAmount,
      existing.status as InvoiceStatus
    );

    db.update(invoicesTable)
      .set({
        invoiceDate: data.invoiceDate ?? existing.invoiceDate,
        invoiceFormatId: data.invoiceFormatId ?? existing.invoiceFormatId,
        subTotal: totals.subTotal,
        totalItemDiscount: totals.totalItemDiscount,
        taxableTotal: totals.taxableTotal,
        totalCgst: totals.totalCgst,
        totalSgst: totals.totalSgst,
        totalIgst: totals.totalIgst,
        totalCess: totals.totalCess,
        totalTax: totals.totalTax,
        // Legacy fields for backward compatibility
        additionalTaxTemplateId: firstTaxEntry?.taxTemplateId ?? null,
        additionalTaxName: firstTaxEntry?.name,
        additionalTaxRate: firstTaxEntry?.rate ?? 0,
        additionalTaxAmount: totals.additionalTaxAmount,
        discountType:
          firstDiscountEntry?.rateType === 'PERCENT' ? 'PERCENT' : 'AMOUNT',
        discountValue: firstDiscountEntry?.rate,
        discountAmount: totals.discountAmount,
        discountAfterTax: firstDiscountEntry?.applicationMode === 'AFTER_TAX',
        grandTotal: totals.grandTotal,
        paidAmount: newPaidAmount,
        dueAmount: newDueAmount,
        status: newStatus,
        paymentMethodId: data.paymentMethodId,
        notes: data.notes,
        reverseCharge: data.reverseCharge ?? existing.reverseCharge,
        updatedAt: new Date(),
      })
      .where(eq(invoicesTable.id, id))
      .run();

    // Delete existing items (cascade will delete related taxes_discounts)
    db.delete(invoiceItemsTable)
      .where(eq(invoiceItemsTable.invoiceId, id))
      .run();

    for (let i = 0; i < data.items.length; i++) {
      const item = data.items[i];
      const calculated = calculatedItems[i];

      // Insert invoice item
      const invoiceItem = db
        .insert(invoiceItemsTable)
        .values({
          invoiceId: id,
          itemId: item.itemId,
          name: item.name,
          description: item.description,
          hsnCode: item.hsnCode,
          quantity: item.quantity,
          unit: item.unit,
          rate: item.rate,
          amount: calculated.amount,
          taxableAmount: calculated.taxableAmount,
          totalDiscount: calculated.totalDiscount,
          totalTax: calculated.totalTax,
          total: calculated.total,
          sortOrder: item.sortOrder ?? i,
        })
        .returning()
        .get();

      // Insert tax/discount entries for this item
      for (const td of calculated.taxesDiscounts) {
        db.insert(invoiceItemTaxesDiscountsTable)
          .values({
            invoiceItemId: invoiceItem.id,
            taxTemplateId: td.taxTemplateId ?? null,
            discountTemplateId: td.discountTemplateId ?? null,
            type: td.type,
            name: td.name,
            rate: td.rate,
            rateType: td.rateType,
            taxableAmount: td.taxableAmount,
            amount: td.amount,
            sortOrder: td.sortOrder,
          })
          .run();
      }
    }

    // Delete existing invoice-level tax/discount entries
    db.delete(invoiceTaxesDiscountsTable)
      .where(eq(invoiceTaxesDiscountsTable.invoiceId, id))
      .run();

    // Insert new invoice-level tax/discount entries
    for (const entry of totals.taxDiscountCalc.entries) {
      db.insert(invoiceTaxesDiscountsTable)
        .values({
          invoiceId: id,
          entryType: entry.entryType,
          taxTemplateId: entry.taxTemplateId ?? null,
          discountTemplateId: entry.discountTemplateId ?? null,
          name: entry.name,
          rateType: entry.rateType,
          rate: entry.rate,
          applicationMode: entry.applicationMode,
          baseAmount: entry.baseAmount,
          amount: entry.amount,
          sortOrder: entry.sortOrder,
        })
        .run();
    }
  } else {
    db.update(invoicesTable)
      .set({
        invoiceDate: data.invoiceDate ?? existing.invoiceDate,
        invoiceFormatId: data.invoiceFormatId ?? existing.invoiceFormatId,
        paymentMethodId: data.paymentMethodId,
        notes: data.notes,
        reverseCharge: data.reverseCharge ?? existing.reverseCharge,
        updatedAt: new Date(),
      })
      .where(eq(invoicesTable.id, id))
      .run();
  }

  return getInvoice(id)!;
}

function listInvoices(params: InvoiceListParams = {}): InvoiceListResponse {
  const db = getActiveDb();
  const {
    search,
    status,
    customerId,
    dateFrom,
    dateTo,
    isArchived = false,
    limit = 50,
    offset = 0,
  } = params;

  const conditions = [eq(invoicesTable.isArchived, isArchived)];

  if (status) conditions.push(eq(invoicesTable.status, status));
  if (customerId) conditions.push(eq(invoicesTable.customerId, customerId));
  if (dateFrom) conditions.push(gte(invoicesTable.invoiceDate, dateFrom));
  if (dateTo) conditions.push(lte(invoicesTable.invoiceDate, dateTo));

  if (search) {
    const searchPattern = `%${search}%`;
    const matchingCustomerIds = db
      .select({ id: customersTable.id })
      .from(customersTable)
      .where(like(customersTable.name, searchPattern))
      .all()
      .map((c) => c.id);

    if (matchingCustomerIds.length > 0) {
      conditions.push(
        or(
          like(invoicesTable.invoiceNumber, searchPattern),
          inArray(invoicesTable.customerId, matchingCustomerIds)
        )!
      );
    } else {
      conditions.push(like(invoicesTable.invoiceNumber, searchPattern));
    }
  }

  const countResult = db
    .select({ count: sql<number>`count(*)` })
    .from(invoicesTable)
    .where(and(...conditions))
    .get();
  const total = countResult?.count ?? 0;

  const invoices = db
    .select()
    .from(invoicesTable)
    .where(and(...conditions))
    .orderBy(desc(invoicesTable.invoiceDate), desc(invoicesTable.id))
    .limit(limit)
    .offset(offset)
    .all();

  const invoicesWithDetails: InvoiceWithDetails[] = invoices.map((invoice) => {
    const customer = db
      .select()
      .from(customersTable)
      .where(eq(customersTable.id, invoice.customerId))
      .get();
    return { ...invoice, customer };
  });

  return { invoices: invoicesWithDetails, total, limit, offset };
}

function updateInvoiceStatus(
  id: number,
  data: Omit<UpdateInvoiceStatusRequest, 'id'>
): InvoiceWithDetails {
  const db = getActiveDb();
  const existing = db
    .select()
    .from(invoicesTable)
    .where(eq(invoicesTable.id, id))
    .get();

  if (!existing) throw new Error('Invoice not found');
  if (existing.isArchived)
    throw new Error('Archived invoices cannot be modified');

  if (data.status === 'CANCELLED') {
    if (existing.status === 'PAID')
      throw new Error('Paid invoices cannot be cancelled');
    if (!data.cancelReason) throw new Error('Cancel reason is required');
  }

  db.update(invoicesTable)
    .set({
      status: data.status,
      cancelReason: data.cancelReason,
      updatedAt: new Date(),
    })
    .where(eq(invoicesTable.id, id))
    .run();

  return getInvoice(id)!;
}

function archiveInvoice(id: number): void {
  const db = getActiveDb();
  db.update(invoicesTable)
    .set({ isArchived: true, updatedAt: new Date() })
    .where(eq(invoicesTable.id, id))
    .run();
}

function restoreInvoice(id: number): void {
  const db = getActiveDb();
  db.update(invoicesTable)
    .set({ isArchived: false, updatedAt: new Date() })
    .where(eq(invoicesTable.id, id))
    .run();
}

function recordPayment(data: RecordPaymentRequest): InvoiceWithDetails {
  const db = getActiveDb();

  // Validate payment method is provided
  if (!data.paymentMethodId) {
    throw new Error('Payment method is required');
  }

  // Validate payment method exists
  const paymentMethod = db
    .select()
    .from(paymentMethodsTable)
    .where(eq(paymentMethodsTable.id, data.paymentMethodId))
    .get();

  if (!paymentMethod) {
    throw new Error('Invalid payment method');
  }

  const invoice = db
    .select()
    .from(invoicesTable)
    .where(eq(invoicesTable.id, data.invoiceId))
    .get();

  if (!invoice) throw new Error('Invoice not found');
  if (invoice.status === 'CANCELLED')
    throw new Error('Cannot record payment for cancelled invoice');
  if (data.amount <= 0) throw new Error('Payment amount must be positive');
  if (data.amount > invoice.dueAmount)
    throw new Error('Payment amount cannot exceed due amount');

  db.insert(invoicePaymentsTable)
    .values({
      invoiceId: data.invoiceId,
      paymentMethodId: data.paymentMethodId,
      amount: data.amount,
      paymentDate: data.paymentDate,
      referenceNumber: data.referenceNumber,
      notes: data.notes,
    })
    .run();

  const newPaidAmount = roundToTwo(invoice.paidAmount + data.amount);
  const newDueAmount = roundToTwo(invoice.grandTotal - newPaidAmount);
  let newStatus = invoice.status;
  if (newDueAmount <= 0) newStatus = 'PAID';
  else if (newPaidAmount > 0) newStatus = 'PARTIALLY_PAID';

  db.update(invoicesTable)
    .set({
      paidAmount: newPaidAmount,
      dueAmount: newDueAmount,
      status: newStatus,
      updatedAt: new Date(),
    })
    .where(eq(invoicesTable.id, data.invoiceId))
    .run();

  return getInvoice(data.invoiceId)!;
}

function deletePayment(paymentId: number): InvoiceWithDetails {
  const db = getActiveDb();
  const payment = db
    .select()
    .from(invoicePaymentsTable)
    .where(eq(invoicePaymentsTable.id, paymentId))
    .get();

  if (!payment) throw new Error('Payment not found');

  const invoice = db
    .select()
    .from(invoicesTable)
    .where(eq(invoicesTable.id, payment.invoiceId))
    .get();
  if (!invoice) throw new Error('Invoice not found');

  db.delete(invoicePaymentsTable)
    .where(eq(invoicePaymentsTable.id, paymentId))
    .run();

  const newPaidAmount = roundToTwo(invoice.paidAmount - payment.amount);
  const newDueAmount = roundToTwo(invoice.grandTotal - newPaidAmount);
  let newStatus = invoice.status;
  if (newPaidAmount <= 0) newStatus = 'UNPAID';
  else if (newDueAmount > 0) newStatus = 'PARTIALLY_PAID';

  db.update(invoicesTable)
    .set({
      paidAmount: newPaidAmount,
      dueAmount: newDueAmount,
      status: newStatus,
      updatedAt: new Date(),
    })
    .where(eq(invoicesTable.id, payment.invoiceId))
    .run();

  return getInvoice(payment.invoiceId)!;
}

// ============================================
// IPC Handlers
// ============================================

export function registerInvoiceHandlers() {
  ipcMain.handle(
    InvoiceIpcChannel.Create,
    async (_event, data: CreateInvoiceRequest) => {
      try {
        return createInvoice(data);
      } catch (error) {
        throw new Error(formatIpcError(error));
      }
    }
  );

  ipcMain.handle(InvoiceIpcChannel.Get, async (_event, id: number) => {
    try {
      return getInvoice(id);
    } catch (error) {
      throw new Error(formatIpcError(error));
    }
  });

  ipcMain.handle(
    InvoiceIpcChannel.Update,
    async (_event, data: UpdateInvoiceRequest) => {
      try {
        const { id, ...updateData } = data;
        return updateInvoice(id, updateData);
      } catch (error) {
        throw new Error(formatIpcError(error));
      }
    }
  );

  ipcMain.handle(
    InvoiceIpcChannel.List,
    async (_event, params?: InvoiceListParams) => {
      try {
        return listInvoices(params);
      } catch (error) {
        throw new Error(formatIpcError(error));
      }
    }
  );

  ipcMain.handle(
    InvoiceIpcChannel.UpdateStatus,
    async (_event, data: UpdateInvoiceStatusRequest) => {
      try {
        const { id, ...statusData } = data;
        return updateInvoiceStatus(id, statusData);
      } catch (error) {
        throw new Error(formatIpcError(error));
      }
    }
  );

  ipcMain.handle(
    InvoiceIpcChannel.Archive,
    async (_event, id: number, invoiceNumber: string) => {
      try {
        const result = await dialog.showMessageBox({
          type: 'warning',
          message: `Are you sure you want to archive invoice ${invoiceNumber}?`,
          detail: 'Archived invoices can be restored later.',
          buttons: ['Yes', 'No'],
        });
        if (result.response === 0) {
          archiveInvoice(id);
          return true;
        }
        return false;
      } catch (error) {
        throw new Error(formatIpcError(error));
      }
    }
  );

  ipcMain.handle(
    InvoiceIpcChannel.Restore,
    async (_event, id: number, invoiceNumber: string) => {
      try {
        const result = await dialog.showMessageBox({
          type: 'info',
          message: `Are you sure you want to restore invoice ${invoiceNumber}?`,
          buttons: ['Yes', 'No'],
        });
        if (result.response === 0) {
          restoreInvoice(id);
          return true;
        }
        return false;
      } catch (error) {
        throw new Error(formatIpcError(error));
      }
    }
  );

  ipcMain.handle(
    InvoiceIpcChannel.RecordPayment,
    async (_event, data: RecordPaymentRequest) => {
      try {
        return recordPayment(data);
      } catch (error) {
        throw new Error(formatIpcError(error));
      }
    }
  );

  ipcMain.handle(
    InvoiceIpcChannel.DeletePayment,
    async (_event, paymentId: number) => {
      try {
        const result = await dialog.showMessageBox({
          type: 'warning',
          message: 'Are you sure you want to delete this payment?',
          detail: 'This action cannot be undone.',
          buttons: ['Yes', 'No'],
        });
        if (result.response === 0) {
          return deletePayment(paymentId);
        }
        return null;
      } catch (error) {
        throw new Error(formatIpcError(error));
      }
    }
  );
}
