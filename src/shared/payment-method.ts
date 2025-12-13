import { paymentMethodsTable } from '@db/schema/payment-methods';
import { InferSelectModel } from 'drizzle-orm';

// Database model type
export type PaymentMethod = InferSelectModel<typeof paymentMethodsTable>;

// Payment method types
export const PAYMENT_METHOD_TYPES = [
  'CASH',
  'BANK_TRANSFER',
  'UPI',
  'CHEQUE',
  'CARD',
  'ONLINE',
  'OTHER',
] as const;

export type PaymentMethodType = (typeof PAYMENT_METHOD_TYPES)[number];

// Type labels for display
export const PAYMENT_METHOD_TYPE_LABELS: Record<PaymentMethodType, string> = {
  CASH: 'Cash',
  BANK_TRANSFER: 'Bank Transfer',
  UPI: 'UPI',
  CHEQUE: 'Cheque',
  CARD: 'Card',
  ONLINE: 'Online Payment',
  OTHER: 'Other',
};

// Type icons (MUI icon names)
export const PAYMENT_METHOD_TYPE_ICONS: Record<PaymentMethodType, string> = {
  CASH: 'Payments',
  BANK_TRANSFER: 'AccountBalance',
  UPI: 'QrCode',
  CHEQUE: 'Receipt',
  CARD: 'CreditCard',
  ONLINE: 'Language',
  OTHER: 'MoreHoriz',
};

// Request types for CRUD operations
export interface CreatePaymentMethodRequest {
  name: string;
  type: PaymentMethodType;
  description?: string;
  instructions?: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  accountHolder?: string;
  branchName?: string;
  upiId?: string;
  isDefault?: boolean;
}

export interface UpdatePaymentMethodRequest {
  id: number;
  name: string;
  type: PaymentMethodType;
  description?: string;
  instructions?: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  accountHolder?: string;
  branchName?: string;
  upiId?: string;
  isDefault?: boolean;
}

// Validation helpers
export function isValidIfscCode(code: string | null | undefined): boolean {
  if (!code) return true; // Optional field
  // IFSC format: 4 letters + 0 + 6 alphanumeric
  return /^[A-Z]{4}0[A-Z0-9]{6}$/.test(code.toUpperCase());
}

export function isValidUpiId(upiId: string | null | undefined): boolean {
  if (!upiId) return true; // Optional field
  // UPI VPA format: user@provider (basic validation)
  return /^[\w.-]+@[\w]+$/.test(upiId);
}

/**
 * Format bank account display with masking
 * Shows last 4 digits only for security
 */
export function formatAccountNumber(
  accountNumber: string | null | undefined
): string {
  if (!accountNumber) return '-';
  if (accountNumber.length <= 4) return accountNumber;
  return '****' + accountNumber.slice(-4);
}

/**
 * Get payment method display text for invoice
 */
export function getPaymentMethodDisplay(method: PaymentMethod): string {
  if (
    method.type === 'BANK_TRANSFER' &&
    method.bankName &&
    method.accountNumber
  ) {
    return `${method.name} - ${method.bankName} (${formatAccountNumber(method.accountNumber)})`;
  }
  if (method.type === 'UPI' && method.upiId) {
    return `${method.name} - ${method.upiId}`;
  }
  return method.name;
}

// Standard payment methods for seeding
export const STANDARD_PAYMENT_METHODS: CreatePaymentMethodRequest[] = [
  {
    name: 'Cash',
    type: 'CASH',
    description: 'Cash payment',
  },
  {
    name: 'Bank Transfer',
    type: 'BANK_TRANSFER',
    description: 'NEFT/RTGS/IMPS bank transfer',
    isDefault: true,
  },
  {
    name: 'UPI',
    type: 'UPI',
    description: 'UPI payment',
  },
  {
    name: 'Cheque',
    type: 'CHEQUE',
    description: 'Cheque payment',
  },
  {
    name: 'Card',
    type: 'CARD',
    description: 'Credit/Debit card payment',
  },
];

