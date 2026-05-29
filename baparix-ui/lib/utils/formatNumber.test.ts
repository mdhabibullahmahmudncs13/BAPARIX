import {
  toBengaliNumerals,
  toWesternNumerals,
  formatNumber,
  formatCurrency,
  formatPercentage,
  formatCompactNumber,
  parseNumber,
  parseCurrency,
} from './formatNumber';

describe('toBengaliNumerals', () => {
  it('converts Western numerals to Bengali numerals', () => {
    expect(toBengaliNumerals('0123456789')).toBe('০১২৩৪৫৬৭৮৯');
  });

  it('handles mixed content', () => {
    expect(toBengaliNumerals('Price: 1,234.56')).toBe('Price: ১,২৩৪.৫৬');
  });

  it('handles empty string', () => {
    expect(toBengaliNumerals('')).toBe('');
  });

  it('preserves non-numeric characters', () => {
    expect(toBengaliNumerals('abc123xyz')).toBe('abc১২৩xyz');
  });
});

describe('toWesternNumerals', () => {
  it('converts Bengali numerals to Western numerals', () => {
    expect(toWesternNumerals('০১২৩৪৫৬৭৮৯')).toBe('0123456789');
  });

  it('handles mixed content', () => {
    expect(toWesternNumerals('মূল্য: ১,২৩৪.৫৬')).toBe('মূল্য: 1,234.56');
  });

  it('handles empty string', () => {
    expect(toWesternNumerals('')).toBe('');
  });

  it('preserves non-numeric characters', () => {
    expect(toWesternNumerals('abc১২৩xyz')).toBe('abc123xyz');
  });
});

describe('formatNumber', () => {
  it('formats number with English locale', () => {
    const result = formatNumber(1234.56, 'en');
    expect(result).toBe('1,234.56');
  });

  it('formats number with Bengali locale and Bengali numerals', () => {
    const result = formatNumber(1234.56, 'bn');
    expect(result).toBe('১,২৩৪.৫৬');
  });

  it('formats integer without decimals', () => {
    const result = formatNumber(1000, 'en', { maximumFractionDigits: 0 });
    expect(result).toBe('1,000');
  });

  it('formats with custom decimal places', () => {
    const result = formatNumber(1234.5678, 'en', {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    });
    expect(result).toBe('1,234.568');
  });

  it('handles zero', () => {
    expect(formatNumber(0, 'en')).toBe('0');
    expect(formatNumber(0, 'bn')).toBe('০');
  });

  it('handles negative numbers', () => {
    const result = formatNumber(-1234.56, 'en');
    expect(result).toBe('-1,234.56');
  });

  it('handles large numbers', () => {
    const result = formatNumber(1234567.89, 'en');
    expect(result).toBe('1,234,567.89');
  });
});

describe('formatCurrency', () => {
  it('formats BDT currency with English locale', () => {
    const result = formatCurrency(1234.56, 'BDT', 'en');
    expect(result).toBe('৳1,234.56');
  });

  it('formats BDT currency with Bengali locale', () => {
    const result = formatCurrency(1234.56, 'BDT', 'bn');
    expect(result).toBe('৳১,২৩৪.৫৬');
  });

  it('formats USD currency', () => {
    const result = formatCurrency(1234.56, 'USD', 'en');
    expect(result).toBe('$1,234.56');
  });

  it('formats CNY currency', () => {
    const result = formatCurrency(1234.56, 'CNY', 'en');
    expect(result).toBe('¥1,234.56');
  });

  it('formats without symbol when showSymbol is false', () => {
    const result = formatCurrency(1234.56, 'BDT', 'en', false);
    expect(result).toBe('1,234.56');
  });

  it('always shows 2 decimal places', () => {
    const result = formatCurrency(1000, 'BDT', 'en');
    expect(result).toBe('৳1,000.00');
  });

  it('handles zero amount', () => {
    expect(formatCurrency(0, 'BDT', 'en')).toBe('৳0.00');
    expect(formatCurrency(0, 'BDT', 'bn')).toBe('৳০.০০');
  });

  it('handles negative amounts', () => {
    const result = formatCurrency(-500.25, 'BDT', 'en');
    expect(result).toBe('৳-500.25');
  });
});

describe('formatPercentage', () => {
  it('formats percentage with English locale', () => {
    const result = formatPercentage(0.15, 'en');
    expect(result).toBe('15%');
  });

  it('formats percentage with Bengali locale', () => {
    const result = formatPercentage(0.15, 'bn');
    expect(result).toBe('১৫%');
  });

  it('formats with decimal places', () => {
    const result = formatPercentage(0.1567, 'en', 2);
    expect(result).toBe('15.67%');
  });

  it('handles zero', () => {
    expect(formatPercentage(0, 'en')).toBe('0%');
    expect(formatPercentage(0, 'bn')).toBe('০%');
  });

  it('handles values greater than 1', () => {
    const result = formatPercentage(1.5, 'en');
    expect(result).toBe('150%');
  });

  it('handles negative percentages', () => {
    const result = formatPercentage(-0.25, 'en');
    expect(result).toBe('-25%');
  });
});

describe('formatCompactNumber', () => {
  it('formats thousands with K suffix', () => {
    const result = formatCompactNumber(1500, 'en');
    expect(result).toMatch(/1\.5K|1.5 হাজার/);
  });

  it('formats millions with M suffix', () => {
    const result = formatCompactNumber(1500000, 'en');
    expect(result).toMatch(/1\.5M|1.5 মিলিয়ন/);
  });

  it('formats small numbers without suffix', () => {
    const result = formatCompactNumber(999, 'en');
    expect(result).toBe('999');
  });

  it('formats with Bengali numerals for Bengali locale', () => {
    const result = formatCompactNumber(1500, 'bn');
    // Should contain Bengali numerals
    expect(result).toMatch(/[০-৯]/);
  });

  it('handles zero', () => {
    expect(formatCompactNumber(0, 'en')).toBe('0');
  });

  it('handles large numbers', () => {
    const result = formatCompactNumber(1234567890, 'en');
    expect(result).toMatch(/1\.2B|1.2 বিলিয়ন|1234.6M/);
  });
});

describe('parseNumber', () => {
  it('parses formatted English number', () => {
    const result = parseNumber('1,234.56');
    expect(result).toBe(1234.56);
  });

  it('parses formatted Bengali number', () => {
    const result = parseNumber('১,২৩৪.৫৬');
    expect(result).toBe(1234.56);
  });

  it('parses number without formatting', () => {
    const result = parseNumber('1234.56');
    expect(result).toBe(1234.56);
  });

  it('handles spaces in number', () => {
    const result = parseNumber('1 234.56');
    expect(result).toBe(1234.56);
  });

  it('returns 0 for invalid input', () => {
    expect(parseNumber('abc')).toBe(0);
    expect(parseNumber('')).toBe(0);
  });

  it('handles negative numbers', () => {
    const result = parseNumber('-1,234.56');
    expect(result).toBe(-1234.56);
  });
});

describe('parseCurrency', () => {
  it('parses BDT currency string', () => {
    const result = parseCurrency('৳1,234.56');
    expect(result).toBe(1234.56);
  });

  it('parses USD currency string', () => {
    const result = parseCurrency('$1,234.56');
    expect(result).toBe(1234.56);
  });

  it('parses CNY currency string', () => {
    const result = parseCurrency('¥1,234.56');
    expect(result).toBe(1234.56);
  });

  it('parses Bengali numerals with currency symbol', () => {
    const result = parseCurrency('৳১,২৩৪.৫৬');
    expect(result).toBe(1234.56);
  });

  it('handles currency string without symbol', () => {
    const result = parseCurrency('1,234.56');
    expect(result).toBe(1234.56);
  });

  it('returns 0 for invalid input', () => {
    expect(parseCurrency('abc')).toBe(0);
    expect(parseCurrency('')).toBe(0);
  });

  it('handles negative currency values', () => {
    const result = parseCurrency('৳-500.25');
    expect(result).toBe(-500.25);
  });
});

describe('Integration tests', () => {
  it('round-trips number formatting and parsing', () => {
    const original = 1234.56;
    const formatted = formatNumber(original, 'en');
    const parsed = parseNumber(formatted);
    expect(parsed).toBe(original);
  });

  it('round-trips Bengali number formatting and parsing', () => {
    const original = 1234.56;
    const formatted = formatNumber(original, 'bn');
    const parsed = parseNumber(formatted);
    expect(parsed).toBe(original);
  });

  it('round-trips currency formatting and parsing', () => {
    const original = 1234.56;
    const formatted = formatCurrency(original, 'BDT', 'en');
    const parsed = parseCurrency(formatted);
    expect(parsed).toBe(original);
  });

  it('round-trips Bengali currency formatting and parsing', () => {
    const original = 1234.56;
    const formatted = formatCurrency(original, 'BDT', 'bn');
    const parsed = parseCurrency(formatted);
    expect(parsed).toBe(original);
  });
});
