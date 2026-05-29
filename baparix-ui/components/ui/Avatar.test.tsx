import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Avatar, AvatarGroup, AvatarWithStatus } from './Avatar';

describe('Avatar', () => {
  it('renders image when src is provided', () => {
    render(<Avatar src="https://example.com/avatar.jpg" alt="User Avatar" />);
    
    const img = screen.getByRole('img', { name: 'User Avatar' });
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://example.com/avatar.jpg');
  });

  it('renders initials when no image provided', () => {
    render(<Avatar name="John Doe" />);
    
    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  it('generates initials from single word name', () => {
    render(<Avatar name="John" />);
    
    expect(screen.getByText('JO')).toBeInTheDocument();
  });

  it('generates initials from multi-word name', () => {
    render(<Avatar name="John Michael Doe" />);
    
    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  it('shows fallback when image fails to load', () => {
    render(<Avatar src="invalid-url.jpg" name="John Doe" />);
    
    const img = screen.getByRole('img');
    fireEvent.error(img);
    
    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  it('applies small size', () => {
    const { container } = render(<Avatar name="John Doe" size="sm" />);
    
    expect(container.firstChild).toHaveClass('w-8', 'h-8', 'text-sm');
  });

  it('applies medium size by default', () => {
    const { container } = render(<Avatar name="John Doe" />);
    
    expect(container.firstChild).toHaveClass('w-10', 'h-10', 'text-base');
  });

  it('applies large size', () => {
    const { container } = render(<Avatar name="John Doe" size="lg" />);
    
    expect(container.firstChild).toHaveClass('w-12', 'h-12', 'text-lg');
  });

  it('applies extra large size', () => {
    const { container } = render(<Avatar name="John Doe" size="xl" />);
    
    expect(container.firstChild).toHaveClass('w-16', 'h-16', 'text-xl');
  });

  it('applies extra small size', () => {
    const { container } = render(<Avatar name="John Doe" size="xs" />);
    
    expect(container.firstChild).toHaveClass('w-6', 'h-6', 'text-xs');
  });

  it('applies custom className', () => {
    const { container } = render(<Avatar name="John Doe" className="custom-avatar" />);
    
    expect(container.firstChild).toHaveClass('custom-avatar');
  });

  it('uses fallback color when provided', () => {
    const { container } = render(<Avatar name="John Doe" fallbackColor="bg-purple-500" />);
    
    expect(container.firstChild).toHaveClass('bg-purple-500');
  });

  it('has proper ARIA label', () => {
    render(<Avatar name="John Doe" />);
    
    expect(screen.getByRole('img', { name: 'John Doe' })).toBeInTheDocument();
  });

  it('shows question mark when no name provided', () => {
    render(<Avatar />);
    
    expect(screen.getByText('?')).toBeInTheDocument();
  });
});

describe('AvatarGroup', () => {
  const mockAvatars = [
    { name: 'John Doe', src: 'https://example.com/john.jpg' },
    { name: 'Jane Smith', src: 'https://example.com/jane.jpg' },
    { name: 'Bob Johnson', src: 'https://example.com/bob.jpg' },
  ];

  it('renders all avatars when count is below max', () => {
    render(<AvatarGroup avatars={mockAvatars} max={5} />);
    
    expect(screen.getByRole('img', { name: 'John Doe' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Jane Smith' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Bob Johnson' })).toBeInTheDocument();
  });

  it('limits displayed avatars to max', () => {
    render(<AvatarGroup avatars={mockAvatars} max={2} />);
    
    expect(screen.getByRole('img', { name: 'John Doe' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Jane Smith' })).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: 'Bob Johnson' })).not.toBeInTheDocument();
  });

  it('shows remaining count when avatars exceed max', () => {
    render(<AvatarGroup avatars={mockAvatars} max={2} />);
    
    expect(screen.getByLabelText('1 more')).toBeInTheDocument();
    expect(screen.getByText('+1')).toBeInTheDocument();
  });

  it('applies size to all avatars', () => {
    const { container } = render(<AvatarGroup avatars={mockAvatars} size="lg" />);
    
    const avatars = container.querySelectorAll('[role="img"]');
    avatars.forEach((avatar) => {
      expect(avatar).toHaveClass('w-12', 'h-12');
    });
  });

  it('has proper ARIA group label', () => {
    render(<AvatarGroup avatars={mockAvatars} />);
    
    expect(screen.getByRole('group', { name: 'Avatar group' })).toBeInTheDocument();
  });
});

describe('AvatarWithStatus', () => {
  it('renders avatar with online status', () => {
    render(<AvatarWithStatus name="John Doe" status="online" />);
    
    expect(screen.getByLabelText('Online')).toBeInTheDocument();
  });

  it('renders avatar with offline status', () => {
    render(<AvatarWithStatus name="John Doe" status="offline" />);
    
    expect(screen.getByLabelText('Offline')).toBeInTheDocument();
  });

  it('renders avatar with away status', () => {
    render(<AvatarWithStatus name="John Doe" status="away" />);
    
    expect(screen.getByLabelText('Away')).toBeInTheDocument();
  });

  it('renders avatar with busy status', () => {
    render(<AvatarWithStatus name="John Doe" status="busy" />);
    
    expect(screen.getByLabelText('Busy')).toBeInTheDocument();
  });

  it('hides status indicator when showStatus is false', () => {
    render(<AvatarWithStatus name="John Doe" status="online" showStatus={false} />);
    
    expect(screen.queryByLabelText('Online')).not.toBeInTheDocument();
  });

  it('shows status indicator by default', () => {
    render(<AvatarWithStatus name="John Doe" status="online" />);
    
    expect(screen.getByLabelText('Online')).toBeInTheDocument();
  });

  it('passes through avatar props', () => {
    render(<AvatarWithStatus name="John Doe" size="lg" status="online" />);
    
    const avatar = screen.getByRole('img', { name: 'John Doe' });
    expect(avatar).toHaveClass('w-12', 'h-12');
  });
});
