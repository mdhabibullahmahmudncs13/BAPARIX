import {
  calculateCustomsDuty,
  calculateLandedCost,
  NBR_DUTY_RATES,
  DEFAULT_AGENT_FEE_RATE,
} from './customsDuty';

describe('calculateCustomsDuty', () => {
  it('should calculate duty for electronics at 31%', () => {
    const result = calculateCustomsDuty({
      productValue: 10000,
      productCategory: 'electronics',
    });

    expect(result.dutyRate).toBe(0.31);
    expect(result.dutyAmount).toBe(3100);
    expect(result.categoryLabel).toBe('Electronics & Gadgets');
  });

  it('should calculate duty for fashion at 45%', () => {
    const result = calculateCustomsDuty({
      productValue: 5000,
      productCategory: 'fashion',
    });

    expect(result.dutyRate).toBe(0.45);
    expect(result.dutyAmount).toBe(2250);
    expect(result.categoryLabel).toBe('Fashion & Apparel');
  });

  it('should calculate duty for machinery at 12%', () => {
    const result = calculateCustomsDuty({
      productValue: 100000,
      productCategory: 'machinery',
    });

    expect(result.dutyRate).toBe(0.12);
    expect(result.dutyAmount).toBe(12000);
    expect(result.categoryLabel).toBe('Machinery & Equipment');
  });

  it('should handle zero product value', () => {
    const result = calculateCustomsDuty({
      productValue: 0,
      productCategory: 'electronics',
    });

    expect(result.dutyAmount).toBe(0);
    expect(result.dutyRate).toBe(0.31);
  });

  it('should handle negative product value gracefully', () => {
    const result = calculateCustomsDuty({
      productValue: -100,
      productCategory: 'electronics',
    });

    expect(result.dutyRate).toBe(0);
    expect(result.dutyAmount).toBe(0);
    expect(result.categoryLabel).toBe('');
  });

  it('should round duty amount to 2 decimal places', () => {
    const result = calculateCustomsDuty({
      productValue: 333,
      productCategory: 'electronics', // 31%
    });

    // 333 * 0.31 = 103.23
    expect(result.dutyAmount).toBe(103.23);
  });

  it('should have rates defined for all product categories', () => {
    const categories = [
      'electronics', 'fashion', 'home_lifestyle', 'beauty',
      'sports', 'food_beverage', 'machinery', 'textiles',
      'chemicals', 'other',
    ] as const;

    categories.forEach((category) => {
      expect(NBR_DUTY_RATES[category]).toBeDefined();
      expect(NBR_DUTY_RATES[category].rate).toBeGreaterThan(0);
      expect(NBR_DUTY_RATES[category].label).toBeTruthy();
    });
  });
});

describe('calculateCustomsDuty - additional edge cases', () => {
  it('should handle unknown category by falling back to "other" rate', () => {
    const result = calculateCustomsDuty({
      productValue: 10000,
      productCategory: 'unknown_category' as any,
    });

    // Falls back to NBR_DUTY_RATES.other
    expect(result.dutyRate).toBe(0.25);
    expect(result.dutyAmount).toBe(2500);
    expect(result.categoryLabel).toBe('Other');
  });

  it('should handle very large product values without overflow', () => {
    const result = calculateCustomsDuty({
      productValue: 99999999,
      productCategory: 'electronics',
    });

    expect(result.dutyAmount).toBe(30999999.69);
    expect(result.dutyRate).toBe(0.31);
  });

  it('should handle very small positive product values', () => {
    const result = calculateCustomsDuty({
      productValue: 0.01,
      productCategory: 'fashion',
    });

    // 0.01 * 0.45 = 0.0045, rounded to 0.00 (2 decimal places)
    expect(result.dutyAmount).toBe(0);
    expect(result.dutyRate).toBe(0.45);
  });

  it('should return correct labels for all categories', () => {
    const expectedLabels: Record<string, string> = {
      electronics: 'Electronics & Gadgets',
      fashion: 'Fashion & Apparel',
      home_lifestyle: 'Home & Lifestyle',
      beauty: 'Beauty & Personal Care',
      sports: 'Sports & Outdoors',
      food_beverage: 'Food & Beverage',
      machinery: 'Machinery & Equipment',
      textiles: 'Textiles & Fabrics',
      chemicals: 'Chemicals',
      other: 'Other',
    };

    Object.entries(expectedLabels).forEach(([category, label]) => {
      const result = calculateCustomsDuty({
        productValue: 1000,
        productCategory: category as any,
      });
      expect(result.categoryLabel).toBe(label);
    });
  });
});

describe('calculateLandedCost', () => {
  it('should calculate total landed cost with all components', () => {
    const result = calculateLandedCost({
      productCost: 10000,
      shippingCost: 2000,
      productCategory: 'electronics',
    });

    // Product: 10000
    // Shipping: 2000
    // Duty: 10000 * 0.31 = 3100
    // Agent: 10000 * 0.05 = 500
    // Total: 15600
    expect(result.productCost).toBe(10000);
    expect(result.shippingCost).toBe(2000);
    expect(result.customsDuty).toBe(3100);
    expect(result.agentFees).toBe(500);
    expect(result.totalLandedCost).toBe(15600);
  });

  it('should use default agent fee rate of 5%', () => {
    const result = calculateLandedCost({
      productCost: 10000,
      shippingCost: 1000,
      productCategory: 'other',
    });

    expect(result.agentFeeRate).toBe(DEFAULT_AGENT_FEE_RATE);
    expect(result.agentFees).toBe(500);
  });

  it('should allow custom agent fee rate', () => {
    const result = calculateLandedCost({
      productCost: 10000,
      shippingCost: 1000,
      productCategory: 'other',
      agentFeeRate: 0.10,
    });

    expect(result.agentFeeRate).toBe(0.10);
    expect(result.agentFees).toBe(1000);
  });

  it('should include customs duty rate in breakdown', () => {
    const result = calculateLandedCost({
      productCost: 5000,
      shippingCost: 1000,
      productCategory: 'fashion',
    });

    expect(result.customsDutyRate).toBe(0.45);
  });

  it('should handle zero shipping cost', () => {
    const result = calculateLandedCost({
      productCost: 10000,
      shippingCost: 0,
      productCategory: 'electronics',
    });

    expect(result.shippingCost).toBe(0);
    expect(result.totalLandedCost).toBe(10000 + 3100 + 500);
  });

  it('should correctly sum all cost components', () => {
    const result = calculateLandedCost({
      productCost: 8000,
      shippingCost: 1500,
      productCategory: 'textiles', // 37%
      agentFeeRate: 0.07,
    });

    const expectedDuty = 8000 * 0.37; // 2960
    const expectedAgent = 8000 * 0.07; // 560
    const expectedTotal = 8000 + 1500 + expectedDuty + expectedAgent; // 13020

    expect(result.customsDuty).toBe(expectedDuty);
    expect(result.agentFees).toBe(expectedAgent);
    expect(result.totalLandedCost).toBe(expectedTotal);
  });

  it('should handle zero agent fee rate', () => {
    const result = calculateLandedCost({
      productCost: 10000,
      shippingCost: 2000,
      productCategory: 'electronics',
      agentFeeRate: 0,
    });

    expect(result.agentFees).toBe(0);
    expect(result.agentFeeRate).toBe(0);
    expect(result.totalLandedCost).toBe(10000 + 2000 + 3100); // no agent fees
  });

  it('should handle all cost components being zero except product cost', () => {
    const result = calculateLandedCost({
      productCost: 5000,
      shippingCost: 0,
      productCategory: 'machinery', // 12%
      agentFeeRate: 0,
    });

    expect(result.shippingCost).toBe(0);
    expect(result.agentFees).toBe(0);
    expect(result.customsDuty).toBe(600); // 5000 * 0.12
    expect(result.totalLandedCost).toBe(5600);
  });

  it('should return all breakdown fields in the result', () => {
    const result = calculateLandedCost({
      productCost: 10000,
      shippingCost: 2000,
      productCategory: 'electronics',
    });

    expect(result).toHaveProperty('productCost');
    expect(result).toHaveProperty('shippingCost');
    expect(result).toHaveProperty('customsDuty');
    expect(result).toHaveProperty('customsDutyRate');
    expect(result).toHaveProperty('agentFees');
    expect(result).toHaveProperty('agentFeeRate');
    expect(result).toHaveProperty('totalLandedCost');
  });
});
