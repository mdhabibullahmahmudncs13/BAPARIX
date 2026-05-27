import { generateJsonContent, downloadJson, exportComparisonDataToJson } from './jsonExport';
import { Product } from '@/components/features/ProductComparison';

const mockProducts: Product[] = [
  {
    id: 'prod-1',
    title: 'Phone Case',
    titleTranslated: 'ফোন কেস',
    image: '/images/phone-case.jpg',
    priceRange: { min: 50, max: 200, currency: 'BDT' },
    platform: 'alibaba',
    qualityTier: 'medium',
    moq: 100,
    supplierRating: 4.5,
    leadTime: '7-14 days',
    supplierInfo: {
      name: 'Shenzhen Tech Co.',
      yearsActive: 5,
      responseRate: 95,
    },
    shippingOptions: ['Air Express', 'Sea Freight'],
  },
  {
    id: 'prod-2',
    title: 'USB Cable',
    image: '/images/usb-cable.jpg',
    priceRange: { min: 10, max: 50, currency: 'USD' },
    platform: 'dhgate',
    qualityTier: 'cheap',
    moq: 500,
    supplierRating: 3.8,
    leadTime: '14-21 days',
  },
];

describe('generateJsonContent', () => {
  it('includes export timestamp in metadata', () => {
    const result = generateJsonContent({
      products: mockProducts,
      userName: 'Test User',
      userEmail: 'test@example.com',
    });

    expect(result.metadata.exportTimestamp).toBeDefined();
    expect(new Date(result.metadata.exportTimestamp).toISOString()).toBe(result.metadata.exportTimestamp);
  });

  it('includes user name in metadata', () => {
    const result = generateJsonContent({
      products: mockProducts,
      userName: 'Test User',
      userEmail: 'test@example.com',
    });

    expect(result.metadata.exportedBy).toBe('Test User');
  });

  it('includes user email in metadata', () => {
    const result = generateJsonContent({
      products: mockProducts,
      userName: 'Test User',
      userEmail: 'test@example.com',
    });

    expect(result.metadata.email).toBe('test@example.com');
  });

  it('includes total products count in metadata', () => {
    const result = generateJsonContent({
      products: mockProducts,
      userName: 'Test User',
      userEmail: 'test@example.com',
    });

    expect(result.metadata.totalProducts).toBe(2);
  });

  it('includes all product data', () => {
    const result = generateJsonContent({
      products: mockProducts,
      userName: 'Test User',
      userEmail: 'test@example.com',
    });

    expect(result.products).toHaveLength(2);
    expect(result.products[0].id).toBe('prod-1');
    expect(result.products[1].id).toBe('prod-2');
  });

  it('preserves product details including supplier info', () => {
    const result = generateJsonContent({
      products: mockProducts,
      userName: 'Test User',
      userEmail: 'test@example.com',
    });

    expect(result.products[0].supplierInfo).toEqual({
      name: 'Shenzhen Tech Co.',
      yearsActive: 5,
      responseRate: 95,
    });
  });

  it('preserves shipping options', () => {
    const result = generateJsonContent({
      products: mockProducts,
      userName: 'Test User',
      userEmail: 'test@example.com',
    });

    expect(result.products[0].shippingOptions).toEqual(['Air Express', 'Sea Freight']);
  });

  it('handles empty products array', () => {
    const result = generateJsonContent({
      products: [],
      userName: 'Test User',
      userEmail: 'test@example.com',
    });

    expect(result.metadata.totalProducts).toBe(0);
    expect(result.products).toHaveLength(0);
  });

  it('handles products without optional fields', () => {
    const result = generateJsonContent({
      products: [mockProducts[1]],
      userName: 'Test User',
      userEmail: 'test@example.com',
    });

    expect(result.products[0].supplierInfo).toBeUndefined();
    expect(result.products[0].shippingOptions).toBeUndefined();
  });
});

describe('downloadJson', () => {
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

    downloadJson('{"test": true}', 'test.json');

    expect(createObjectURLMock).toHaveBeenCalled();
    expect(appendChildMock).toHaveBeenCalled();
    expect(clickMock).toHaveBeenCalled();
    expect(removeChildMock).toHaveBeenCalled();
    expect(revokeObjectURLMock).toHaveBeenCalled();

    appendChildMock.mockRestore();
    removeChildMock.mockRestore();
  });

  it('creates blob with correct MIME type', () => {
    jest.spyOn(document.body, 'appendChild').mockImplementation((node) => node);
    jest.spyOn(document.body, 'removeChild').mockImplementation((node) => node);

    const BlobMock = jest.fn();
    global.Blob = BlobMock as unknown as typeof Blob;

    downloadJson('{"test": true}', 'test.json');

    expect(BlobMock).toHaveBeenCalledWith(
      ['{"test": true}'],
      { type: 'application/json;charset=utf-8;' }
    );

    jest.restoreAllMocks();
  });
});

describe('exportComparisonDataToJson', () => {
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
      expect((node as HTMLAnchorElement).download).toBe('my-export.json');
      return node;
    });

    exportComparisonDataToJson({
      products: mockProducts,
      userName: 'Test',
      userEmail: 'test@test.com',
      fileName: 'my-export.json',
    });

    appendChildMock.mockRestore();
  });

  it('generates default fileName when not provided', () => {
    const appendChildMock = jest.spyOn(document.body, 'appendChild').mockImplementation((node) => {
      expect((node as HTMLAnchorElement).download).toMatch(/^product-comparison-\d{4}-\d{2}-\d{2}\.json$/);
      return node;
    });

    exportComparisonDataToJson({
      products: mockProducts,
      userName: 'Test',
      userEmail: 'test@test.com',
    });

    appendChildMock.mockRestore();
  });

  it('generates pretty-printed JSON', () => {
    let blobContent = '';
    const OriginalBlob = global.Blob;
    global.Blob = class MockBlob {
      constructor(parts: string[]) {
        blobContent = parts[0];
      }
    } as unknown as typeof Blob;

    jest.spyOn(document.body, 'appendChild').mockImplementation((node) => node);
    jest.spyOn(document.body, 'removeChild').mockImplementation((node) => node);

    exportComparisonDataToJson({
      products: mockProducts,
      userName: 'Test',
      userEmail: 'test@test.com',
    });

    // Pretty-printed JSON should contain newlines and indentation
    expect(blobContent).toContain('\n');
    expect(blobContent).toContain('  ');

    global.Blob = OriginalBlob;
    jest.restoreAllMocks();
  });
});
