import { z } from 'zod';

export const invoiceItemSchema = z.object({
  itemId: z.number().nullable().optional(),
  name: z.string().min(1, 'Item name is required'),
  description: z.string().optional().or(z.literal('')),
  hsnCode: z.string().optional().or(z.literal('')),
  quantity: z.number().min(0.001, 'Quantity must be positive'),
  unit: z.string().min(1, 'Unit is required'),
  rate: z.number().min(0, 'Rate must be non-negative'),
  // Tax: either from template or custom rate
  taxTemplateId: z.number().nullable().optional(),
  customTaxRate: z.number().min(0).max(100).nullable().optional(),
  // Cess: either from template or custom rate
  cessTemplateId: z.number().nullable().optional(),
  customCessRate: z.number().min(0).max(100).nullable().optional(),
  // Discount
  discountType: z.enum(['PERCENT', 'AMOUNT']).nullable().optional(),
  discountValue: z.number().min(0).optional(),
});

export const invoiceFormSchema = z.object({
  invoiceSeriesId: z.number().min(1, 'Invoice series is required'),
  customerId: z.number().min(1, 'Customer is required'),
  invoiceDate: z.date(),
  items: z.array(invoiceItemSchema).min(1, 'At least one item is required'),
  discountType: z.enum(['PERCENT', 'AMOUNT']).nullable().optional(),
  discountValue: z.number().min(0).optional(),
  discountAfterTax: z.boolean().optional(),
  paymentMethodId: z.number().nullable().optional(),
  notes: z.string().optional().or(z.literal('')),
});

export type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;
export type InvoiceItemFormValues = z.infer<typeof invoiceItemSchema>;

export const defaultInvoiceFormValues: Partial<InvoiceFormValues> = {
  invoiceDate: new Date(),
  items: [],
  discountAfterTax: false,
};

export const defaultInvoiceItemValues: InvoiceItemFormValues = {
  name: '',
  description: '',
  hsnCode: '',
  quantity: 1,
  unit: 'NOS',
  rate: 0,
  taxTemplateId: null,
  customTaxRate: null,
  cessTemplateId: null,
  customCessRate: null,
  discountType: null,
  discountValue: 0,
};
