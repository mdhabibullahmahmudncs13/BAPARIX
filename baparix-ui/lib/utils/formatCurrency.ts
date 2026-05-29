/**
 * Format currency values according to Bangladesh locale
 * @param amount - The amount to format
 * @param currency - The currency code (BDT, USD, CNY)
 * @param locale - The locale to use for formatting
 * @returns Formatted currency string
 */
export function formatCurrency(
  amount: number,
  currency: 'BDT' | 'USD' | 'CNY' = 'BDT',
  locale: 'bn' | 'en' = 'en'
): string {
  const localeMap = {
    bn: 'bn-BD',
    en: 'en-BD',
  }

  const currencySymbols = {
    BDT: '৳',
    USD: '$',
    CNY: '¥',
  }

  try {
    const formatted = new Intl.NumberFormat(localeMap[locale], {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)

    return `${currencySymbols[currency]}${formatted}`
  } catch (error) {
    // Fallback formatting
    return `${currencySymbols[currency]}${amount.toFixed(2)}`
  }
}

/**
 * Parse a formatted currency string back to a number
 * @param value - The formatted currency string
 * @returns The numeric value
 */
export function parseCurrency(value: string): number {
  // Remove currency symbols and commas
  const cleaned = value.replace(/[৳$¥,]/g, '').trim()
  return parseFloat(cleaned) || 0
}
