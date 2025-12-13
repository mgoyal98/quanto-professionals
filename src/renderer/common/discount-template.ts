import { z } from 'zod';

export const DISCOUNT_TYPES = ['PERCENT', 'AMOUNT'] as const;

export const discountTemplateFormSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Name is required')
      .max(50, 'Name must be less than 50 characters'),
    type: z.enum(DISCOUNT_TYPES),
    value: z.number().min(0, 'Value must be at least 0'),
    description: z
      .string()
      .max(200, 'Description must be less than 200 characters')
      .optional()
      .or(z.literal('')),
    isDefault: z.boolean(),
  })
  .refine(
    (data) => {
      if (data.type === 'PERCENT') {
        return data.value <= 100;
      }
      return true;
    },
    {
      message: 'Percentage cannot exceed 100%',
      path: ['value'],
    }
  );

export type DiscountTemplateFormValues = z.infer<
  typeof discountTemplateFormSchema
>;

export const DISCOUNT_TYPE_LABELS: Record<
  (typeof DISCOUNT_TYPES)[number],
  string
> = {
  PERCENT: 'Percentage',
  AMOUNT: 'Fixed Amount',
};

export const DISCOUNT_TYPE_SUFFIX: Record<
  (typeof DISCOUNT_TYPES)[number],
  string
> = {
  PERCENT: '%',
  AMOUNT: '₹',
};

