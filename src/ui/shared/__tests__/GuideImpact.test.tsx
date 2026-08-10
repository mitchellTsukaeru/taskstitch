// @vitest-environment happy-dom

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Guide } from '@/core/guides/types';
import { GuideImpactBadge, GuideImpactDialog } from '../GuideImpact';

const { updateGuideImpact } = vi.hoisted(() => ({
  updateGuideImpact: vi.fn(),
}));

vi.mock('@/core/guides/service', () => ({ updateGuideImpact }));

const guide: Guide = {
  id: 'guide-1',
  title: 'Provision a test customer',
  createdAt: 1,
  updatedAt: 1,
  stepIds: ['step-1'],
  starred: false,
  deletedAt: null,
  impact: 'unknown',
};

describe('guide safety classification', () => {
  beforeEach(() => {
    updateGuideImpact.mockReset();
    updateGuideImpact.mockResolvedValue(undefined);
  });

  it('shows an editable not-classified badge', () => {
    const onClick = vi.fn();
    render(<GuideImpactBadge impact="unknown" onClick={onClick} />);

    fireEvent.click(screen.getByRole('button', { name: 'Safety: Not classified. Edit classification' }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('requires a classification and persists the selected impact and note', async () => {
    const onClose = vi.fn();
    const onSaved = vi.fn();
    render(<GuideImpactDialog guide={guide} onClose={onClose} onSaved={onSaved} />);

    expect(screen.getByRole('button', { name: 'Save classification' })).toBeDisabled();
    fireEvent.click(screen.getByRole('radio', { name: /Makes changes/ }));
    fireEvent.change(screen.getByPlaceholderText('Example: Creates a test customer in the AU sandbox.'), {
      target: { value: 'Creates a customer in the AU sandbox.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save classification' }));

    await waitFor(() => {
      expect(updateGuideImpact).toHaveBeenCalledWith(
        'guide-1',
        'makes_changes',
        'Creates a customer in the AU sandbox.',
      );
      expect(onSaved).toHaveBeenCalledWith('makes_changes', 'Creates a customer in the AU sandbox.');
      expect(onClose).toHaveBeenCalledOnce();
    });
  });
});
