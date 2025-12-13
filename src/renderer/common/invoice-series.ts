import { z } from 'zod';

export const invoiceSeriesFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(50, 'Name must be less than 50 characters'),
  prefix: z
    .string()
    .max(20, 'Prefix must be less than 20 characters')
    .optional()
    .or(z.literal('')),
  suffix: z
    .string()
    .max(20, 'Suffix must be less than 20 characters')
    .optional()
    .or(z.literal('')),
  startWith: z.number().min(1, 'Start number must be at least 1').default(1),
  isDefault: z.boolean().default(false),
});

export type InvoiceSeriesFormValues = z.infer<typeof invoiceSeriesFormSchema>;

