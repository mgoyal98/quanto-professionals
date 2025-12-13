import { taxTemplatesTable } from '@db/schema/tax-templates';
import { InferSelectModel } from 'drizzle-orm';

export type TaxTemplate = InferSelectModel<typeof taxTemplatesTable>;

export type TaxType = 'GST' | 'CESS' | 'CUSTOM';

export interface CreateTaxTemplateRequest {
  name: string;
  rate: number;
  taxType?: TaxType;
  description?: string;
  isDefault?: boolean;
}

export interface UpdateTaxTemplateRequest {
  id: number;
  name: string;
  rate: number;
  taxType?: TaxType;
  description?: string;
  isDefault?: boolean;
}

// GST breakdown for display
export interface GstBreakdown {
  type: 'INTRA' | 'INTER';
  totalRate: number;
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  igstRate: number;
  igstAmount: number;
  totalTax: number;
}

// Full tax breakdown including cess and custom taxes
export interface TaxBreakdown {
  gst: GstBreakdown;
  cessRate: number;
  cessAmount: number;
  customTaxRate: number;
  customTaxAmount: number;
  totalTax: number;
}

/**
 * Round to 2 decimal places
 */
export function roundToTwo(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

/**
 * Calculate GST breakdown based on transaction type
 */
export function calculateGstBreakdown(
  taxableAmount: number,
  taxRate: number,
  gstType: 'INTRA' | 'INTER'
): GstBreakdown {
  if (gstType === 'INTRA') {
    const halfRate = taxRate / 2;
    const halfTax = (taxableAmount * halfRate) / 100;
    return {
      type: 'INTRA',
      totalRate: taxRate,
      cgstRate: halfRate,
      cgstAmount: roundToTwo(halfTax),
      sgstRate: halfRate,
      sgstAmount: roundToTwo(halfTax),
      igstRate: 0,
      igstAmount: 0,
      totalTax: roundToTwo(halfTax * 2),
    };
  } else {
    const igstAmount = (taxableAmount * taxRate) / 100;
    return {
      type: 'INTER',
      totalRate: taxRate,
      cgstRate: 0,
      cgstAmount: 0,
      sgstRate: 0,
      sgstAmount: 0,
      igstRate: taxRate,
      igstAmount: roundToTwo(igstAmount),
      totalTax: roundToTwo(igstAmount),
    };
  }
}

/**
 * Calculate cess amount (applied on taxable amount, not on GST)
 */
export function calculateCess(taxableAmount: number, cessRate: number): number {
  return roundToTwo((taxableAmount * cessRate) / 100);
}

/**
 * Determine GST type based on state codes
 */
export function determineGstType(
  companyStateCode: string,
  customerStateCode: string
): 'INTRA' | 'INTER' {
  return companyStateCode === customerStateCode ? 'INTRA' : 'INTER';
}

// Standard GST rates for seeding
export const STANDARD_TAX_TEMPLATES: CreateTaxTemplateRequest[] = [
  // GST Templates
  {
    name: 'GST Exempt',
    rate: 0,
    taxType: 'GST',
    description: 'No GST - Exempt goods & services',
  },
  {
    name: 'GST 5%',
    rate: 5,
    taxType: 'GST',
    description: 'Essential goods, packaged food, footwear < ₹1000',
  },
  {
    name: 'GST 12%',
    rate: 12,
    taxType: 'GST',
    description: 'Processed food, computers, mobiles',
  },
  {
    name: 'GST 18%',
    rate: 18,
    taxType: 'GST',
    description: 'Most services, IT, telecom, restaurants',
    isDefault: true,
  },
  {
    name: 'GST 28%',
    rate: 28,
    taxType: 'GST',
    description: 'Luxury goods, automobiles, tobacco',
  },

  // Common Cess Templates
  {
    name: 'Cess 1%',
    rate: 1,
    taxType: 'CESS',
    description: 'Compensation cess - Small cars',
  },
  {
    name: 'Cess 3%',
    rate: 3,
    taxType: 'CESS',
    description: 'Compensation cess - Electric vehicles',
  },
  {
    name: 'Cess 12%',
    rate: 12,
    taxType: 'CESS',
    description: 'Compensation cess - Aerated drinks',
  },
  {
    name: 'Cess 15%',
    rate: 15,
    taxType: 'CESS',
    description: 'Compensation cess - Mid-size cars',
  },
  {
    name: 'Cess 22%',
    rate: 22,
    taxType: 'CESS',
    description: 'Compensation cess - Large cars/SUVs',
  },
];
