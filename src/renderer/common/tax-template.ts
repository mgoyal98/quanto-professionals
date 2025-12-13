import { z } from 'zod';

export const TAX_TYPES = ['GST', 'CESS', 'CUSTOM'] as const;

export const taxTemplateFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(50, 'Name must be less than 50 characters'),
  rate: z
    .number()
    .min(0, 'Rate must be at least 0')
    .max(100, 'Rate cannot exceed 100%'),
  taxType: z.enum(TAX_TYPES),
  description: z
    .string()
    .max(200, 'Description must be less than 200 characters')
    .optional()
    .or(z.literal('')),
  isDefault: z.boolean(),
});

export type TaxTemplateFormValues = z.infer<typeof taxTemplateFormSchema>;

export const TAX_TYPE_LABELS: Record<(typeof TAX_TYPES)[number], string> = {
  GST: 'GST',
  CESS: 'Cess',
  CUSTOM: 'Custom',
};

export const TAX_TYPE_DESCRIPTIONS: Record<(typeof TAX_TYPES)[number], string> =
  {
    GST: 'Goods and Services Tax - Auto-splits into CGST/SGST or IGST',
    CESS: 'Compensation Cess - Applied on taxable amount',
    CUSTOM: 'Custom tax - Applied as-is without splitting',
  };
