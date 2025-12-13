import { z } from 'zod';

// PAN validation schema
export const panSchema = z
  .string()
  .regex(
    /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
    'PAN must be 10 characters (e.g., ABCDE1234F)'
  )
  .optional()
  .or(z.literal(''));

// GSTIN validation schema
export const gstinSchema = z
  .string()
  .regex(
    /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
    'GSTIN must be 15 characters (e.g., 01ABCDE1234F1Z0)'
  )
  .optional()
  .or(z.literal(''));
