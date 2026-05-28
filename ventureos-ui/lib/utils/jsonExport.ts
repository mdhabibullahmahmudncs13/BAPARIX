import { Product } from '@/components/features/ProductComparison';

/**
 * JSON Export utility for product comparison data
 * Requirements: 19.3, 19.4, 19.5
 */

export interface JsonExportOptions {
  products: Product[];
  userName: string;
  userEmail: string;
  fileName?: string;
}

export interface JsonExportData {
  metadata: {
    exportTimestamp: string;
    exportedBy: string;
    email: string;
    totalProducts: number;
  };
  products: Product[];
}

/**
 * Generates a structured JSON export object with metadata and product comparison data
 */
export function generateJsonContent(options: JsonExportOptions): JsonExportData {
  const { products, userName, userEmail } = options;

  return {
    metadata: {
      exportTimestamp: new Date().toISOString(),
      exportedBy: userName,
      email: userEmail,
      totalProducts: products.length,
    },
    products,
  };
}

/**
 * Triggers a browser download of the JSON file
 */
export function downloadJson(jsonContent: string, fileName: string): void {
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
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
 * Generates and downloads a JSON export of product comparison data
 * Requirements: 19.3 (JSON format), 19.4 (within 10 seconds), 19.5 (timestamp + user info)
 */
export function exportComparisonDataToJson(options: JsonExportOptions): void {
  const { fileName } = options;
  const defaultFileName = `product-comparison-${new Date().toISOString().slice(0, 10)}.json`;

  const exportData = generateJsonContent(options);
  const jsonString = JSON.stringify(exportData, null, 2);
  downloadJson(jsonString, fileName || defaultFileName);
}
