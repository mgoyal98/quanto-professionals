import { z } from 'zod';

export const TAX_TYPES = ['GST', 'CESS', 'CUSTOM'] as const;
export const TAX_RATE_TYPES = ['PERCENT', 'AMOUNT'] as const;

export const TAX_RATE_TYPE_LABELS: Record<(typeof TAX_RATE_TYPES)[number], string> = {
  PERCENT: 'Percentage (%)',
  AMOUNT: 'Fixed Amount (₹)',
};

export const taxTemplateFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(50, 'Name must be less than 50 characters'),
  rate: z
    .number()
    .min(0, 'Rate must be at least 0'),
  rateType: z.enum(TAX_RATE_TYPES).default('PERCENT'),
  taxType: z.enum(TAX_TYPES),
  description: z
    .string()
    .max(200, 'Description must be less than 200 characters')
    .optional()
    .or(z.literal('')),
  isDefault: z.boolean(),
}).refine(
  (data) => {
    // For PERCENT type, rate cannot exceed 100
    if (data.rateType === 'PERCENT' && data.rate > 100) {
      return false;
    }
    return true;
  },
  {
    message: 'Percentage rate cannot exceed 100%',
    path: ['rate'],
  }
);

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
