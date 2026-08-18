// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { exportGuideAsMarkdown } from '@/core/export/markdown-export';
import { renderScreenshotVariants } from '@/core/export/screenshot-renderer';
import type { Guide, Screenshot, Step } from '@/core/guides/types';

vi.mock('@/core/export/screenshot-renderer', () => ({
  renderScreenshotVariants: vi.fn(),
}));

function makeGuide(overrides: Partial<Guide> = {}): Guide {
  return {
    id: 'guide-1',
    title: 'Test Guide',
    createdAt: new Date('2025-06-01T00:00:00Z').getTime(),
    updatedAt: new Date('2025-06-01T00:00:00Z').getTime(),
    stepIds: [],
    starred: false,
    deletedAt: null,
    ...overrides,
  };
}

function makeStep(overrides: Partial<Step> = {}): Step {
  return {
    id: 'step-1',
    guideId: 'guide-1',
    index: 0,
    description: 'Click the button',
    action: 'click',
    url: 'https://example.com',
    timestamp: Date.now(),
    ...overrides,
  };
}

function makeScreenshot(stepId: string, content = 'img'): Screenshot {
  return {
    id: `ss-${stepId}`,
    stepId,
    blob: new Blob([content], { type: 'image/png' }),
    mimeType: 'image/png',
    width: 800,
    height: 600,
  };
}

describe('exportGuideAsMarkdown', () => {
  beforeEach(() => {
    vi.mocked(renderScreenshotVariants).mockImplementation(async (screenshot) => ({
      fullBlob: screenshot.blob,
      croppedBlob: null,
    }));
  });

  it('creates valid markdown with H1 title', async () => {
    const guide = makeGuide({ title: 'My Guide' });
    const steps = [makeStep()];
    const screenshots = new Map<string, Screenshot>();

    const md = await exportGuideAsMarkdown(guide, steps, screenshots);
    expect(md).toMatch(/^# My Guide\n/);
  });

  it('includes metadata line with step count and created date', async () => {
    const guide = makeGuide();
    const steps = [makeStep(), makeStep({ id: 'step-2', index: 1, description: 'Type text' })];
    const screenshots = new Map<string, Screenshot>();

    const md = await exportGuideAsMarkdown(guide, steps, screenshots);
    expect(md).toContain('export.stepsCount[2]');
    expect(md).toContain('export.createdLabel[');
  });

  it('includes portable Guide Me instructions and the safety classification', async () => {
    const guide = makeGuide({
      title: 'Change Billing Contact',
      impact: 'makes_changes',
      impactNote: 'Uses production.',
    });
    const md = await exportGuideAsMarkdown(guide, [makeStep()], new Map());

    expect(md).toContain('**Add interactive guide file here**');
    expect(md).toContain('Drag and drop `Change-Billing-Contact.taskstitch` here');
    expect(md).not.toContain('[Change-Billing-Contact.taskstitch](');
    expect(md).toContain('Safety: Makes changes');
    expect(md).toContain('Uses production.');
  });

  it('renders domain-like portable filenames as attachment placeholders instead of links', async () => {
    const guide = makeGuide({ title: 'Guide on tora.tsukaeru.ne.jp' });
    const md = await exportGuideAsMarkdown(guide, [makeStep()], new Map());

    expect(md).toContain('Drag and drop `Guide-on-tora-tsukaeru-ne-jp.taskstitch` here');
    expect(md).not.toContain('[Guide-on-tora-tsukaeru-ne-jp.taskstitch](');
  });

  it('includes step descriptions with padded step numbers', async () => {
    const guide = makeGuide();
    const steps = [
      makeStep({ index: 0, description: 'First action' }),
      makeStep({ id: 'step-2', index: 1, description: 'Second action' }),
    ];
    const screenshots = new Map<string, Screenshot>();

    const md = await exportGuideAsMarkdown(guide, steps, screenshots);
    expect(md).toContain('## export.stepLabel[01]: First action');
    expect(md).toContain('## export.stepLabel[02]: Second action');
  });

  it('includes source domain when steps have URLs', async () => {
    const guide = makeGuide();
    const steps = [makeStep({ url: 'https://www.example.com/page' })];
    const screenshots = new Map<string, Screenshot>();

    const md = await exportGuideAsMarkdown(guide, steps, screenshots);
    expect(md).toContain('export.sourceLabel[example.com]');
  });

  it('handles guide with no steps', async () => {
    const guide = makeGuide();
    const md = await exportGuideAsMarkdown(guide, [], new Map());

    expect(md).toContain('# Test Guide');
    expect(md).toContain('export.stepsCount[0]');
    expect(md).not.toContain('## export.stepLabel');
  });

  it('handles steps without screenshots', async () => {
    const guide = makeGuide();
    const steps = [makeStep()];
    const screenshots = new Map<string, Screenshot>();

    const md = await exportGuideAsMarkdown(guide, steps, screenshots);
    expect(md).toContain('## export.stepLabel[01]: Click the button');
    expect(md).not.toContain('![');
  });

  it('embeds screenshot as base64 data URL in markdown image', async () => {
    const guide = makeGuide();
    const step = makeStep();
    const steps = [step];
    const ss = makeScreenshot(step.id, 'pixel-data');
    const screenshots = new Map<string, Screenshot>([[step.id, ss]]);

    const md = await exportGuideAsMarkdown(guide, steps, screenshots);
    expect(md).toContain('![export.stepLabel[01]](data:image/png;base64,');
    const b64 = btoa('pixel-data');
    expect(md).toContain(b64);
  });

  it('embeds the cropped rendered screenshot shown by the guide', async () => {
    const guide = makeGuide();
    const step = makeStep();
    const screenshot = makeScreenshot(step.id, 'original-image');
    const croppedBlob = new Blob(['cropped-image'], { type: 'image/jpeg' });
    vi.mocked(renderScreenshotVariants).mockResolvedValue({
      fullBlob: new Blob(['rendered-full-image'], { type: 'image/jpeg' }),
      croppedBlob,
    });

    const md = await exportGuideAsMarkdown(guide, [step], new Map([[step.id, screenshot]]));

    expect(renderScreenshotVariants).toHaveBeenCalledWith(screenshot, { type: 'image/jpeg', quality: 0.9 });
    expect(md).toContain(`data:image/jpeg;base64,${btoa('cropped-image')}`);
    expect(md).not.toContain(btoa('original-image'));
    expect(md).not.toContain(btoa('rendered-full-image'));
  });
});
