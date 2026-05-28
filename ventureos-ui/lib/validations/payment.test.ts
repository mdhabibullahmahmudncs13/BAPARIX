import {
  paymentFormSchema,
  PAYMENT_METHODS,
  MOBILE_PAYMENT_METHODS,
  SUBSCRIPTION_TIERS,
  isMobilePaymentMethod,
} from './payment';

describe('Payment Validation Schema', () => {
  describe('paymentFormSchema', () => {
    const validMobileData = {
      paymentMethod: 'bkash',
      phoneNumber: '01712345678',
      tierId: 'pro',
    };

    const validGatewayData = {
      paymentMethod: 'sslcommerz',
      phoneNumber: '',
      tierId: 'enterprise',
    };

    it('should validate correct mobile payment data', () => {
      const result = paymentFormSchema.safeParse(validMobileData);
      expect(result.success).toBe(true);
    });

    it('should validate correct gateway payment data (no phone required)', () => {
      const result = paymentFormSchema.safeParse(validGatewayData);
      expect(result.success).toBe(true);
    });

    it('should accept bkash with valid phone number', () => {
      const result = paymentFormSchema.safeParse({
        paymentMethod: 'bkash',
        phoneNumber: '01812345678',
        tierId: 'pro',
      });
      expect(result.success).toBe(true);
    });

    it('should accept nagad with valid phone number', () => {
      const result = paymentFormSchema.safeParse({
        paymentMethod: 'nagad',
        phoneNumber: '01912345678',
        tierId: 'pro',
      });
      expect(result.success).toBe(true);
    });

    it('should accept rocket with valid phone number', () => {
      const result = paymentFormSchema.safeParse({
        paymentMethod: 'rocket',
        phoneNumber: '01612345678',
        tierId: 'enterprise',
      });
      expect(result.success).toBe(true);
    });

    it('should reject mobile payment without phone number', () => {
      const result = paymentFormSchema.safeParse({
        paymentMethod: 'bkash',
        phoneNumber: '',
        tierId: 'pro',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const phoneError = result.error.issues.find((i) => i.path.includes('phoneNumber'));
        expect(phoneError).toBeDefined();
      }
    });

    it('should reject mobile payment with invalid phone number', () => {
      const result = paymentFormSchema.safeParse({
        paymentMethod: 'nagad',
        phoneNumber: '12345',
        tierId: 'pro',
      });
      expect(result.success).toBe(false);
    });

    it('should reject mobile payment with non-BD phone number', () => {
      const result = paymentFormSchema.safeParse({
        paymentMethod: 'rocket',
        phoneNumber: '+14155551234',
        tierId: 'pro',
      });
      expect(result.success).toBe(false);
    });

    it('should accept phone with +880 prefix', () => {
      const result = paymentFormSchema.safeParse({
        paymentMethod: 'bkash',
        phoneNumber: '+8801712345678',
        tierId: 'pro',
      });
      expect(result.success).toBe(true);
    });

    it('should accept phone with 880 prefix', () => {
      const result = paymentFormSchema.safeParse({
        paymentMethod: 'bkash',
        phoneNumber: '8801712345678',
        tierId: 'pro',
      });
      expect(result.success).toBe(true);
    });

    it('should not require phone for sslcommerz', () => {
      const result = paymentFormSchema.safeParse({
        paymentMethod: 'sslcommerz',
        phoneNumber: undefined,
        tierId: 'pro',
      });
      expect(result.success).toBe(true);
    });

    it('should reject missing payment method', () => {
      const result = paymentFormSchema.safeParse({
        paymentMethod: undefined,
        phoneNumber: '01712345678',
        tierId: 'pro',
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid payment method', () => {
      const result = paymentFormSchema.safeParse({
        paymentMethod: 'paypal',
        phoneNumber: '01712345678',
        tierId: 'pro',
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid tier ID', () => {
      const result = paymentFormSchema.safeParse({
        paymentMethod: 'bkash',
        phoneNumber: '01712345678',
        tierId: 'free',
      });
      expect(result.success).toBe(false);
    });

    it('should reject missing tier ID', () => {
      const result = paymentFormSchema.safeParse({
        paymentMethod: 'bkash',
        phoneNumber: '01712345678',
        tierId: undefined,
      });
      expect(result.success).toBe(false);
    });

    it('should accept pro tier', () => {
      const result = paymentFormSchema.safeParse({
        paymentMethod: 'sslcommerz',
        tierId: 'pro',
      });
      expect(result.success).toBe(true);
    });

    it('should accept enterprise tier', () => {
      const result = paymentFormSchema.safeParse({
        paymentMethod: 'sslcommerz',
        tierId: 'enterprise',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('isMobilePaymentMethod', () => {
    it('should return true for bkash', () => {
      expect(isMobilePaymentMethod('bkash')).toBe(true);
    });

    it('should return true for nagad', () => {
      expect(isMobilePaymentMethod('nagad')).toBe(true);
    });

    it('should return true for rocket', () => {
      expect(isMobilePaymentMethod('rocket')).toBe(true);
    });

    it('should return false for sslcommerz', () => {
      expect(isMobilePaymentMethod('sslcommerz')).toBe(false);
    });

    it('should return false for unknown method', () => {
      expect(isMobilePaymentMethod('paypal')).toBe(false);
    });
  });

  describe('Constants', () => {
    it('should have 4 payment methods', () => {
      expect(PAYMENT_METHODS).toHaveLength(4);
    });

    it('should include all expected payment methods', () => {
      expect(PAYMENT_METHODS).toContain('bkash');
      expect(PAYMENT_METHODS).toContain('nagad');
      expect(PAYMENT_METHODS).toContain('rocket');
      expect(PAYMENT_METHODS).toContain('sslcommerz');
    });

    it('should have 3 mobile payment methods', () => {
      expect(MOBILE_PAYMENT_METHODS).toHaveLength(3);
    });

    it('should have correct subscription tier prices', () => {
      expect(SUBSCRIPTION_TIERS.pro.price).toBe(999);
      expect(SUBSCRIPTION_TIERS.enterprise.price).toBe(3499);
    });
  });
});
