import { z } from 'zod';
import {
  PAYMENT_METHOD_TYPES,
  PaymentMethodType,
} from '@shared/payment-method';

export const paymentMethodFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(50, 'Name must be less than 50 characters'),
  type: z.enum(PAYMENT_METHOD_TYPES),
  description: z
    .string()
    .max(200, 'Description must be less than 200 characters')
    .optional()
    .or(z.literal('')),
  instructions: z
    .string()
    .max(500, 'Instructions must be less than 500 characters')
    .optional()
    .or(z.literal('')),
  bankName: z
    .string()
    .max(100, 'Bank name must be less than 100 characters')
    .optional()
    .or(z.literal('')),
  accountNumber: z
    .string()
    .max(30, 'Account number must be less than 30 characters')
    .optional()
    .or(z.literal('')),
  ifscCode: z
    .string()
    .optional()
    .or(z.literal(''))
    .refine(
      (val) => !val || /^[A-Z]{4}0[A-Z0-9]{6}$/.test(val.toUpperCase()),
      'Invalid IFSC code format'
    ),
  accountHolder: z
    .string()
    .max(100, 'Account holder name must be less than 100 characters')
    .optional()
    .or(z.literal('')),
  branchName: z
    .string()
    .max(100, 'Branch name must be less than 100 characters')
    .optional()
    .or(z.literal('')),
  upiId: z
    .string()
    .optional()
    .or(z.literal(''))
    .refine(
      (val) => !val || /^[\w.-]+@[\w]+$/.test(val),
      'Invalid UPI ID format (e.g., user@bank)'
    ),
  isDefault: z.boolean(),
});

export type PaymentMethodFormValues = z.infer<typeof paymentMethodFormSchema>;

// Default form values
export const defaultPaymentMethodFormValues: PaymentMethodFormValues = {
  name: '',
  type: 'BANK_TRANSFER',
  description: '',
  instructions: '',
  bankName: '',
  accountNumber: '',
  ifscCode: '',
  accountHolder: '',
  branchName: '',
  upiId: '',
  isDefault: false,
};

// Fields to show based on type
export function getFieldsForType(type: PaymentMethodType): string[] {
  const commonFields = [
    'name',
    'type',
    'description',
    'instructions',
    'isDefault',
  ];

  switch (type) {
    case 'BANK_TRANSFER':
    case 'CHEQUE':
      return [
        ...commonFields,
        'bankName',
        'accountNumber',
        'ifscCode',
        'accountHolder',
        'branchName',
      ];
    case 'UPI':
      return [...commonFields, 'upiId'];
    case 'CASH':
    case 'CARD':
    case 'ONLINE':
    case 'OTHER':
    default:
      return commonFields;
  }
}

