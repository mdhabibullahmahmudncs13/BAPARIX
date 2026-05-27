import { ProductCategory } from '@/lib/validations/shipping';

/**
 * NBR (National Board of Revenue) customs duty rates by product category.
 * These are approximate rates based on Bangladesh customs tariff schedules.
 * Rates include customs duty (CD), supplementary duty (SD), and regulatory duty (RD).
 *
 * Requirements: 7.4
 */
export const NBR_DUTY_RATES: Record<ProductCategory, { rate: number; label: string }> = {
  electronics: { rate: 0.31, label: 'Electronics & Gadgets' },
  fashion: { rate: 0.45, label: 'Fashion & Apparel' },
  home_lifestyle: { rate: 0.37, label: 'Home & Lifestyle' },
  beauty: { rate: 0.45, label: 'Beauty & Personal Care' },
  sports: { rate: 0.25, label: 'Sports & Outdoors' },
  food_beverage: { rate: 0.20, label: 'Food & Beverage' },
  machinery: { rate: 0.12, label: 'Machinery & Equipment' },
  textiles: { rate: 0.37, label: 'Textiles & Fabrics' },
  chemicals: { rate: 0.15, label: 'Chemicals' },
  other: { rate: 0.25, label: 'Other' },
};

/**
 * Default agent fee percentage applied to product cost
 */
export const DEFAULT_AGENT_FEE_RATE = 0.05;

export interface CustomsDutyInput {
  productValue: number;
  productCategory: ProductCategory;
}

export interface CustomsDutyResult {
  dutyRate: number;
  dutyAmount: number;
  categoryLabel: string;
}

export interface LandedCostInput {
  productCost: number;
  shippingCost: number;
  productCategory: ProductCategory;
  agentFeeRate?: number;
}

export interface LandedCostBreakdown {
  productCost: number;
  shippingCost: number;
  customsDuty: number;
  customsDutyRate: number;
  agentFees: number;
  agentFeeRate: number;
  totalLandedCost: number;
}

/**
 * Calculate customs duty based on product value and category using NBR rates.
 *
 * @param input - Product value and category
 * @returns Duty rate, amount, and category label
 *
 * Requirements: 7.4
 */
export function calculateCustomsDuty(input: CustomsDutyInput): CustomsDutyResult {
  const { productValue, productCategory } = input;

  if (productValue < 0) {
    return { dutyRate: 0, dutyAmount: 0, categoryLabel: '' };
  }

  const rateInfo = NBR_DUTY_RATES[productCategory] || NBR_DUTY_RATES.other;
  const dutyAmount = Math.round(productValue * rateInfo.rate * 100) / 100;

  return {
    dutyRate: rateInfo.rate,
    dutyAmount,
    categoryLabel: rateInfo.label,
  };
}

/**
 * Calculate total landed cost including product cost, shipping, customs duty, and agent fees.
 *
 * @param input - All cost components
 * @returns Full breakdown of landed cost
 *
 * Requirements: 7.5
 */
export function calculateLandedCost(input: LandedCostInput): LandedCostBreakdown {
  const { productCost, shippingCost, productCategory, agentFeeRate = DEFAULT_AGENT_FEE_RATE } = input;

  const dutyResult = calculateCustomsDuty({
    productValue: productCost,
    productCategory,
  });

  const agentFees = Math.round(productCost * agentFeeRate * 100) / 100;
  const totalLandedCost =
    Math.round((productCost + shippingCost + dutyResult.dutyAmount + agentFees) * 100) / 100;

  return {
    productCost,
    shippingCost,
    customsDuty: dutyResult.dutyAmount,
    customsDutyRate: dutyResult.dutyRate,
    agentFees,
    agentFeeRate,
    totalLandedCost,
  };
}
