import { z } from 'zod';
import { UNITS } from '@shared/item';

export const itemFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters'),
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional()
    .or(z.literal('')),
  hsnCode: z
    .string()
    .regex(/^(\d{4,8})?$/, 'HSN/SAC code must be 4-8 digits')
    .optional()
    .or(z.literal('')),
  rate: z.number().min(0, 'Rate must be at least 0'),
  unit: z.string().min(1, 'Unit is required'),
  taxTemplateId: z.number().nullable().optional(),
  cessTemplateId: z.number().nullable().optional(),
});

export type ItemFormValues = z.infer<typeof itemFormSchema>;

export const UNIT_OPTIONS = UNITS.map((u) => ({
  value: u.code,
  label: u.label,
  description: u.description,
}));

// Default form values
export const defaultItemFormValues: ItemFormValues = {
  name: '',
  description: '',
  hsnCode: '',
  rate: 0,
  unit: 'NOS',
  taxTemplateId: null,
  cessTemplateId: null,
};
