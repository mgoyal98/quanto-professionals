import { ipcMain } from 'electron';
import { PaymentIpcChannel, formatIpcError } from '@shared/ipc';
import { PaymentListParams, PaymentWithDetails, PaymentListResponse } from '@shared/payment';
import { invoicePaymentsTable } from '@db/schema/invoice-payments';
import { invoicesTable } from '@db/schema/invoices';
import { customersTable } from '@db/schema/customers';
import { paymentMethodsTable } from '@db/schema/payment-methods';
import { getActiveDb } from './company-manager';
import { eq, desc, and, gte, lte, like, or, sql } from 'drizzle-orm';
import { roundToTwo } from '@shared/tax-template';

// ============================================
// Payment Functions
// ============================================

function listPayments(params: PaymentListParams): PaymentListResponse {
  const db = getActiveDb();
  const limit = params.limit ?? 50;
  const offset = params.offset ?? 0;

  // Build conditions
  const conditions: ReturnType<typeof eq>[] = [];

  if (params.paymentMethodId) {
    conditions.push(eq(invoicePaymentsTable.paymentMethodId, params.paymentMethodId));
  }

  if (params.invoiceId) {
    conditions.push(eq(invoicePaymentsTable.invoiceId, params.invoiceId));
  }

  if (params.dateFrom) {
    conditions.push(gte(invoicePaymentsTable.paymentDate, params.dateFrom));
  }

  if (params.dateTo) {
    conditions.push(lte(invoicePaymentsTable.paymentDate, params.dateTo));
  }

  // Get total count
  const countResult = db
    .select({ count: sql<number>`count(*)` })
    .from(invoicePaymentsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .get();

  const total = countResult?.count ?? 0;

  // Get payments with joins
  const paymentRows = db
    .select({
      payment: invoicePaymentsTable,
      invoice: {
        id: invoicesTable.id,
        invoiceNumber: invoicesTable.invoiceNumber,
        customerId: invoicesTable.customerId,
      },
      paymentMethod: paymentMethodsTable,
    })
    .from(invoicePaymentsTable)
    .leftJoin(invoicesTable, eq(invoicePaymentsTable.invoiceId, invoicesTable.id))
    .leftJoin(paymentMethodsTable, eq(invoicePaymentsTable.paymentMethodId, paymentMethodsTable.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(invoicePaymentsTable.paymentDate))
    .limit(limit)
    .offset(offset)
    .all();

  // Get customer details for each payment
  const payments: PaymentWithDetails[] = paymentRows.map((row) => {
    let customer: { id: number; name: string } | undefined;

    if (row.invoice?.customerId) {
      const customerRow = db
        .select({ id: customersTable.id, name: customersTable.name })
        .from(customersTable)
        .where(eq(customersTable.id, row.invoice.customerId))
        .get();
      customer = customerRow ?? undefined;
    }

    // Filter by search if provided
    if (params.search) {
      const searchLower = params.search.toLowerCase();
      const matchesInvoice = row.invoice?.invoiceNumber?.toLowerCase().includes(searchLower);
      const matchesCustomer = customer?.name?.toLowerCase().includes(searchLower);
      const matchesRef = row.payment.referenceNumber?.toLowerCase().includes(searchLower);

      if (!matchesInvoice && !matchesCustomer && !matchesRef) {
        return null;
      }
    }

    return {
      ...row.payment,
      invoice: row.invoice
        ? {
            id: row.invoice.id,
            invoiceNumber: row.invoice.invoiceNumber,
            customer,
          }
        : undefined,
      paymentMethod: row.paymentMethod ?? null,
    };
  }).filter((p): p is PaymentWithDetails => p !== null);

  return {
    payments,
    total,
    limit,
    offset,
  };
}

function getPayment(id: number): PaymentWithDetails | null {
  const db = getActiveDb();

  const row = db
    .select({
      payment: invoicePaymentsTable,
      invoice: {
        id: invoicesTable.id,
        invoiceNumber: invoicesTable.invoiceNumber,
        customerId: invoicesTable.customerId,
      },
      paymentMethod: paymentMethodsTable,
    })
    .from(invoicePaymentsTable)
    .leftJoin(invoicesTable, eq(invoicePaymentsTable.invoiceId, invoicesTable.id))
    .leftJoin(paymentMethodsTable, eq(invoicePaymentsTable.paymentMethodId, paymentMethodsTable.id))
    .where(eq(invoicePaymentsTable.id, id))
    .get();

  if (!row) return null;

  let customer: { id: number; name: string } | undefined;

  if (row.invoice?.customerId) {
    const customerRow = db
      .select({ id: customersTable.id, name: customersTable.name })
      .from(customersTable)
      .where(eq(customersTable.id, row.invoice.customerId))
      .get();
    customer = customerRow ?? undefined;
  }

  return {
    ...row.payment,
    invoice: row.invoice
      ? {
          id: row.invoice.id,
          invoiceNumber: row.invoice.invoiceNumber,
          customer,
        }
      : undefined,
    paymentMethod: row.paymentMethod ?? null,
  };
}

function deletePayment(id: number): void {
  const db = getActiveDb();
  const payment = db.select().from(invoicePaymentsTable).where(eq(invoicePaymentsTable.id, id)).get();

  if (!payment) throw new Error('Payment not found');

  const invoice = db.select().from(invoicesTable).where(eq(invoicesTable.id, payment.invoiceId)).get();
  if (!invoice) throw new Error('Invoice not found');

  db.delete(invoicePaymentsTable).where(eq(invoicePaymentsTable.id, id)).run();

  const newPaidAmount = roundToTwo(invoice.paidAmount - payment.amount);
  const newDueAmount = roundToTwo(invoice.grandTotal - newPaidAmount);
  let newStatus = invoice.status;
  if (newPaidAmount <= 0) newStatus = 'UNPAID';
  else if (newDueAmount > 0) newStatus = 'PARTIALLY_PAID';

  db.update(invoicesTable)
    .set({ paidAmount: newPaidAmount, dueAmount: newDueAmount, status: newStatus, updatedAt: new Date() })
    .where(eq(invoicesTable.id, payment.invoiceId))
    .run();
}

// ============================================
// IPC Handlers
// ============================================

export function registerPaymentHandlers() {
  ipcMain.handle(PaymentIpcChannel.List, async (_event, params: PaymentListParams) => {
    try {
      return listPayments(params);
    } catch (error) {
      throw new Error(formatIpcError(error));
    }
  });

  ipcMain.handle(PaymentIpcChannel.Get, async (_event, id: number) => {
    try {
      return getPayment(id);
    } catch (error) {
      throw new Error(formatIpcError(error));
    }
  });

  ipcMain.handle(PaymentIpcChannel.Delete, async (_event, id: number) => {
    try {
      deletePayment(id);
      return { success: true };
    } catch (error) {
      throw new Error(formatIpcError(error));
    }
  });
}

