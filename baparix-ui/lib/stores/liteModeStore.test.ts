import { act } from '@testing-library/react';
import { useLiteModeStore } from './liteModeStore';

describe('liteModeStore', () => {
  beforeEach(() => {
    localStorage.clear();
    // Reset store state between tests
    act(() => {
      useLiteModeStore.setState({ isLiteMode: false });
    });
  });

  it('should have isLiteMode disabled by default', () => {
    const state = useLiteModeStore.getState();
    expect(state.isLiteMode).toBe(false);
  });

  it('should toggle lite mode on', () => {
    act(() => {
      useLiteModeStore.getState().toggleLiteMode();
    });
    expect(useLiteModeStore.getState().isLiteMode).toBe(true);
  });

  it('should toggle lite mode off after toggling on', () => {
    act(() => {
      useLiteModeStore.getState().toggleLiteMode();
    });
    expect(useLiteModeStore.getState().isLiteMode).toBe(true);

    act(() => {
      useLiteModeStore.getState().toggleLiteMode();
    });
    expect(useLiteModeStore.getState().isLiteMode).toBe(false);
  });

  it('should set lite mode to true with setLiteMode', () => {
    act(() => {
      useLiteModeStore.getState().setLiteMode(true);
    });
    expect(useLiteModeStore.getState().isLiteMode).toBe(true);
  });

  it('should set lite mode to false with setLiteMode', () => {
    act(() => {
      useLiteModeStore.getState().setLiteMode(true);
    });
    act(() => {
      useLiteModeStore.getState().setLiteMode(false);
    });
    expect(useLiteModeStore.getState().isLiteMode).toBe(false);
  });

  it('should persist state to localStorage', () => {
    act(() => {
      useLiteModeStore.getState().setLiteMode(true);
    });

    const stored = localStorage.getItem('ventureos-lite-mode');
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored!);
    expect(parsed.state.isLiteMode).toBe(true);
  });

  it('should restore state from localStorage', async () => {
    localStorage.setItem(
      'ventureos-lite-mode',
      JSON.stringify({ state: { isLiteMode: true }, version: 0 })
    );

    await act(async () => {
      await useLiteModeStore.persist.rehydrate();
    });

    expect(useLiteModeStore.getState().isLiteMode).toBe(true);
  });
});
