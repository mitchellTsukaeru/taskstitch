// @vitest-environment happy-dom

import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GuideProgressScreen } from '../GuideProgressScreen';

describe('GuideProgressScreen', () => {
  afterEach(() => vi.useRealTimers());

  it('moves through honest indeterminate review phases', () => {
    vi.useFakeTimers();
    render(<GuideProgressScreen />);

    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Reading your steps');
    act(() => vi.advanceTimersByTime(1_800));
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Checking the context');
    act(() => vi.advanceTimersByTime(3_000));
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Preparing suggestions');
  });
});
