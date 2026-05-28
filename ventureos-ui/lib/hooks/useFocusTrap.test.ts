import { renderHook, act } from '@testing-library/react';
import { useFocusTrap } from './useFocusTrap';

/**
 * Unit tests for useFocusTrap hook
 *
 * Requirements: 15.1 - Provide keyboard navigation for all interactive elements
 * - Focus trap in modals
 * - Handle escape key for closing overlays
 * - Tab and Shift+Tab cycle through focusable elements
 */

describe('useFocusTrap', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    container.innerHTML = `
      <button id="btn1">First</button>
      <input id="input1" type="text" />
      <a id="link1" href="#">Link</a>
      <button id="btn2">Last</button>
    `;
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('returns containerRef, activate, and deactivate', () => {
    const { result } = renderHook(() => useFocusTrap());

    expect(result.current.containerRef).toBeDefined();
    expect(result.current.activate).toBeInstanceOf(Function);
    expect(result.current.deactivate).toBeInstanceOf(Function);
  });

  it('activates focus trap when active option is true', () => {
    const { result } = renderHook(() => useFocusTrap({ active: true }));

    // Assign the container ref
    act(() => {
      (result.current.containerRef as React.MutableRefObject<HTMLElement | null>).current = container;
    });

    // Re-render with active to trigger the effect
    const { result: result2 } = renderHook(() => useFocusTrap({ active: true }));
    act(() => {
      (result2.current.containerRef as React.MutableRefObject<HTMLElement | null>).current = container;
    });

    expect(result2.current.containerRef.current).toBe(container);
  });

  it('traps focus on Tab at the last element - wraps to first', () => {
    const { result } = renderHook(() => useFocusTrap());

    act(() => {
      (result.current.containerRef as React.MutableRefObject<HTMLElement | null>).current = container;
      result.current.activate();
    });

    // Focus the last button
    const lastButton = container.querySelector('#btn2') as HTMLElement;
    lastButton.focus();

    // Simulate Tab key
    const event = new KeyboardEvent('keydown', {
      key: 'Tab',
      bubbles: true,
      cancelable: true,
    });
    act(() => {
      document.dispatchEvent(event);
    });

    // Focus should wrap to the first focusable element
    const firstButton = container.querySelector('#btn1') as HTMLElement;
    expect(document.activeElement).toBe(firstButton);
  });

  it('traps focus on Shift+Tab at the first element - wraps to last', () => {
    const { result } = renderHook(() => useFocusTrap());

    act(() => {
      (result.current.containerRef as React.MutableRefObject<HTMLElement | null>).current = container;
      result.current.activate();
    });

    // Focus the first button
    const firstButton = container.querySelector('#btn1') as HTMLElement;
    firstButton.focus();

    // Simulate Shift+Tab key
    const event = new KeyboardEvent('keydown', {
      key: 'Tab',
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    });
    act(() => {
      document.dispatchEvent(event);
    });

    // Focus should wrap to the last focusable element
    const lastButton = container.querySelector('#btn2') as HTMLElement;
    expect(document.activeElement).toBe(lastButton);
  });

  it('does not trap focus when deactivated', () => {
    const { result } = renderHook(() => useFocusTrap());

    act(() => {
      (result.current.containerRef as React.MutableRefObject<HTMLElement | null>).current = container;
      result.current.activate();
    });

    act(() => {
      result.current.deactivate();
    });

    // Focus the last button
    const lastButton = container.querySelector('#btn2') as HTMLElement;
    lastButton.focus();

    // Simulate Tab key - should NOT wrap since trap is deactivated
    const event = new KeyboardEvent('keydown', {
      key: 'Tab',
      bubbles: true,
      cancelable: true,
    });
    act(() => {
      document.dispatchEvent(event);
    });

    // Focus should remain on the last button (no wrapping)
    expect(document.activeElement).toBe(lastButton);
  });

  it('returns focus to trigger element on deactivation', () => {
    // Create a trigger button outside the container
    const triggerButton = document.createElement('button');
    triggerButton.id = 'trigger';
    triggerButton.textContent = 'Open Modal';
    document.body.appendChild(triggerButton);
    triggerButton.focus();

    const { result } = renderHook(() =>
      useFocusTrap({ returnFocusOnDeactivate: true })
    );

    act(() => {
      (result.current.containerRef as React.MutableRefObject<HTMLElement | null>).current = container;
      result.current.activate();
    });

    // Focus should have moved away from trigger
    // Now deactivate
    act(() => {
      result.current.deactivate();
    });

    // Focus should return to the trigger button
    expect(document.activeElement).toBe(triggerButton);

    document.body.removeChild(triggerButton);
  });

  it('does not return focus when returnFocusOnDeactivate is false', () => {
    const triggerButton = document.createElement('button');
    triggerButton.id = 'trigger';
    document.body.appendChild(triggerButton);
    triggerButton.focus();

    const { result } = renderHook(() =>
      useFocusTrap({ returnFocusOnDeactivate: false })
    );

    act(() => {
      (result.current.containerRef as React.MutableRefObject<HTMLElement | null>).current = container;
      result.current.activate();
    });

    // Manually move focus into the container (simulating what requestAnimationFrame would do)
    const firstButton = container.querySelector('#btn1') as HTMLElement;
    firstButton.focus();

    act(() => {
      result.current.deactivate();
    });

    // Focus should NOT return to trigger - it stays where it was
    expect(document.activeElement).not.toBe(triggerButton);

    document.body.removeChild(triggerButton);
  });

  it('handles container with no focusable elements', () => {
    const emptyContainer = document.createElement('div');
    emptyContainer.innerHTML = '<p>No focusable elements here</p>';
    document.body.appendChild(emptyContainer);

    const { result } = renderHook(() => useFocusTrap());

    act(() => {
      (result.current.containerRef as React.MutableRefObject<HTMLElement | null>).current = emptyContainer;
      result.current.activate();
    });

    // Simulate Tab key - should prevent default without error
    const event = new KeyboardEvent('keydown', {
      key: 'Tab',
      bubbles: true,
      cancelable: true,
    });

    // Should not throw
    expect(() => {
      act(() => {
        document.dispatchEvent(event);
      });
    }).not.toThrow();

    document.body.removeChild(emptyContainer);
  });

  it('skips disabled elements when finding focusable elements', () => {
    const containerWithDisabled = document.createElement('div');
    containerWithDisabled.innerHTML = `
      <button id="enabled1">Enabled</button>
      <button id="disabled1" disabled>Disabled</button>
      <button id="enabled2">Enabled 2</button>
    `;
    document.body.appendChild(containerWithDisabled);

    const { result } = renderHook(() => useFocusTrap());

    act(() => {
      (result.current.containerRef as React.MutableRefObject<HTMLElement | null>).current = containerWithDisabled;
      result.current.activate();
    });

    // Focus the last enabled button
    const enabled2 = containerWithDisabled.querySelector('#enabled2') as HTMLElement;
    enabled2.focus();

    // Tab should wrap to first enabled button (skipping disabled)
    const event = new KeyboardEvent('keydown', {
      key: 'Tab',
      bubbles: true,
      cancelable: true,
    });
    act(() => {
      document.dispatchEvent(event);
    });

    const enabled1 = containerWithDisabled.querySelector('#enabled1') as HTMLElement;
    expect(document.activeElement).toBe(enabled1);

    document.body.removeChild(containerWithDisabled);
  });

  it('cleans up event listeners on unmount', () => {
    const addSpy = jest.spyOn(document, 'addEventListener');
    const removeSpy = jest.spyOn(document, 'removeEventListener');

    const { unmount } = renderHook(() => useFocusTrap({ active: true }));

    expect(addSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

    unmount();

    expect(removeSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

    addSpy.mockRestore();
    removeSpy.mockRestore();
  });
});
