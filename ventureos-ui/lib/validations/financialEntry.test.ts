import {
  financialEntrySchema,
  REVENUE_CATEGORIES,
  EXPENSE_CATEGORIES,
  SUBCATEGORIES,
  PAYMENT_METHODS,
} from './financialEntry';

describe('Financial Entry Validation Schema', () => {
  describe('financialEntrySchema', () => {
    const validRevenueEntry = {
      type: 'revenue' as const,
      amount: 5000,
      category: 'product_sales',
      description: 'Sold 10 units of phone cases',
      date: '2024-01-15',
    };

    const validExpenseEntry = {
      type: 'expense' as const,
      amount: 2500,
      category: 'shipping',
      description: 'Shipping cost for January orders',
      date: '2024-01-15',
    };

    it('should validate a correct revenue entry', () => {
      const result = financialEntrySchema.safeParse(validRevenueEntry);
      expect(result.success).toBe(true);
    });

    it('should validate a correct expense entry', () => {
      const result = financialEntrySchema.safeParse(validExpenseEntry);
      expect(result.success).toBe(true);
    });

    it('should validate entry with all optional fields', () => {
      const result = financialEntrySchema.safeParse({
        ...validRevenueEntry,
        subcategory: 'electronics',
        productId: 'prod-123',
        paymentMethod: 'bkash',
      });
      expect(result.success).toBe(true);
    });

    describe('type field', () => {
      it('should reject missing type', () => {
        const { type, ...noType } = validRevenueEntry;
        const result = financialEntrySchema.safeParse(noType);
        expect(result.success).toBe(false);
      });

      it('should reject invalid type', () => {
        const result = financialEntrySchema.safeParse({
          ...validRevenueEntry,
          type: 'invalid',
        });
        expect(result.success).toBe(false);
      });

      it('should accept revenue type', () => {
        const result = financialEntrySchema.safeParse(validRevenueEntry);
        expect(result.success).toBe(true);
      });

      it('should accept expense type', () => {
        const result = financialEntrySchema.safeParse(validExpenseEntry);
        expect(result.success).toBe(true);
      });
    });

    describe('amount field', () => {
      it('should reject missing amount', () => {
        const result = financialEntrySchema.safeParse({
          ...validRevenueEntry,
          amount: undefined,
        });
        expect(result.success).toBe(false);
      });

      it('should reject zero amount', () => {
        const result = financialEntrySchema.safeParse({
          ...validRevenueEntry,
          amount: 0,
        });
        expect(result.success).toBe(false);
      });

      it('should reject negative amount', () => {
        const result = financialEntrySchema.safeParse({
          ...validRevenueEntry,
          amount: -100,
        });
        expect(result.success).toBe(false);
      });

      it('should reject amount exceeding maximum (100000000)', () => {
        const result = financialEntrySchema.safeParse({
          ...validRevenueEntry,
          amount: 100000001,
        });
        expect(result.success).toBe(false);
      });

      it('should accept amount at maximum boundary', () => {
        const result = financialEntrySchema.safeParse({
          ...validRevenueEntry,
          amount: 100000000,
        });
        expect(result.success).toBe(true);
      });

      it('should accept decimal amounts', () => {
        const result = financialEntrySchema.safeParse({
          ...validRevenueEntry,
          amount: 1500.50,
        });
        expect(result.success).toBe(true);
      });

      it('should reject non-numeric amount', () => {
        const result = financialEntrySchema.safeParse({
          ...validRevenueEntry,
          amount: 'abc',
        });
        expect(result.success).toBe(false);
      });

      it('should accept small positive amount', () => {
        const result = financialEntrySchema.safeParse({
          ...validRevenueEntry,
          amount: 0.01,
        });
        expect(result.success).toBe(true);
      });
    });

    describe('category field', () => {
      it('should reject missing category', () => {
        const result = financialEntrySchema.safeParse({
          ...validRevenueEntry,
          category: undefined,
        });
        expect(result.success).toBe(false);
      });

      it('should reject empty category', () => {
        const result = financialEntrySchema.safeParse({
          ...validRevenueEntry,
          category: '',
        });
        expect(result.success).toBe(false);
      });

      it('should accept valid category string', () => {
        const result = financialEntrySchema.safeParse({
          ...validRevenueEntry,
          category: 'product_sales',
        });
        expect(result.success).toBe(true);
      });
    });

    describe('description field', () => {
      it('should reject missing description', () => {
        const result = financialEntrySchema.safeParse({
          ...validRevenueEntry,
          description: undefined,
        });
        expect(result.success).toBe(false);
      });

      it('should reject empty description', () => {
        const result = financialEntrySchema.safeParse({
          ...validRevenueEntry,
          description: '',
        });
        expect(result.success).toBe(false);
      });

      it('should reject description exceeding 500 characters', () => {
        const result = financialEntrySchema.safeParse({
          ...validRevenueEntry,
          description: 'a'.repeat(501),
        });
        expect(result.success).toBe(false);
      });

      it('should accept description at 500 characters', () => {
        const result = financialEntrySchema.safeParse({
          ...validRevenueEntry,
          description: 'a'.repeat(500),
        });
        expect(result.success).toBe(true);
      });
    });

    describe('date field', () => {
      it('should reject missing date', () => {
        const result = financialEntrySchema.safeParse({
          ...validRevenueEntry,
          date: undefined,
        });
        expect(result.success).toBe(false);
      });

      it('should reject empty date', () => {
        const result = financialEntrySchema.safeParse({
          ...validRevenueEntry,
          date: '',
        });
        expect(result.success).toBe(false);
      });

      it('should accept valid date string', () => {
        const result = financialEntrySchema.safeParse({
          ...validRevenueEntry,
          date: '2024-03-15',
        });
        expect(result.success).toBe(true);
      });
    });

    describe('optional fields', () => {
      it('should accept entry without subcategory', () => {
        const result = financialEntrySchema.safeParse(validRevenueEntry);
        expect(result.success).toBe(true);
      });

      it('should accept entry with subcategory', () => {
        const result = financialEntrySchema.safeParse({
          ...validRevenueEntry,
          subcategory: 'electronics',
        });
        expect(result.success).toBe(true);
      });

      it('should accept entry without productId', () => {
        const result = financialEntrySchema.safeParse(validRevenueEntry);
        expect(result.success).toBe(true);
      });

      it('should accept entry with productId', () => {
        const result = financialEntrySchema.safeParse({
          ...validRevenueEntry,
          productId: 'prod-456',
        });
        expect(result.success).toBe(true);
      });

      it('should accept entry without paymentMethod', () => {
        const result = financialEntrySchema.safeParse(validRevenueEntry);
        expect(result.success).toBe(true);
      });

      it('should accept entry with paymentMethod', () => {
        const result = financialEntrySchema.safeParse({
          ...validRevenueEntry,
          paymentMethod: 'bkash',
        });
        expect(result.success).toBe(true);
      });
    });
  });

  describe('Constants', () => {
    it('should have 8 revenue categories', () => {
      expect(REVENUE_CATEGORIES).toHaveLength(8);
    });

    it('should include key revenue categories', () => {
      expect(REVENUE_CATEGORIES).toContain('product_sales');
      expect(REVENUE_CATEGORIES).toContain('service_income');
      expect(REVENUE_CATEGORIES).toContain('wholesale');
      expect(REVENUE_CATEGORIES).toContain('online_sales');
    });

    it('should have 11 expense categories', () => {
      expect(EXPENSE_CATEGORIES).toHaveLength(11);
    });

    it('should include key expense categories', () => {
      expect(EXPENSE_CATEGORIES).toContain('product_cost');
      expect(EXPENSE_CATEGORIES).toContain('shipping');
      expect(EXPENSE_CATEGORIES).toContain('customs_duty');
      expect(EXPENSE_CATEGORIES).toContain('marketing');
      expect(EXPENSE_CATEGORIES).toContain('salary');
    });

    it('should have 7 payment methods', () => {
      expect(PAYMENT_METHODS).toHaveLength(7);
    });

    it('should include key payment methods', () => {
      expect(PAYMENT_METHODS).toContain('cash');
      expect(PAYMENT_METHODS).toContain('bkash');
      expect(PAYMENT_METHODS).toContain('nagad');
      expect(PAYMENT_METHODS).toContain('bank_transfer');
    });

    it('should have subcategories for revenue categories', () => {
      expect(SUBCATEGORIES['product_sales']).toBeDefined();
      expect(SUBCATEGORIES['product_sales'].length).toBeGreaterThan(0);
    });

    it('should have subcategories for expense categories', () => {
      expect(SUBCATEGORIES['shipping']).toBeDefined();
      expect(SUBCATEGORIES['shipping'].length).toBeGreaterThan(0);
    });
  });
});
