// @vitest-environment happy-dom

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Guide, Step } from '@/core/guides/types';
import { GuideDestinationDialog } from '../GuideDestinationDialog';
import { GuideMeStartDialog } from '../GuideMeStartDialog';

const mocks = vi.hoisted(() => ({
  updateGuideOriginMapping: vi.fn(),
  sendMessage: vi.fn(),
}));

vi.mock('@/core/guides/service', () => ({ updateGuideOriginMapping: mocks.updateGuideOriginMapping }));
vi.mock('@/lib/messaging', () => ({ sendMessage: mocks.sendMessage }));

const guide: Guide = {
  id: 'guide-1',
  title: 'Create a customer account',
  createdAt: 1,
  updatedAt: 1,
  stepIds: ['step-1', 'step-2'],
  starred: false,
  deletedAt: null,
  impact: 'read_only',
  guideMeOrigins: { 'https://stg.example.com': 'https://example.com' },
};

const steps: Step[] = [
  {
    id: 'step-1',
    guideId: guide.id,
    index: 0,
    description: 'Open customers',
    action: 'click',
    url: 'https://stg.example.com/customers/new',
    timestamp: 1,
  },
  {
    id: 'step-2',
    guideId: guide.id,
    index: 1,
    description: 'Sign in',
    action: 'click',
    url: 'https://login.example.net/',
    timestamp: 2,
  },
];

describe('Guide Me destinations', () => {
  beforeEach(() => {
    mocks.updateGuideOriginMapping.mockReset();
    mocks.updateGuideOriginMapping.mockResolvedValue(undefined);
    mocks.sendMessage.mockReset();
    mocks.sendMessage.mockResolvedValue({ started: true });
  });

  it('lets the creator change an origin and previews the preserved path', async () => {
    const onClose = vi.fn();
    const onSaved = vi.fn();
    render(<GuideDestinationDialog guide={guide} steps={steps} onClose={onClose} onSaved={onSaved} />);

    fireEvent.change(screen.getByLabelText('Run Guide Me on'), {
      target: { value: 'https://production.example.com' },
    });
    expect(screen.getByText('https://production.example.com/customers/new')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Save destination' }));

    await waitFor(() => {
      expect(mocks.updateGuideOriginMapping).toHaveBeenCalledWith(
        guide.id,
        'https://stg.example.com',
        'https://production.example.com',
      );
      expect(onSaved).toHaveBeenCalledWith({ 'https://stg.example.com': 'https://production.example.com' });
      expect(onClose).toHaveBeenCalledOnce();
    });
  });

  it('shows runners final destinations without an editable URL field', async () => {
    const onStarted = vi.fn();
    render(<GuideMeStartDialog guide={guide} steps={steps} onClose={vi.fn()} onStarted={onStarted} />);

    expect(screen.getByText('https://example.com/customers/new')).toBeInTheDocument();
    expect(screen.getByText('example.com')).toBeInTheDocument();
    expect(screen.getByText('login.example.net')).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Start Guide Me' }));
    await waitFor(() => {
      expect(mocks.sendMessage).toHaveBeenCalledWith('startGuideMe', {
        guideId: guide.id,
        confirmedImpact: undefined,
      });
      expect(onStarted).toHaveBeenCalledOnce();
    });
  });
});
