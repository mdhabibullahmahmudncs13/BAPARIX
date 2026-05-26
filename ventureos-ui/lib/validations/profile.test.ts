import {
  profileUpdateSchema,
  businessInfoSchema,
  preferencesSchema,
  businessTypeSchema,
  languageSchema,
  currencySchema,
} from './profile';

describe('Profile Validation Schemas', () => {
  describe('businessTypeSchema', () => {
    it('should accept valid business types', () => {
      expect(businessTypeSchema.parse('reseller')).toBe('reseller');
      expect(businessTypeSchema.parse('importer')).toBe('importer');
      expect(businessTypeSchema.parse('sme')).toBe('sme');
      expect(businessTypeSchema.parse('manufacturer')).toBe('manufacturer');
    });

    it('should reject invalid business types', () => {
      expect(() => businessTypeSchema.parse('invalid')).toThrow();
      expect(() => businessTypeSchema.parse('')).toThrow();
    });
  });

  describe('languageSchema', () => {
    it('should accept valid languages', () => {
      expect(languageSchema.parse('bn')).toBe('bn');
      expect(languageSchema.parse('en')).toBe('en');
    });

    it('should reject invalid languages', () => {
      expect(() => languageSchema.parse('fr')).toThrow();
      expect(() => languageSchema.parse('')).toThrow();
    });
  });

  describe('currencySchema', () => {
    it('should accept valid currencies', () => {
      expect(currencySchema.parse('BDT')).toBe('BDT');
      expect(currencySchema.parse('USD')).toBe('USD');
      expect(currencySchema.parse('CNY')).toBe('CNY');
    });

    it('should reject invalid currencies', () => {
      expect(() => currencySchema.parse('EUR')).toThrow();
      expect(() => currencySchema.parse('')).toThrow();
    });
  });

  describe('businessInfoSchema', () => {
    it('should accept valid business information', () => {
      const validData = {
        name: 'My Business',
        type: 'reseller' as const,
        location: 'Dhaka',
        teamSize: 5,
        warehouseCapacity: 1000,
      };

      const result = businessInfoSchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it('should accept business info without optional warehouse capacity', () => {
      const validData = {
        name: 'My Business',
        type: 'importer' as const,
        location: 'Chittagong',
        teamSize: 3,
      };

      const result = businessInfoSchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it('should reject business name that is too short', () => {
      const invalidData = {
        name: 'A',
        type: 'reseller' as const,
        location: 'Dhaka',
        teamSize: 1,
      };

      expect(() => businessInfoSchema.parse(invalidData)).toThrow();
    });

    it('should reject team size less than 1', () => {
      const invalidData = {
        name: 'My Business',
        type: 'reseller' as const,
        location: 'Dhaka',
        teamSize: 0,
      };

      expect(() => businessInfoSchema.parse(invalidData)).toThrow();
    });

    it('should reject non-integer team size', () => {
      const invalidData = {
        name: 'My Business',
        type: 'reseller' as const,
        location: 'Dhaka',
        teamSize: 2.5,
      };

      expect(() => businessInfoSchema.parse(invalidData)).toThrow();
    });
  });

  describe('preferencesSchema', () => {
    it('should accept valid preferences', () => {
      const validData = {
        locale: 'bn' as const,
        currency: 'BDT' as const,
      };

      const result = preferencesSchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it('should reject invalid locale', () => {
      const invalidData = {
        locale: 'fr',
        currency: 'BDT',
      };

      expect(() => preferencesSchema.parse(invalidData)).toThrow();
    });

    it('should reject invalid currency', () => {
      const invalidData = {
        locale: 'en',
        currency: 'EUR',
      };

      expect(() => preferencesSchema.parse(invalidData)).toThrow();
    });
  });

  describe('profileUpdateSchema', () => {
    it('should accept valid profile update data', () => {
      const validData = {
        name: 'John Doe',
        phone: '+8801712345678',
        businessInfo: {
          name: 'My Business',
          type: 'reseller' as const,
          location: 'Dhaka',
          teamSize: 5,
          warehouseCapacity: 1000,
        },
        preferences: {
          locale: 'en' as const,
          currency: 'BDT' as const,
        },
      };

      const result = profileUpdateSchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it('should accept profile without phone number', () => {
      const validData = {
        name: 'John Doe',
        phone: '',
        businessInfo: {
          name: 'My Business',
          type: 'importer' as const,
          location: 'Chittagong',
          teamSize: 3,
        },
        preferences: {
          locale: 'bn' as const,
          currency: 'USD' as const,
        },
      };

      const result = profileUpdateSchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it('should accept valid Bangladesh phone numbers', () => {
      const phoneNumbers = [
        '+8801712345678',
        '8801712345678',
        '01712345678',
        '+8801812345678',
        '+8801912345678',
      ];

      phoneNumbers.forEach((phone) => {
        const data = {
          name: 'John Doe',
          phone,
          businessInfo: {
            name: 'My Business',
            type: 'reseller' as const,
            location: 'Dhaka',
            teamSize: 1,
          },
          preferences: {
            locale: 'en' as const,
            currency: 'BDT' as const,
          },
        };

        expect(() => profileUpdateSchema.parse(data)).not.toThrow();
      });
    });

    it('should reject invalid Bangladesh phone numbers', () => {
      const invalidPhones = [
        '123456789',
        '+1234567890',
        '01012345678', // Invalid operator code
        '+88012345678', // Too short
      ];

      invalidPhones.forEach((phone) => {
        const data = {
          name: 'John Doe',
          phone,
          businessInfo: {
            name: 'My Business',
            type: 'reseller' as const,
            location: 'Dhaka',
            teamSize: 1,
          },
          preferences: {
            locale: 'en' as const,
            currency: 'BDT' as const,
          },
        };

        expect(() => profileUpdateSchema.parse(data)).toThrow();
      });
    });

    it('should reject name that is too short', () => {
      const invalidData = {
        name: 'J',
        phone: '+8801712345678',
        businessInfo: {
          name: 'My Business',
          type: 'reseller' as const,
          location: 'Dhaka',
          teamSize: 1,
        },
        preferences: {
          locale: 'en' as const,
          currency: 'BDT' as const,
        },
      };

      expect(() => profileUpdateSchema.parse(invalidData)).toThrow();
    });

    it('should reject missing required fields', () => {
      const invalidData = {
        name: 'John Doe',
        businessInfo: {
          name: 'My Business',
          type: 'reseller' as const,
          // Missing location
          teamSize: 1,
        },
        preferences: {
          locale: 'en' as const,
          currency: 'BDT' as const,
        },
      };

      expect(() => profileUpdateSchema.parse(invalidData)).toThrow();
    });
  });
});
