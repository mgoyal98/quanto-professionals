import { InvoicePayment } from './invoice';
import { PaymentMethod } from './payment-method';

// ============================================
// Payment Types for Payments Section
// ============================================

export interface PaymentListParams {
  search?: string;
  paymentMethodId?: number;
  dateFrom?: Date;
  dateTo?: Date;
  invoiceId?: number;
  limit?: number;
  offset?: number;
}

export interface PaymentListResponse {
  payments: PaymentWithDetails[];
  total: number;
  limit: number;
  offset: number;
}

export interface PaymentWithDetails extends InvoicePayment {
  invoice?: {
    id: number;
    invoiceNumber: string;
    customer?: {
      id: number;
      name: string;
    };
  };
  paymentMethod?: PaymentMethod | null;
}

/**
 * Format payment date for display
 */
export function formatPaymentDate(date: Date | number): string {
  const d = typeof date === 'number' ? new Date(date * 1000) : date;
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

