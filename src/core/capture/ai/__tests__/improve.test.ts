import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Guide, Screenshot, Step } from '@/core/guides/types';
import { improveGuide, selectRepresentativeSteps, selectTextSteps } from '../improve';

const mocks = vi.hoisted(() => ({
  createModel: vi.fn(() => ({ id: 'test-model' })),
  generateText: vi.fn(),
}));

vi.mock('ai', () => ({ generateText: mocks.generateText }));
vi.mock('../provider', () => ({ createModel: mocks.createModel }));

function selectionStep(index: number, host = 'one.example', screenshot = true): Step {
  return {
    id: `step-${index}`,
    guideId: 'guide-1',
    index,
    description: `Step ${index}`,
    action: 'click',
    url: `https://${host}/page/${index}`,
    timestamp: index,
    screenshotId: screenshot ? `shot-${index}` : undefined,
  };
}

function screenshot(item: Step): Screenshot {
  return {
    id: item.screenshotId!,
    stepId: item.id,
    blob: new Blob(['image'], { type: 'image/jpeg' }),
    mimeType: 'image/jpeg',
    width: 100,
    height: 100,
  };
}

describe('Improve guide context selection', () => {
  it('keeps complete sequences up to 100 steps', () => {
    const steps = Array.from({ length: 100 }, (_, index) => selectionStep(index));
    expect(selectTextSteps(steps)).toEqual(steps);
  });

  it('keeps the first 40, last 40, sampled middle, and hostname transitions for long guides', () => {
    const steps = Array.from({ length: 140 }, (_, index) =>
      selectionStep(index, index >= 71 ? 'two.example' : 'one.example'),
    );
    const selected = selectTextSteps(steps);

    expect(selected.slice(0, 40).map((item) => item.index)).toEqual(Array.from({ length: 40 }, (_, index) => index));
    expect(selected.map((item) => item.index)).toContain(71);
    expect(selected.slice(-40).map((item) => item.index)).toEqual(
      Array.from({ length: 40 }, (_, index) => index + 100),
    );
  });

  it('selects at most eight frames including first, last, and hostname transitions', () => {
    const steps = Array.from({ length: 20 }, (_, index) =>
      selectionStep(index, index >= 9 ? 'two.example' : 'one.example'),
    );
    const screenshots = new Map(steps.map((item) => [item.id, screenshot(item)]));
    const selected = selectRepresentativeSteps(steps, screenshots);

    expect(selected).toHaveLength(8);
    expect(selected.map((item) => item.index)).toEqual(expect.arrayContaining([0, 9, 19]));
  });
});

const guide: Guide = {
  id: 'guide-1',
  title: 'Old title',
  createdAt: 1,
  updatedAt: 1,
  stepIds: ['step-1'],
  starred: false,
  deletedAt: null,
};

const steps: Step[] = [
  {
    id: 'step-1',
    guideId: guide.id,
    index: 0,
    description: 'Click button',
    action: 'click',
    url: 'https://example.test/settings',
    timestamp: 1,
  },
];

describe('improveGuide', () => {
  beforeEach(() => {
    mocks.createModel.mockClear();
    mocks.generateText.mockReset();
  });

  it('accepts GLM-style reasoning text around the JSON proposal', async () => {
    mocks.generateText.mockResolvedValue({
      text: '<think>I should improve {this guide} carefully.</think>\n```json\n{"title":"Update settings","descriptions":[{"stepId":"step-1","proposed":"Select the settings button"}]}\n```',
    });

    await expect(
      improveGuide(
        guide,
        steps,
        new Map(),
        { apiKey: 'key', provider: 'openai', model: 'glm-4.5', baseUrl: 'https://api.z.ai/api/paas/v4' },
        false,
      ),
    ).resolves.toMatchObject({
      proposedTitle: 'Update settings',
      descriptions: [{ stepId: 'step-1', proposed: 'Select the settings button' }],
    });
  });

  it('gives thinking models enough output budget to reach the JSON answer', async () => {
    mocks.generateText.mockResolvedValue({ text: '{"title":"Update settings","descriptions":[]}' });

    await improveGuide(
      guide,
      steps,
      new Map(),
      { apiKey: 'key', provider: 'openai', model: 'glm-4.5', baseUrl: 'https://api.z.ai/api/paas/v4' },
      false,
    );

    expect(mocks.generateText).toHaveBeenCalledWith(expect.objectContaining({ maxOutputTokens: 2_000 }));
  });
});
