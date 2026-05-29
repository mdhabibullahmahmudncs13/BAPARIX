import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { EmptyState, EmptyStateIcons } from './EmptyState';

describe('EmptyState', () => {
  it('renders title', () => {
    render(<EmptyState title="No data available" />);
    
    expect(screen.getByText('No data available')).toBeInTheDocument();
  });

  it('renders description when provided', () => {
    render(
      <EmptyState
        title="No results"
        description="Try adjusting your search criteria"
      />
    );
    
    expect(screen.getByText('Try adjusting your search criteria')).toBeInTheDocument();
  });

  it('renders default icon when no icon provided', () => {
    const { container } = render(<EmptyState title="Empty" />);
    
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders custom icon when provided', () => {
    const customIcon = <div data-testid="custom-icon">Custom Icon</div>;
    render(<EmptyState title="Empty" icon={customIcon} />);
    
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
  });

  it('renders action button when provided', () => {
    const handleClick = jest.fn();
    render(
      <EmptyState
        title="No items"
        action={{ label: 'Add Item', onClick: handleClick }}
      />
    );
    
    const button = screen.getByText('Add Item');
    expect(button).toBeInTheDocument();
    
    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('does not render action button when not provided', () => {
    render(<EmptyState title="Empty" />);
    
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <EmptyState title="Empty" className="custom-empty" />
    );
    
    expect(container.querySelector('.custom-empty')).toBeInTheDocument();
  });

  it('has proper ARIA attributes', () => {
    render(<EmptyState title="No data" />);
    
    const container = screen.getByRole('status');
    expect(container).toHaveAttribute('aria-live', 'polite');
  });
});

describe('EmptyStateIcons', () => {
  it('provides NoData icon', () => {
    expect(EmptyStateIcons.NoData).toBeDefined();
  });

  it('provides NoResults icon', () => {
    expect(EmptyStateIcons.NoResults).toBeDefined();
  });

  it('provides NoProducts icon', () => {
    expect(EmptyStateIcons.NoProducts).toBeDefined();
  });

  it('provides NoNotifications icon', () => {
    expect(EmptyStateIcons.NoNotifications).toBeDefined();
  });

  it('provides Error icon', () => {
    expect(EmptyStateIcons.Error).toBeDefined();
  });
});
