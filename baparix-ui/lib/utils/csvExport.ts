import { FinancialEntryFormData } from '@/lib/validations/financialEntry';

/**
 * CSV Export utility for financial data
 * Requirements: 19.1, 19.4, 19.5
 */

export interface CsvExportOptions {
  entries: FinancialEntryFormData[];
  userName: string;
  userEmail: string;
  fileName?: string;
}

/**
 * Escapes a CSV field value to handle special characters (commas, quotes, newlines)
 */
export function escapeCsvField(value: string): string {
  if (
    value.includes(',') ||
    value.includes('"') ||
    value.includes('\n') ||
    value.includes('\r')
  ) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Converts financial entry data to CSV string with metadata headers
 */
export function generateCsvContent(options: CsvExportOptions): string {
  const { entries, userName, userEmail } = options;
  const timestamp = new Date().toISOString();

  const lines: string[] = [];

  // Metadata rows
  lines.push(`# Export Timestamp,${escapeCsvField(timestamp)}`);
  lines.push(`# Exported By,${escapeCsvField(userName)}`);
  lines.push(`# Email,${escapeCsvField(userEmail)}`);
  lines.push(`# Total Entries,${entries.length}`);
  lines.push('');

  // Header row
  const headers = [
    'Type',
    'Amount',
    'Category',
    'Subcategory',
    'Description',
    'Date',
    'Product ID',
    'Payment Method',
  ];
  lines.push(headers.join(','));

  // Data rows
  for (const entry of entries) {
    const row = [
      escapeCsvField(entry.type),
      String(entry.amount),
      escapeCsvField(entry.category),
      escapeCsvField(entry.subcategory || ''),
      escapeCsvField(entry.description),
      escapeCsvField(entry.date),
      escapeCsvField(entry.productId || ''),
      escapeCsvField(entry.paymentMethod || ''),
    ];
    lines.push(row.join(','));
  }

  return lines.join('\n');
}

/**
 * Triggers a browser download of the CSV file
 */
export function downloadCsv(csvContent: string, fileName: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();

  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generates and downloads a CSV export of financial data
 * Requirements: 19.1 (CSV format), 19.4 (within 10 seconds), 19.5 (timestamp + user info)
 */
export function exportFinancialDataToCsv(options: CsvExportOptions): void {
  const { fileName } = options;
  const defaultFileName = `financial-export-${new Date().toISOString().slice(0, 10)}.csv`;

  const csvContent = generateCsvContent(options);
  downloadCsv(csvContent, fileName || defaultFileName);
}
