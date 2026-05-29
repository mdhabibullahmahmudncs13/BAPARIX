import { shippingFormSchema, dimensionsSchema, BANGLADESH_CITIES, PRODUCT_CATEGORIES } from './shipping';

describe('Shipping Validation Schema', () => {
  describe('shippingFormSchema', () => {
    const validData = {
      weight: 5.5,
      dimensions: { length: 30, width: 20, height: 15 },
      destination: 'Dhaka',
      productCategory: 'electronics',
    };

    it('should validate correct shipping form data', () => {
      const result = shippingFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject missing weight', () => {
      const result = shippingFormSchema.safeParse({
        ...validData,
        weight: undefined,
      });
      expect(result.success).toBe(false);
    });

    it('should reject zero weight', () => {
      const result = shippingFormSchema.safeParse({
        ...validData,
        weight: 0,
      });
      expect(result.success).toBe(false);
    });

    it('should reject negative weight', () => {
      const result = shippingFormSchema.safeParse({
        ...validData,
        weight: -1,
      });
      expect(result.success).toBe(false);
    });

    it('should reject weight exceeding 10000 kg', () => {
      const result = shippingFormSchema.safeParse({
        ...validData,
        weight: 10001,
      });
      expect(result.success).toBe(false);
    });

    it('should accept weight at maximum boundary (10000 kg)', () => {
      const result = shippingFormSchema.safeParse({
        ...validData,
        weight: 10000,
      });
      expect(result.success).toBe(true);
    });

    it('should reject empty destination', () => {
      const result = shippingFormSchema.safeParse({
        ...validData,
        destination: '',
      });
      expect(result.success).toBe(false);
    });

    it('should reject empty product category', () => {
      const result = shippingFormSchema.safeParse({
        ...validData,
        productCategory: '',
      });
      expect(result.success).toBe(false);
    });

    it('should accept decimal weight values', () => {
      const result = shippingFormSchema.safeParse({
        ...validData,
        weight: 0.5,
      });
      expect(result.success).toBe(true);
    });

    it('should reject non-numeric weight (string)', () => {
      const result = shippingFormSchema.safeParse({
        ...validData,
        weight: 'abc',
      });
      expect(result.success).toBe(false);
    });

    it('should accept weight at minimum boundary (just above 0)', () => {
      const result = shippingFormSchema.safeParse({
        ...validData,
        weight: 0.001,
      });
      expect(result.success).toBe(true);
    });

    it('should reject null weight', () => {
      const result = shippingFormSchema.safeParse({
        ...validData,
        weight: null,
      });
      expect(result.success).toBe(false);
    });

    it('should validate complete form data with all valid fields', () => {
      const result = shippingFormSchema.safeParse({
        weight: 25.5,
        dimensions: { length: 100, width: 50, height: 30 },
        destination: 'Chittagong',
        productCategory: 'fashion',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.weight).toBe(25.5);
        expect(result.data.dimensions.length).toBe(100);
        expect(result.data.destination).toBe('Chittagong');
        expect(result.data.productCategory).toBe('fashion');
      }
    });
  });

  describe('dimensionsSchema', () => {
    it('should validate correct dimensions', () => {
      const result = dimensionsSchema.safeParse({ length: 30, width: 20, height: 15 });
      expect(result.success).toBe(true);
    });

    it('should reject zero length', () => {
      const result = dimensionsSchema.safeParse({ length: 0, width: 20, height: 15 });
      expect(result.success).toBe(false);
    });

    it('should reject zero width', () => {
      const result = dimensionsSchema.safeParse({ length: 30, width: 0, height: 15 });
      expect(result.success).toBe(false);
    });

    it('should reject zero height', () => {
      const result = dimensionsSchema.safeParse({ length: 30, width: 20, height: 0 });
      expect(result.success).toBe(false);
    });

    it('should reject dimensions exceeding 500 cm', () => {
      const result = dimensionsSchema.safeParse({ length: 501, width: 20, height: 15 });
      expect(result.success).toBe(false);
    });

    it('should accept dimensions at maximum boundary (500 cm)', () => {
      const result = dimensionsSchema.safeParse({ length: 500, width: 500, height: 500 });
      expect(result.success).toBe(true);
    });

    it('should reject negative dimensions', () => {
      const result = dimensionsSchema.safeParse({ length: -10, width: 20, height: 15 });
      expect(result.success).toBe(false);
    });

    it('should accept decimal dimensions', () => {
      const result = dimensionsSchema.safeParse({ length: 10.5, width: 20.3, height: 15.7 });
      expect(result.success).toBe(true);
    });

    it('should reject non-numeric dimension values', () => {
      const result = dimensionsSchema.safeParse({ length: 'abc', width: 20, height: 15 });
      expect(result.success).toBe(false);
    });

    it('should reject missing dimension fields', () => {
      const result = dimensionsSchema.safeParse({ length: 30, width: 20 });
      expect(result.success).toBe(false);
    });

    it('should reject null dimension values', () => {
      const result = dimensionsSchema.safeParse({ length: null, width: 20, height: 15 });
      expect(result.success).toBe(false);
    });

    it('should accept dimensions at minimum boundary (just above 0)', () => {
      const result = dimensionsSchema.safeParse({ length: 0.01, width: 0.01, height: 0.01 });
      expect(result.success).toBe(true);
    });
  });

  describe('Constants', () => {
    it('should have 20 Bangladesh cities', () => {
      expect(BANGLADESH_CITIES).toHaveLength(20);
    });

    it('should include major cities', () => {
      expect(BANGLADESH_CITIES).toContain('Dhaka');
      expect(BANGLADESH_CITIES).toContain('Chittagong');
      expect(BANGLADESH_CITIES).toContain('Khulna');
      expect(BANGLADESH_CITIES).toContain('Sylhet');
    });

    it('should have 10 product categories', () => {
      expect(PRODUCT_CATEGORIES).toHaveLength(10);
    });

    it('should include key product categories', () => {
      expect(PRODUCT_CATEGORIES).toContain('electronics');
      expect(PRODUCT_CATEGORIES).toContain('fashion');
      expect(PRODUCT_CATEGORIES).toContain('chemicals');
    });
  });
});
