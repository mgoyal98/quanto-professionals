import { itemsTable } from '@db/schema/items';
import { InferSelectModel } from 'drizzle-orm';
import { TaxTemplate } from './tax-template';

// Database model type
export type Item = InferSelectModel<typeof itemsTable>;

// Item with related tax templates (for display)
export interface ItemWithTaxTemplates extends Item {
  taxTemplate?: TaxTemplate | null;
  cessTemplate?: TaxTemplate | null;
}

// Request types for CRUD operations
export interface CreateItemRequest {
  name: string;
  description?: string;
  hsnCode?: string;
  rate: number;
  unit: string;
  taxTemplateId?: number | null;
  cessTemplateId?: number | null;
}

export interface UpdateItemRequest {
  id: number;
  name: string;
  description?: string;
  hsnCode?: string;
  rate: number;
  unit: string;
  taxTemplateId?: number | null;
  cessTemplateId?: number | null;
}

// Search/filter parameters
export interface ItemListParams {
  search?: string;
  isActive?: boolean;
  taxTemplateId?: number;
  limit?: number;
  offset?: number;
}

// Paginated response
export interface ItemListResponse {
  items: ItemWithTaxTemplates[];
  total: number;
  limit: number;
  offset: number;
}

// Standard units of measurement
export const UNITS = [
  { code: 'NOS', label: 'Numbers/Pieces', description: 'Individual items' },
  { code: 'KG', label: 'Kilograms', description: 'Weight-based goods' },
  { code: 'GM', label: 'Grams', description: 'Weight-based goods' },
  { code: 'LTR', label: 'Liters', description: 'Volume-based goods' },
  { code: 'ML', label: 'Milliliters', description: 'Volume-based goods' },
  { code: 'MTR', label: 'Meters', description: 'Length-based goods' },
  { code: 'CM', label: 'Centimeters', description: 'Length-based goods' },
  { code: 'SQM', label: 'Square Meters', description: 'Area-based goods' },
  { code: 'SQF', label: 'Square Feet', description: 'Area-based goods' },
  { code: 'HRS', label: 'Hours', description: 'Time-based services' },
  { code: 'DAY', label: 'Days', description: 'Duration-based services' },
  { code: 'SET', label: 'Set', description: 'Bundled items' },
  { code: 'BOX', label: 'Box', description: 'Packaged goods' },
  { code: 'PKT', label: 'Packet', description: 'Packaged goods' },
  { code: 'PCS', label: 'Pieces', description: 'Individual items' },
  { code: 'DOZ', label: 'Dozen', description: '12 units' },
] as const;

export type UnitCode = (typeof UNITS)[number]['code'];

// Unit lookup helper
export function getUnitLabel(code: string): string {
  const unit = UNITS.find((u) => u.code === code);
  return unit?.label ?? code;
}

// HSN/SAC validation
export function isValidHsnCode(code: string | null | undefined): boolean {
  if (!code) return true; // Optional field
  const cleaned = code.replace(/\s/g, '');
  return /^\d{4,8}$/.test(cleaned);
}

// Format rate for display
export function formatRate(rate: number): string {
  return `₹${rate.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

