import { discountTemplatesTable } from '@db/schema/discount-templates';
import { InferSelectModel } from 'drizzle-orm';

// Database model type
export type DiscountTemplate = InferSelectModel<typeof discountTemplatesTable>;

// Discount type enum
export type DiscountType = 'PERCENT' | 'AMOUNT';

// Request types for CRUD operations
export interface CreateDiscountTemplateRequest {
  name: string;
  type: DiscountType;
  value: number;
  description?: string;
  isDefault?: boolean;
}

export interface UpdateDiscountTemplateRequest {
  id: number;
  name: string;
  type: DiscountType;
  value: number;
  description?: string;
  isDefault?: boolean;
}

// Discount input for calculations
export interface DiscountInput {
  type: DiscountType | null;
  value: number;
}

// Discount calculation result
export interface DiscountResult {
  discountAmount: number;
  amountAfterDiscount: number;
}

/**
 * Round to 2 decimal places
 */
export function roundToTwo(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

/**
 * Calculate discount amount
 * @param amount - Base amount to apply discount on
 * @param discount - Discount type and value
 * @returns Discount amount and final amount after discount
 */
export function calculateDiscount(
  amount: number,
  discount: DiscountInput
): DiscountResult {
  if (!discount.type || discount.value <= 0) {
    return { discountAmount: 0, amountAfterDiscount: amount };
  }

  let discountAmount: number;

  if (discount.type === 'PERCENT') {
    // Validate percentage (0-100)
    const validPercent = Math.min(Math.max(discount.value, 0), 100);
    discountAmount = (amount * validPercent) / 100;
  } else {
    // Fixed amount cannot exceed the total
    discountAmount = Math.min(discount.value, amount);
  }

  const roundedDiscount = roundToTwo(discountAmount);
  const amountAfterDiscount = roundToTwo(amount - roundedDiscount);

  return {
    discountAmount: roundedDiscount,
    amountAfterDiscount: Math.max(0, amountAfterDiscount),
  };
}

/**
 * Format discount for display
 * @param type - Discount type
 * @param value - Discount value
 * @returns Formatted string (e.g., "10%" or "₹500")
 */
export function formatDiscount(type: DiscountType, value: number): string {
  if (type === 'PERCENT') {
    return `${value}%`;
  }
  return `₹${value.toLocaleString('en-IN')}`;
}

// Standard discount templates for seeding
export const STANDARD_DISCOUNT_TEMPLATES: CreateDiscountTemplateRequest[] = [
  // Percentage discounts
  {
    name: '5% Off',
    type: 'PERCENT',
    value: 5,
    description: '5% discount',
  },
  {
    name: '10% Off',
    type: 'PERCENT',
    value: 10,
    description: '10% discount',
    isDefault: true,
  },
  {
    name: '15% Off',
    type: 'PERCENT',
    value: 15,
    description: '15% discount',
  },
  {
    name: '20% Off',
    type: 'PERCENT',
    value: 20,
    description: '20% discount',
  },
  {
    name: '25% Off',
    type: 'PERCENT',
    value: 25,
    description: '25% discount',
  },
  {
    name: '50% Off',
    type: 'PERCENT',
    value: 50,
    description: '50% discount - Half price',
  },

  // Fixed amount discounts
  {
    name: '₹100 Off',
    type: 'AMOUNT',
    value: 100,
    description: 'Flat ₹100 discount',
  },
  {
    name: '₹500 Off',
    type: 'AMOUNT',
    value: 500,
    description: 'Flat ₹500 discount',
  },
  {
    name: '₹1,000 Off',
    type: 'AMOUNT',
    value: 1000,
    description: 'Flat ₹1,000 discount',
  },
];
