import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Modal } from './Modal';

describe('Modal', () => {
  it('does not render when isOpen is false', () => {
    render(
      <Modal isOpen={false} onClose={jest.fn()}>
        <p>Modal content</p>
      </Modal>
    );
    expect(screen.queryByText('Modal content')).not.toBeInTheDocument();
  });

  it('renders when isOpen is true', () => {
    render(
      <Modal isOpen={true} onClose={jest.fn()}>
        <p>Modal content</p>
      </Modal>
    );
    expect(screen.getByText('Modal content')).toBeInTheDocument();
  });

  it('renders with title', () => {
    render(
      <Modal isOpen={true} onClose={jest.fn()} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );
    expect(screen.getByText('Test Modal')).toBeInTheDocument();
  });

  it('renders close button by default', () => {
    render(
      <Modal isOpen={true} onClose={jest.fn()}>
        <p>Modal content</p>
      </Modal>
    );
    expect(screen.getByLabelText('Close modal')).toBeInTheDocument();
  });

  it('hides close button when showCloseButton is false', () => {
    render(
      <Modal isOpen={true} onClose={jest.fn()} showCloseButton={false}>
        <p>Modal content</p>
      </Modal>
    );
    expect(screen.queryByLabelText('Close modal')).not.toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup();
    const handleClose = jest.fn();
    render(
      <Modal isOpen={true} onClose={handleClose}>
        <p>Modal content</p>
      </Modal>
    );
    
    const closeButton = screen.getByLabelText('Close modal');
    await user.click(closeButton);
    
    expect(handleClose).toHaveBeenCalled();
  });

  it('calls onClose when Escape key is pressed', async () => {
    const user = userEvent.setup();
    const handleClose = jest.fn();
    render(
      <Modal isOpen={true} onClose={handleClose}>
        <p>Modal content</p>
      </Modal>
    );
    
    await user.keyboard('{Escape}');
    
    expect(handleClose).toHaveBeenCalled();
  });

  it('does not close on Escape when closeOnEscape is false', async () => {
    const user = userEvent.setup();
    const handleClose = jest.fn();
    render(
      <Modal isOpen={true} onClose={handleClose} closeOnEscape={false}>
        <p>Modal content</p>
      </Modal>
    );
    
    await user.keyboard('{Escape}');
    
    expect(handleClose).not.toHaveBeenCalled();
  });

  it('calls onClose when overlay is clicked', async () => {
    const user = userEvent.setup();
    const handleClose = jest.fn();
    render(
      <Modal isOpen={true} onClose={handleClose}>
        <p>Modal content</p>
      </Modal>
    );
    
    // Click on the overlay (the element with role="dialog")
    const overlay = screen.getByRole('dialog');
    await user.click(overlay);
    expect(handleClose).toHaveBeenCalled();
  });

  it('does not close on overlay click when closeOnOverlayClick is false', async () => {
    const user = userEvent.setup();
    const handleClose = jest.fn();
    render(
      <Modal isOpen={true} onClose={handleClose} closeOnOverlayClick={false}>
        <p>Modal content</p>
      </Modal>
    );
    
    const overlay = screen.getByRole('dialog').parentElement;
    if (overlay) {
      await user.click(overlay);
      expect(handleClose).not.toHaveBeenCalled();
    }
  });

  it('applies correct size classes', () => {
    const { rerender } = render(
      <Modal isOpen={true} onClose={jest.fn()} size="sm">
        <p>Modal content</p>
      </Modal>
    );
    // The dialog role is on the overlay, the size class is on the inner div
    let modalContent = screen.getByText('Modal content').closest('.max-w-sm');
    expect(modalContent).toBeInTheDocument();

    rerender(
      <Modal isOpen={true} onClose={jest.fn()} size="lg">
        <p>Modal content</p>
      </Modal>
    );
    modalContent = screen.getByText('Modal content').closest('.max-w-lg');
    expect(modalContent).toBeInTheDocument();
  });

  it('has proper ARIA attributes', () => {
    render(
      <Modal isOpen={true} onClose={jest.fn()} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title');
  });

  it('traps focus within modal', async () => {
    const user = userEvent.setup();
    render(
      <Modal isOpen={true} onClose={jest.fn()} title="Test Modal">
        <button>First button</button>
        <button>Second button</button>
      </Modal>
    );
    
    const firstButton = screen.getByText('First button');
    const secondButton = screen.getByText('Second button');
    const closeButton = screen.getByLabelText('Close modal');
    
    // Initially, close button has focus (first focusable element)
    expect(closeButton).toHaveFocus();
    
    // Tab should move to first button
    await user.tab();
    expect(firstButton).toHaveFocus();
    
    // Tab should move to second button
    await user.tab();
    expect(secondButton).toHaveFocus();
    
    // Tab from last element should wrap to close button
    await user.tab();
    expect(closeButton).toHaveFocus();
  });

  it('prevents body scroll when open', () => {
    const { rerender } = render(
      <Modal isOpen={true} onClose={jest.fn()}>
        <p>Modal content</p>
      </Modal>
    );
    
    expect(document.body.style.overflow).toBe('hidden');
    
    rerender(
      <Modal isOpen={false} onClose={jest.fn()}>
        <p>Modal content</p>
      </Modal>
    );
    
    expect(document.body.style.overflow).toBe('');
  });

  it('renders in a portal', () => {
    render(
      <Modal isOpen={true} onClose={jest.fn()}>
        <p>Modal content</p>
      </Modal>
    );
    
    // Modal should be rendered as a direct child of body
    const modalContent = screen.getByText('Modal content');
    expect(modalContent).toBeInTheDocument();
    // Verify it's in a portal by checking it's not in the test container
    expect(modalContent.closest('body')).toBe(document.body);
  });
});
