import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { LoadingSkeleton, SkeletonLayouts } from './LoadingSkeleton';

describe('LoadingSkeleton', () => {
  it('renders text skeleton by default', () => {
    render(<LoadingSkeleton />);
    
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByLabelText('Loading')).toBeInTheDocument();
  });

  it('renders card skeleton variant', () => {
    render(<LoadingSkeleton variant="card" />);
    
    expect(screen.getByLabelText('Loading card')).toBeInTheDocument();
  });

  it('renders table skeleton variant', () => {
    render(<LoadingSkeleton variant="table" />);
    
    expect(screen.getByLabelText('Loading table')).toBeInTheDocument();
  });

  it('renders avatar skeleton variant', () => {
    render(<LoadingSkeleton variant="avatar" />);
    
    expect(screen.getByLabelText('Loading avatar')).toBeInTheDocument();
  });

  it('renders button skeleton variant', () => {
    render(<LoadingSkeleton variant="button" />);
    
    expect(screen.getByLabelText('Loading button')).toBeInTheDocument();
  });

  it('renders image skeleton variant', () => {
    render(<LoadingSkeleton variant="image" />);
    
    expect(screen.getByLabelText('Loading image')).toBeInTheDocument();
  });

  it('renders multiple skeletons when count is specified', () => {
    render(<LoadingSkeleton count={3} />);
    
    const skeletons = screen.getAllByRole('status');
    expect(skeletons).toHaveLength(3);
  });

  it('applies custom className', () => {
    const { container } = render(<LoadingSkeleton className="custom-skeleton" />);
    
    expect(container.querySelector('.custom-skeleton')).toBeInTheDocument();
  });

  it('applies custom width and height', () => {
    const { container } = render(<LoadingSkeleton width="200px" height="50px" />);
    
    const skeleton = container.querySelector('[role="status"]');
    expect(skeleton).toHaveStyle({ width: '200px', height: '50px' });
  });

  it('has screen reader text', () => {
    render(<LoadingSkeleton />);
    
    expect(screen.getByText('Loading...')).toHaveClass('sr-only');
  });
});

describe('SkeletonLayouts', () => {
  it('renders ProductCard layout', () => {
    render(<SkeletonLayouts.ProductCard />);
    
    expect(screen.getByLabelText('Loading product')).toBeInTheDocument();
  });

  it('renders DashboardCard layout', () => {
    render(<SkeletonLayouts.DashboardCard />);
    
    expect(screen.getByLabelText('Loading dashboard card')).toBeInTheDocument();
  });

  it('renders ListItem layout', () => {
    render(<SkeletonLayouts.ListItem />);
    
    expect(screen.getByLabelText('Loading list item')).toBeInTheDocument();
  });

  it('renders FormField layout', () => {
    render(<SkeletonLayouts.FormField />);
    
    expect(screen.getByLabelText('Loading form field')).toBeInTheDocument();
  });
});
