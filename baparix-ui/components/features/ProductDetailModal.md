# ProductDetailModal Component

## Overview

The `ProductDetailModal` component displays comprehensive product details in a modal dialog. It includes supplier information, price history visualization, translated descriptions, and action buttons for calculating margins and adding products to comparison.

## Features

- **Detailed Product Information**: Displays title, description, images, price range, MOQ, lead time, category, and tags
- **Supplier Information**: Shows supplier name, rating, years active, response rate, and reliability score with visual progress bar
- **Price History Chart**: Interactive line chart showing price trends over time using Recharts
- **Bilingual Support**: Full support for English and Bengali with locale-aware formatting
- **Responsive Design**: Adapts to different screen sizes with appropriate layouts
- **Accessibility**: ARIA labels, keyboard navigation, and screen reader support

## Usage

```typescript
import { ProductDetailModal } from '@/components/features/ProductDetailModal';
import { useState } from 'react';

function ProductPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const handleProductSelect = (product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleCalculateMargin = (productId) => {
    // Handle margin calculation
    console.log('Calculate margin for:', productId);
  };

  const handleAddToComparison = (productId) => {
    // Handle adding to comparison
    console.log('Add to comparison:', productId);
  };

  return (
    <>
      {/* Your product list */}
      
      <ProductDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        product={selectedProduct}
        locale="en" // or "bn" for Bengali
        onCalculateMargin={handleCalculateMargin}
        onAddToComparison={handleAddToComparison}
      />
    </>
  );
}
```

## Props

### ProductDetailModalProps

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `isOpen` | `boolean` | Yes | Controls modal visibility |
| `onClose` | `() => void` | Yes | Callback when modal is closed |
| `product` | `ProductDetail` | Yes | Product data to display |
| `locale` | `'bn' \| 'en'` | Yes | Language locale for UI text |
| `onCalculateMargin` | `(id: string) => void` | No | Callback for calculate margin button |
| `onAddToComparison` | `(id: string) => void` | No | Callback for add to comparison button |

### Product Data Structure

```typescript
interface ProductDetail {
  id: string;
  title: string;
  titleTranslated?: string;
  description: string;
  descriptionTranslated?: string;
  images: string[];
  platform: 'alibaba' | 'pinduoduo' | 'xianyu' | 'skybuybd' | 'dhgate' | 'aliexpress';
  priceRange: {
    min: number;
    max: number;
    currency: string;
  };
  qualityTier: 'cheap' | 'medium' | 'high';
  moq: number;
  supplierInfo: {
    name: string;
    rating: number;
    yearsActive: number;
    responseRate: number;
    reliabilityScore: number;
  };
  leadTime: string;
  shippingOptions: string[];
  priceHistory?: Array<{ date: Date; price: number }>;
  category: string;
  tags: string[];
}
```

## Requirements Satisfied

This component satisfies the following requirements from the VentureOS specification:

- **Requirement 4.5**: Display detailed product information including supplier reliability score and price history chart
- **Requirement 4.6**: Show translated descriptions when available

## Accessibility

The component includes:
- ARIA labels for all interactive elements
- Proper heading hierarchy
- Keyboard navigation support
- Screen reader announcements
- Progress bar with ARIA attributes
- Alt text for all images

## Styling

The component uses Tailwind CSS classes and follows the VentureOS design system:
- Primary color for CTAs
- Responsive grid layouts
- Color-blind friendly chart colors
- Consistent spacing and typography

## Dependencies

- `react`: Core React library
- `next/image`: Next.js optimized image component
- `recharts`: Chart library for price history visualization
- `../ui/Modal`: Base modal component
- `../ui/Badge`: Badge components for platform and quality indicators
- `../ui/Button`: Button component for actions

## Testing

The component has comprehensive test coverage (98.65%) including:
- Rendering tests
- Product information display
- Supplier information display
- Price history chart
- Product images
- Action buttons
- Bilingual support
- Accessibility
- Requirements validation

Run tests with:
```bash
npm run test:ci -- ProductDetailModal.test.tsx
```

## Notes

- The component displays translated title and description when available, regardless of the selected locale
- Price history chart is only shown when `priceHistory` data is provided
- Images are limited to 6 maximum for performance
- All numbers and currency are formatted according to the selected locale
- The reliability score uses a color-coded progress bar (green ≥80%, yellow ≥60%, red <60%)
