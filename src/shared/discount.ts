export type DiscountType = 'PERCENT' | 'AMOUNT';

export interface DiscountInput {
  type: DiscountType | null;
  value: number;
}

export interface DiscountResult {
  discountAmount: number;
  amountAfterDiscount: number;
}

/**
 * Round to 2 decimal places
 */
function roundToTwo(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

/**
 * Calculate discount amount
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

