import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Toast, ToastContainer } from './Toast';

describe('Toast', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('renders with message', () => {
    render(
      <Toast
        id="test-toast"
        type="success"
        message="Operation successful"
        onClose={mockOnClose}
      />
    );
    expect(screen.getByText('Operation successful')).toBeInTheDocument();
  });

  it('renders success type with correct styling', () => {
    render(
      <Toast
        id="test-toast"
        type="success"
        message="Success message"
        onClose={mockOnClose}
      />
    );
    const toast = screen.getByRole('alert');
    expect(toast).toHaveClass('bg-success-50', 'border-success-500');
  });

  it('renders error type with correct styling', () => {
    render(
      <Toast
        id="test-toast"
        type="error"
        message="Error message"
        onClose={mockOnClose}
      />
    );
    const toast = screen.getByRole('alert');
    expect(toast).toHaveClass('bg-error-50', 'border-error-500');
  });

  it('renders warning type with correct styling', () => {
    render(
      <Toast
        id="test-toast"
        type="warning"
        message="Warning message"
        onClose={mockOnClose}
      />
    );
    const toast = screen.getByRole('alert');
    expect(toast).toHaveClass('bg-warning-50', 'border-warning-500');
  });

  it('renders info type with correct styling', () => {
    render(
      <Toast
        id="test-toast"
        type="info"
        message="Info message"
        onClose={mockOnClose}
      />
    );
    const toast = screen.getByRole('alert');
    expect(toast).toHaveClass('bg-primary-50', 'border-primary-500');
  });

  it('auto-dismisses after duration', async () => {
    render(
      <Toast
        id="test-toast"
        type="success"
        message="Auto dismiss"
        duration={2000}
        onClose={mockOnClose}
      />
    );

    expect(mockOnClose).not.toHaveBeenCalled();

    // Fast-forward time
    jest.advanceTimersByTime(2300); // duration + animation time

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalledWith('test-toast');
    });
  });

  it('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup({ delay: null });
    render(
      <Toast
        id="test-toast"
        type="success"
        message="Closeable toast"
        onClose={mockOnClose}
      />
    );

    const closeButton = screen.getByLabelText('Close notification');
    await user.click(closeButton);

    // Wait for animation
    jest.advanceTimersByTime(300);

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalledWith('test-toast');
    });
  });

  it('has proper ARIA attributes', () => {
    render(
      <Toast
        id="test-toast"
        type="success"
        message="Accessible toast"
        onClose={mockOnClose}
      />
    );
    const toast = screen.getByRole('alert');
    expect(toast).toHaveAttribute('aria-live', 'polite');
  });

  it('displays appropriate icon for each type', () => {
    const { rerender } = render(
      <Toast
        id="test-toast"
        type="success"
        message="Success"
        onClose={mockOnClose}
      />
    );
    expect(screen.getByRole('alert').querySelector('svg')).toBeInTheDocument();

    rerender(
      <Toast
        id="test-toast"
        type="error"
        message="Error"
        onClose={mockOnClose}
      />
    );
    expect(screen.getByRole('alert').querySelector('svg')).toBeInTheDocument();
  });
});

describe('ToastContainer', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders nothing when toasts array is empty', () => {
    const { container } = render(
      <ToastContainer toasts={[]} onClose={mockOnClose} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders multiple toasts', () => {
    const toasts = [
      { id: '1', type: 'success' as const, message: 'Toast 1' },
      { id: '2', type: 'error' as const, message: 'Toast 2' },
      { id: '3', type: 'info' as const, message: 'Toast 3' },
    ];

    render(<ToastContainer toasts={toasts} onClose={mockOnClose} />);

    expect(screen.getByText('Toast 1')).toBeInTheDocument();
    expect(screen.getByText('Toast 2')).toBeInTheDocument();
    expect(screen.getByText('Toast 3')).toBeInTheDocument();
  });

  it('applies correct position classes', () => {
    const toasts = [{ id: '1', type: 'success' as const, message: 'Toast' }];

    const { rerender } = render(
      <ToastContainer toasts={toasts} onClose={mockOnClose} position="top-right" />
    );
    // Toast container renders in a portal, so check document.body
    let positionDiv = document.body.querySelector('.top-4.right-4');
    expect(positionDiv).toBeInTheDocument();

    rerender(
      <ToastContainer toasts={toasts} onClose={mockOnClose} position="bottom-left" />
    );
    positionDiv = document.body.querySelector('.bottom-4.left-4');
    expect(positionDiv).toBeInTheDocument();

    rerender(
      <ToastContainer toasts={toasts} onClose={mockOnClose} position="top-center" />
    );
    positionDiv = document.body.querySelector('.top-4');
    expect(positionDiv).toBeInTheDocument();
  });

  it('renders in a portal', () => {
    const toasts = [{ id: '1', type: 'success' as const, message: 'Toast' }];

    render(<ToastContainer toasts={toasts} onClose={mockOnClose} />);

    const toast = screen.getByText('Toast');
    // Toast container should be rendered directly under body
    expect(toast.closest('.fixed')).toBeInTheDocument();
  });

  it('passes custom duration to toasts', () => {
    const toasts = [
      { id: '1', type: 'success' as const, message: 'Toast', duration: 5000 },
    ];

    render(<ToastContainer toasts={toasts} onClose={mockOnClose} />);
    expect(screen.getByText('Toast')).toBeInTheDocument();
  });
});
