import { escapeCsvField, generateCsvContent, exportFinancialDataToCsv, downloadCsv } from './csvExport';
import { FinancialEntryFormData } from '@/lib/validations/financialEntry';

describe('escapeCsvField', () => {
  it('returns plain text unchanged', () => {
    expect(escapeCsvField('hello')).toBe('hello');
  });

  it('wraps fields containing commas in quotes', () => {
    expect(escapeCsvField('hello, world')).toBe('"hello, world"');
  });

  it('wraps fields containing double quotes and escapes them', () => {
    expect(escapeCsvField('say "hi"')).toBe('"say ""hi"""');
  });

  it('wraps fields containing newlines in quotes', () => {
    expect(escapeCsvField('line1\nline2')).toBe('"line1\nline2"');
  });

  it('wraps fields containing carriage returns in quotes', () => {
    expect(escapeCsvField('line1\rline2')).toBe('"line1\rline2"');
  });

  it('handles fields with both commas and quotes', () => {
    expect(escapeCsvField('price is "100", ok')).toBe('"price is ""100"", ok"');
  });

  it('handles empty string', () => {
    expect(escapeCsvField('')).toBe('');
  });
});

describe('generateCsvContent', () => {
  const mockEntries: FinancialEntryFormData[] = [
    {
      type: 'revenue',
      amount: 5000,
      category: 'product_sales',
      subcategory: 'electronics',
      description: 'Sold 10 phone cases',
      date: '2024-01-15',
      productId: 'prod-001',
      paymentMethod: 'bkash',
    },
    {
      type: 'expense',
      amount: 2000,
      category: 'shipping',
      description: 'Courier delivery',
      date: '2024-01-16',
    },
  ];

  it('includes export timestamp in metadata', () => {
    const csv = generateCsvContent({
      entries: mockEntries,
      userName: 'Test User',
      userEmail: 'test@example.com',
    });

    expect(csv).toContain('# Export Timestamp,');
  });

  it('includes user name in metadata', () => {
    const csv = generateCsvContent({
      entries: mockEntries,
      userName: 'Test User',
      userEmail: 'test@example.com',
    });

    expect(csv).toContain('# Exported By,Test User');
  });

  it('includes user email in metadata', () => {
    const csv = generateCsvContent({
      entries: mockEntries,
      userName: 'Test User',
      userEmail: 'test@example.com',
    });

    expect(csv).toContain('# Email,test@example.com');
  });

  it('includes total entries count in metadata', () => {
    const csv = generateCsvContent({
      entries: mockEntries,
      userName: 'Test User',
      userEmail: 'test@example.com',
    });

    expect(csv).toContain('# Total Entries,2');
  });

  it('includes header row with correct columns', () => {
    const csv = generateCsvContent({
      entries: mockEntries,
      userName: 'Test User',
      userEmail: 'test@example.com',
    });

    expect(csv).toContain('Type,Amount,Category,Subcategory,Description,Date,Product ID,Payment Method');
  });

  it('includes data rows with correct values', () => {
    const csv = generateCsvContent({
      entries: mockEntries,
      userName: 'Test User',
      userEmail: 'test@example.com',
    });

    expect(csv).toContain('revenue,5000,product_sales,electronics,Sold 10 phone cases,2024-01-15,prod-001,bkash');
    expect(csv).toContain('expense,2000,shipping,,Courier delivery,2024-01-16,,');
  });

  it('handles entries with special characters in description', () => {
    const entries: FinancialEntryFormData[] = [
      {
        type: 'revenue',
        amount: 1000,
        category: 'product_sales',
        description: 'Item with "quotes" and, commas',
        date: '2024-01-15',
      },
    ];

    const csv = generateCsvContent({
      entries,
      userName: 'Test User',
      userEmail: 'test@example.com',
    });

    expect(csv).toContain('"Item with ""quotes"" and, commas"');
  });

  it('handles empty entries array', () => {
    const csv = generateCsvContent({
      entries: [],
      userName: 'Test User',
      userEmail: 'test@example.com',
    });

    expect(csv).toContain('# Total Entries,0');
    expect(csv).toContain('Type,Amount,Category,Subcategory,Description,Date,Product ID,Payment Method');
  });

  it('escapes user name with special characters', () => {
    const csv = generateCsvContent({
      entries: [],
      userName: 'User, "Special"',
      userEmail: 'test@example.com',
    });

    expect(csv).toContain('# Exported By,"User, ""Special"""');
  });
});

describe('downloadCsv', () => {
  let createObjectURLMock: jest.Mock;
  let revokeObjectURLMock: jest.Mock;

  beforeEach(() => {
    createObjectURLMock = jest.fn(() => 'blob:http://localhost/test');
    revokeObjectURLMock = jest.fn();
    global.URL.createObjectURL = createObjectURLMock;
    global.URL.revokeObjectURL = revokeObjectURLMock;
  });

  it('creates a download link and triggers click', () => {
    const clickMock = jest.fn();
    const appendChildMock = jest.spyOn(document.body, 'appendChild').mockImplementation((node) => {
      (node as HTMLAnchorElement).click = clickMock;
      return node;
    });
    const removeChildMock = jest.spyOn(document.body, 'removeChild').mockImplementation((node) => node);

    downloadCsv('test,data', 'test.csv');

    expect(createObjectURLMock).toHaveBeenCalled();
    expect(appendChildMock).toHaveBeenCalled();
    expect(clickMock).toHaveBeenCalled();
    expect(removeChildMock).toHaveBeenCalled();
    expect(revokeObjectURLMock).toHaveBeenCalled();

    appendChildMock.mockRestore();
    removeChildMock.mockRestore();
  });
});

describe('exportFinancialDataToCsv', () => {
  let createObjectURLMock: jest.Mock;
  let revokeObjectURLMock: jest.Mock;

  beforeEach(() => {
    createObjectURLMock = jest.fn(() => 'blob:http://localhost/test');
    revokeObjectURLMock = jest.fn();
    global.URL.createObjectURL = createObjectURLMock;
    global.URL.revokeObjectURL = revokeObjectURLMock;
    jest.spyOn(document.body, 'appendChild').mockImplementation((node) => node);
    jest.spyOn(document.body, 'removeChild').mockImplementation((node) => node);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('uses provided fileName', () => {
    const appendChildMock = jest.spyOn(document.body, 'appendChild').mockImplementation((node) => {
      expect((node as HTMLAnchorElement).download).toBe('my-export.csv');
      return node;
    });

    exportFinancialDataToCsv({
      entries: [],
      userName: 'Test',
      userEmail: 'test@test.com',
      fileName: 'my-export.csv',
    });

    appendChildMock.mockRestore();
  });

  it('generates default fileName when not provided', () => {
    const appendChildMock = jest.spyOn(document.body, 'appendChild').mockImplementation((node) => {
      expect((node as HTMLAnchorElement).download).toMatch(/^financial-export-\d{4}-\d{2}-\d{2}\.csv$/);
      return node;
    });

    exportFinancialDataToCsv({
      entries: [],
      userName: 'Test',
      userEmail: 'test@test.com',
    });

    appendChildMock.mockRestore();
  });
});
