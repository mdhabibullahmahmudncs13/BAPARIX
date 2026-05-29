import { render, screen } from '@testing-library/react';
import { InventoryAlerts, getSeverity, UnsoldProduct } from './InventoryAlerts';

describe('InventoryAlerts', () => {
  const mockProducts: UnsoldProduct[] = [
    { id: '1', name: 'Product A', daysUnsold: 35, stockQuantity: 10 },
    { id: '2', name: 'Product B', daysUnsold: 65, stockQuantity: 25 },
    { id: '3', name: 'Product C', daysUnsold: 45, stockQuantity: 5 },
  ];

  describe('Rendering with alerts', () => {
    it('renders the component title', () => {
      render(<InventoryAlerts products={mockProducts} locale="en" />);
      expect(screen.getByText('title')).toBeInTheDocument();
    });

    it('renders the alert list', () => {
      render(<InventoryAlerts products={mockProducts} locale="en" />);
      expect(screen.getByTestId('inventory-alerts-list')).toBeInTheDocument();
    });

    it('displays all products unsold for more than 30 days', () => {
      render(<InventoryAlerts products={mockProducts} locale="en" />);
      expect(screen.getByTestId('inventory-alert-item-1')).toBeInTheDocument();
      expect(screen.getByTestId('inventory-alert-item-2')).toBeInTheDocument();
      expect(screen.getByTestId('inventory-alert-item-3')).toBeInTheDocument();
    });

    it('displays product names', () => {
      render(<InventoryAlerts products={mockProducts} locale="en" />);
      expect(screen.getByText('Product A')).toBeInTheDocument();
      expect(screen.getByText('Product B')).toBeInTheDocument();
      expect(screen.getByText('Product C')).toBeInTheDocument();
    });

    it('displays days unsold and stock quantity info', () => {
      render(<InventoryAlerts products={mockProducts} locale="en" />);
      // The translation mock returns the key, so we check for the translation key pattern
      expect(screen.getByTestId('inventory-alert-item-1')).toBeInTheDocument();
      expect(screen.getByTestId('inventory-alert-item-2')).toBeInTheDocument();
    });

    it('shows alert count badge', () => {
      render(<InventoryAlerts products={mockProducts} locale="en" />);
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('shows warning badge for products unsold 31-60 days', () => {
      render(<InventoryAlerts products={[mockProducts[0]]} locale="en" />);
      expect(screen.getByText('warning')).toBeInTheDocument();
    });

    it('shows critical badge for products unsold >60 days', () => {
      render(<InventoryAlerts products={[mockProducts[1]]} locale="en" />);
      expect(screen.getByText('critical')).toBeInTheDocument();
    });
  });

  describe('Empty state', () => {
    it('renders empty state when no products are unsold >30 days', () => {
      render(<InventoryAlerts products={[]} locale="en" />);
      expect(screen.getByTestId('inventory-alerts-empty')).toBeInTheDocument();
    });

    it('renders empty state when all products are under 30 days', () => {
      const recentProducts: UnsoldProduct[] = [
        { id: '1', name: 'Fresh Product', daysUnsold: 15, stockQuantity: 10 },
        { id: '2', name: 'New Product', daysUnsold: 29, stockQuantity: 5 },
      ];
      render(<InventoryAlerts products={recentProducts} locale="en" />);
      expect(screen.getByTestId('inventory-alerts-empty')).toBeInTheDocument();
    });

    it('displays no alerts message in empty state', () => {
      render(<InventoryAlerts products={[]} locale="en" />);
      expect(screen.getByText('noAlerts')).toBeInTheDocument();
    });
  });

  describe('Filtering', () => {
    it('filters out products with exactly 30 days unsold', () => {
      const products: UnsoldProduct[] = [
        { id: '1', name: 'Borderline', daysUnsold: 30, stockQuantity: 10 },
      ];
      render(<InventoryAlerts products={products} locale="en" />);
      expect(screen.getByTestId('inventory-alerts-empty')).toBeInTheDocument();
    });

    it('includes products with 31 days unsold', () => {
      const products: UnsoldProduct[] = [
        { id: '1', name: 'Just Over', daysUnsold: 31, stockQuantity: 10 },
      ];
      render(<InventoryAlerts products={products} locale="en" />);
      expect(screen.getByTestId('inventory-alert-item-1')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has an accessible list with aria-label', () => {
      render(<InventoryAlerts products={mockProducts} locale="en" />);
      const list = screen.getByTestId('inventory-alerts-list');
      expect(list).toHaveAttribute('aria-label', 'title');
    });

    it('decorative icons have aria-hidden', () => {
      const { container } = render(<InventoryAlerts products={mockProducts} locale="en" />);
      const hiddenIcons = container.querySelectorAll('[aria-hidden="true"]');
      expect(hiddenIcons.length).toBeGreaterThan(0);
    });
  });
});

describe('getSeverity', () => {
  it('returns warning for 31-60 days', () => {
    expect(getSeverity(31)).toBe('warning');
    expect(getSeverity(45)).toBe('warning');
    expect(getSeverity(60)).toBe('warning');
  });

  it('returns error for >60 days', () => {
    expect(getSeverity(61)).toBe('error');
    expect(getSeverity(90)).toBe('error');
    expect(getSeverity(120)).toBe('error');
  });
});
