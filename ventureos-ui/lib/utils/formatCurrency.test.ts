import { formatCurrency, parseCurrency } from './formatCurrency'

describe('formatCurrency', () => {
  it('should format BDT currency in English locale', () => {
    const result = formatCurrency(1000, 'BDT', 'en')
    expect(result).toContain('৳')
    expect(result).toContain('1,000')
  })

  it('should format BDT currency in Bengali locale', () => {
    const result = formatCurrency(1000, 'BDT', 'bn')
    expect(result).toContain('৳')
  })

  it('should format USD currency', () => {
    const result = formatCurrency(1000, 'USD', 'en')
    expect(result).toContain('$')
    expect(result).toContain('1,000')
  })

  it('should format CNY currency', () => {
    const result = formatCurrency(1000, 'CNY', 'en')
    expect(result).toContain('¥')
    expect(result).toContain('1,000')
  })

  it('should handle decimal values', () => {
    const result = formatCurrency(1234.56, 'BDT', 'en')
    expect(result).toContain('1,234.56')
  })

  it('should default to BDT and English locale', () => {
    const result = formatCurrency(1000)
    expect(result).toContain('৳')
  })
})

describe('parseCurrency', () => {
  it('should parse BDT formatted string', () => {
    const result = parseCurrency('৳1,000.00')
    expect(result).toBe(1000)
  })

  it('should parse USD formatted string', () => {
    const result = parseCurrency('$1,234.56')
    expect(result).toBe(1234.56)
  })

  it('should parse CNY formatted string', () => {
    const result = parseCurrency('¥999.99')
    expect(result).toBe(999.99)
  })

  it('should handle strings without currency symbols', () => {
    const result = parseCurrency('1,000.00')
    expect(result).toBe(1000)
  })

  it('should return 0 for invalid input', () => {
    const result = parseCurrency('invalid')
    expect(result).toBe(0)
  })

  it('should handle empty string', () => {
    const result = parseCurrency('')
    expect(result).toBe(0)
  })
})
