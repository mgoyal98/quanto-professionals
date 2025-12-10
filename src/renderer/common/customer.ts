import { z } from 'zod';

export const customerFormSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  pan: z
    .string()
    .regex(
      /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
      'PAN must be 10 characters (e.g., ABCDE1234F)'
    )
    .optional()
    .or(z.literal('')),
  gstin: z
    .string()
    .regex(
      /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
      'GSTIN must be 15 characters (e.g., 01ABCDE1234F1Z0)'
    )
    .optional()
    .or(z.literal('')),
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
  city: z
    .string()
    .min(3, 'City must be at least 3 characters')
    .max(40, 'City must be less than 40 characters'),
  stateCode: z.string().min(2, 'State code is required'),
  pinCode: z
    .string()
    .length(6, 'PIN code must be 6 digits')
    .regex(/^[0-9]{6}$/, 'Invalid pincode')
    .optional()
    .or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  email: z.email('Invalid email address').optional().or(z.literal('')),
});

export type CustomerFormValues = z.infer<typeof customerFormSchema>;
