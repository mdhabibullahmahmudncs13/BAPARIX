/**
 * Locale-aware number and currency formatting utilities
 * Supports Bangladesh locale with Bengali numerals
 */

// Bengali numeral mapping
const bengaliNumerals: { [key: string]: string } = {
  '0': '০',
  '1': '১',
  '2': '২',
  '3': '৩',
  '4': '৪',
  '5': '৫',
  '6': '৬',
  '7': '৭',
  '8': '৮',
  '9': '৯',
};

/**
 * Convert Western numerals to Bengali numerals
 * @param value - String containing Western numerals
 * @returns String with Bengali numerals
 */
export function toBengaliNumerals(value: string): string {
  return value.replace(/[0-9]/g, (digit) => bengaliNumerals[digit] || digit);
}

/**
 * Convert Bengali numerals to Western numerals
 * @param value - String containing Bengali numerals
 * @returns String with Western numerals
 */
export function toWesternNumerals(value: string): string {
  const reverseBengaliNumerals: { [key: string]: string } = Object.entries(
    bengaliNumerals
  ).reduce((acc, [western, bengali]) => {
    acc[bengali] = western;
    return acc;
  }, {} as { [key: string]: string });

  return value.replace(/[০-৯]/g, (digit) => reverseBengaliNumerals[digit] || digit);
}

/**
 * Format a number with locale-aware formatting
 * @param value - The number to format
 * @param locale - The locale ('bn' or 'en')
 * @param options - Intl.NumberFormat options
 * @returns Formatted number string
 */
export function formatNumber(
  value: number,
  locale: 'bn' | 'en' = 'en',
  options?: Intl.NumberFormatOptions
): string {
  const localeMap = {
    bn: 'bn-BD',
    en: 'en-BD',
  };

  try {
    const formatted = new Intl.NumberFormat(localeMap[locale], {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
      ...options,
    }).format(value);

    // For Bengali locale, convert to Bengali numerals
    if (locale === 'bn') {
      return toBengaliNumerals(formatted);
    }

    return formatted;
  } catch (error) {
    // Fallback formatting
    const fallback = value.toLocaleString('en-US', options);
    return locale === 'bn' ? toBengaliNumerals(fallback) : fallback;
  }
}

/**
 * Format currency with locale-aware formatting and symbols
 * @param amount - The amount to format
 * @param currency - The currency code (BDT, USD, CNY)
 * @param locale - The locale ('bn' or 'en')
 * @param showSymbol - Whether to show currency symbol (default: true)
 * @returns Formatted currency string
 */
export function formatCurrency(
  amount: number,
  currency: 'BDT' | 'USD' | 'CNY' = 'BDT',
  locale: 'bn' | 'en' = 'en',
  showSymbol: boolean = true
): string {
  const currencySymbols = {
    BDT: '৳',
    USD: '$',
    CNY: '¥',
  };

  const formatted = formatNumber(amount, locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  if (showSymbol) {
    return `${currencySymbols[currency]}${formatted}`;
  }

  return formatted;
}

/**
 * Format a number as a percentage
 * @param value - The value to format (0.15 = 15%)
 * @param locale - The locale ('bn' or 'en')
 * @param decimals - Number of decimal places (default: 0)
 * @returns Formatted percentage string
 */
export function formatPercentage(
  value: number,
  locale: 'bn' | 'en' = 'en',
  decimals: number = 0
): string {
  const percentage = value * 100;
  const formatted = formatNumber(percentage, locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return `${formatted}%`;
}

/**
 * Format a number with compact notation (1K, 1M, etc.)
 * @param value - The number to format
 * @param locale - The locale ('bn' or 'en')
 * @returns Formatted compact number string
 */
export function formatCompactNumber(
  value: number,
  locale: 'bn' | 'en' = 'en'
): string {
  const localeMap = {
    bn: 'bn-BD',
    en: 'en-BD',
  };

  try {
    const formatted = new Intl.NumberFormat(localeMap[locale], {
      notation: 'compact',
      compactDisplay: 'short',
      maximumFractionDigits: 1,
    }).format(value);

    // For Bengali locale, convert to Bengali numerals
    if (locale === 'bn') {
      return toBengaliNumerals(formatted);
    }

    return formatted;
  } catch (error) {
    // Fallback for older browsers
    if (value >= 1000000) {
      const millions = value / 1000000;
      const formatted = formatNumber(millions, locale, {
        maximumFractionDigits: 1,
      });
      return `${formatted}M`;
    } else if (value >= 1000) {
      const thousands = value / 1000;
      const formatted = formatNumber(thousands, locale, {
        maximumFractionDigits: 1,
      });
      return `${formatted}K`;
    }
    return formatNumber(value, locale);
  }
}

/**
 * Parse a formatted number string back to a number
 * Handles both Bengali and Western numerals
 * @param value - The formatted number string
 * @returns The numeric value
 */
export function parseNumber(value: string): number {
  // Convert Bengali numerals to Western if present
  const westernValue = toWesternNumerals(value);
  
  // Remove commas and other formatting
  const cleaned = westernValue.replace(/[,\s]/g, '');
  
  return parseFloat(cleaned) || 0;
}

/**
 * Parse a formatted currency string back to a number
 * @param value - The formatted currency string
 * @returns The numeric value
 */
export function parseCurrency(value: string): number {
  // Remove currency symbols
  const withoutSymbols = value.replace(/[৳$¥]/g, '');
  return parseNumber(withoutSymbols);
}
