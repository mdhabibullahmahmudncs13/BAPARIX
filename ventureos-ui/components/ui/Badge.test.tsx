import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Badge, StatusBadge, QualityBadge, PlatformBadge } from './Badge';

describe('Badge', () => {
  it('renders children', () => {
    render(<Badge>Test Badge</Badge>);
    
    expect(screen.getByText('Test Badge')).toBeInTheDocument();
  });

  it('applies default variant', () => {
    const { container } = render(<Badge>Default</Badge>);
    
    expect(container.firstChild).toHaveClass('bg-gray-100', 'text-gray-800');
  });

  it('applies success variant', () => {
    const { container } = render(<Badge variant="success">Success</Badge>);
    
    expect(container.firstChild).toHaveClass('bg-green-100', 'text-green-800');
  });

  it('applies warning variant', () => {
    const { container } = render(<Badge variant="warning">Warning</Badge>);
    
    expect(container.firstChild).toHaveClass('bg-yellow-100', 'text-yellow-800');
  });

  it('applies error variant', () => {
    const { container } = render(<Badge variant="error">Error</Badge>);
    
    expect(container.firstChild).toHaveClass('bg-red-100', 'text-red-800');
  });

  it('applies info variant', () => {
    const { container } = render(<Badge variant="info">Info</Badge>);
    
    expect(container.firstChild).toHaveClass('bg-blue-100', 'text-blue-800');
  });

  it('applies primary variant', () => {
    const { container } = render(<Badge variant="primary">Primary</Badge>);
    
    expect(container.firstChild).toHaveClass('bg-primary-100', 'text-primary-800');
  });

  it('applies small size', () => {
    const { container } = render(<Badge size="sm">Small</Badge>);
    
    expect(container.firstChild).toHaveClass('px-2', 'py-0.5', 'text-xs');
  });

  it('applies medium size by default', () => {
    const { container } = render(<Badge>Medium</Badge>);
    
    expect(container.firstChild).toHaveClass('px-2.5', 'py-0.5', 'text-sm');
  });

  it('applies large size', () => {
    const { container } = render(<Badge size="lg">Large</Badge>);
    
    expect(container.firstChild).toHaveClass('px-3', 'py-1', 'text-base');
  });

  it('renders icon when provided', () => {
    const icon = <span data-testid="badge-icon">★</span>;
    render(<Badge icon={icon}>With Icon</Badge>);
    
    expect(screen.getByTestId('badge-icon')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<Badge className="custom-badge">Custom</Badge>);
    
    expect(container.firstChild).toHaveClass('custom-badge');
  });
});

describe('StatusBadge', () => {
  it('renders active status', () => {
    render(<StatusBadge status="active" />);
    
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('renders inactive status', () => {
    render(<StatusBadge status="inactive" />);
    
    expect(screen.getByText('Inactive')).toBeInTheDocument();
  });

  it('renders pending status', () => {
    render(<StatusBadge status="pending" />);
    
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('renders completed status', () => {
    render(<StatusBadge status="completed" />);
    
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  it('renders failed status', () => {
    render(<StatusBadge status="failed" />);
    
    expect(screen.getByText('Failed')).toBeInTheDocument();
  });

  it('renders cancelled status', () => {
    render(<StatusBadge status="cancelled" />);
    
    expect(screen.getByText('Cancelled')).toBeInTheDocument();
  });
});

describe('QualityBadge', () => {
  it('renders cheap tier as Budget', () => {
    render(<QualityBadge tier="cheap" />);
    
    expect(screen.getByText('Budget')).toBeInTheDocument();
  });

  it('renders medium tier as Standard', () => {
    render(<QualityBadge tier="medium" />);
    
    expect(screen.getByText('Standard')).toBeInTheDocument();
  });

  it('renders high tier as Premium', () => {
    render(<QualityBadge tier="high" />);
    
    expect(screen.getByText('Premium')).toBeInTheDocument();
  });
});

describe('PlatformBadge', () => {
  it('renders Alibaba platform', () => {
    render(<PlatformBadge platform="alibaba" />);
    
    expect(screen.getByText('Alibaba')).toBeInTheDocument();
  });

  it('renders Pinduoduo platform', () => {
    render(<PlatformBadge platform="pinduoduo" />);
    
    expect(screen.getByText('Pinduoduo')).toBeInTheDocument();
  });

  it('renders Xianyu platform', () => {
    render(<PlatformBadge platform="xianyu" />);
    
    expect(screen.getByText('Xianyu')).toBeInTheDocument();
  });

  it('renders SkyBuyBD platform', () => {
    render(<PlatformBadge platform="skybuybd" />);
    
    expect(screen.getByText('SkyBuyBD')).toBeInTheDocument();
  });

  it('renders DHgate platform', () => {
    render(<PlatformBadge platform="dhgate" />);
    
    expect(screen.getByText('DHgate')).toBeInTheDocument();
  });

  it('renders AliExpress platform', () => {
    render(<PlatformBadge platform="aliexpress" />);
    
    expect(screen.getByText('AliExpress')).toBeInTheDocument();
  });
});
