import { z } from 'zod';
import { panSchema, gstinSchema } from './validation';

export const companyFormSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  profession: z.string().optional().or(z.literal('')),
  pan: panSchema,
  gstin: gstinSchema,
  addressLine1: z
    .string()
    .max(100, 'Address line 1 must be less than 100 characters')
    .optional()
    .or(z.literal('')),
  addressLine2: z
    .string()
    .max(100, 'Address line 2 must be less than 100 characters')
    .optional()
    .or(z.literal('')),
  city: z.string().min(3, 'City must be at least 3 characters').max(40, 'City must be less than 40 characters'),
  stateCode: z.string().min(2, 'State code is required'),
  pinCode: z.string().length(6, 'PIN code must be 6 digits').regex(/^[0-9]{6}$/, 'Invalid pincode'),
  phone: z
    .string()
    .optional()
    .or(z.literal('')),
  email: z.email('Invalid email address').optional().or(z.literal('')),
});

export type CompanyFormValues = z.infer<typeof companyFormSchema>;
