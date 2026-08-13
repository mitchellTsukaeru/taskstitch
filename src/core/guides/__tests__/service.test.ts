import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { broadcastMessages } = vi.hoisted(() => {
  const broadcastMessages: Array<unknown> = [];

  globalThis.BroadcastChannel = class BroadcastChannel {
    name: string;
    constructor(name: string) {
      this.name = name;
    }
    postMessage(data: unknown) {
      broadcastMessages.push(data);
    }
    addEventListener() {}
    removeEventListener() {}
    close() {}
    onmessage = null;
    onmessageerror = null;
    dispatchEvent() {
      return true;
    }
  } as unknown as typeof BroadcastChannel;

  return { broadcastMessages };
});

import { completeTranslationJob, createTranslationJob, updateTranslationJob } from '@/core/translation/service';
import { db } from '../db';
import {
  addStepToGuide,
  applyGuideImprovements,
  createGuide,
  deleteStep,
  getGuide,
  getGuides,
  getStarredGuides,
  getTrashedGuides,
  insertManualStep,
  permanentlyDeleteGuide,
  reorderSteps,
  softDeleteGuide,
  toggleStar,
  updateGuideDefaultTitle,
  updateGuideOriginMapping,
  updateGuideTitle,
  updateScreenshotBlob,
  updateStepRichDescription,
} from '../service';
import type { Guide, Screenshot, Step } from '../types';

function makeStep(overrides: Partial<Step> & { id: string; guideId: string }): Step {
  return {
    index: 0,
    description: 'Test step',
    action: 'click',
    url: 'https://example.com',
    timestamp: Date.now(),
    ...overrides,
  };
}

function makeScreenshot(overrides: Partial<Screenshot> & { id: string; stepId: string }): Screenshot {
  return {
    blob: new Blob(['img'], { type: 'image/png' }),
    mimeType: 'image/png',
    width: 800,
    height: 600,
    ...overrides,
  };
}

async function seedGuide(id: string, extras?: Partial<Guide>): Promise<Guide> {
  const guide: Guide = {
    id,
    title: 'Test Guide',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    stepIds: [],
    starred: false,
    deletedAt: null,
    ...extras,
  };
  await db.guides.add(guide);
  return guide;
}

beforeEach(async () => {
  broadcastMessages.length = 0;
});

afterEach(async () => {
  await db.guides.clear();
  await db.steps.clear();
  await db.screenshots.clear();
  await db.translationJobs.clear();
});

describe('createGuide', () => {
  it('creates a guide with correct defaults', async () => {
    const guide = await createGuide('g1');

    expect(guide.id).toBe('g1');
    expect(guide.title).toBe('fullview.untitledGuide');
    expect(guide.stepIds).toEqual([]);
    expect(guide.starred).toBe(false);
    expect(guide.deletedAt).toBeNull();
    expect(guide.createdAt).toBeTypeOf('number');
    expect(guide.updatedAt).toBeTypeOf('number');

    const stored = await db.guides.get('g1');
    expect(stored).toEqual(guide);
  });
});

describe('deterministic titles', () => {
  it('does not replace a title after the user edits it', async () => {
    await createGuide('g1');
    await updateGuideDefaultTitle('g1', 'Guide on example.com');
    expect((await db.guides.get('g1'))?.title).toBe('Guide on example.com');

    await updateGuideTitle('g1', 'My account setup');
    await updateGuideDefaultTitle('g1', 'Multi-site guide');
    expect(await db.guides.get('g1')).toMatchObject({ title: 'My account setup', titleEdited: true });
  });
});

describe('Guide Me destination mappings', () => {
  it('stores only origin changes for sites recorded in the guide', async () => {
    await seedGuide('g1', { stepIds: ['s1'] });
    await db.steps.add(makeStep({ id: 's1', guideId: 'g1', url: 'https://stg.example.com/customers/new' }));

    await updateGuideOriginMapping('g1', 'https://stg.example.com/path', 'https://example.com/another-path');
    expect((await db.guides.get('g1'))?.guideMeOrigins).toEqual({
      'https://stg.example.com': 'https://example.com',
    });

    await updateGuideOriginMapping('g1', 'https://stg.example.com', 'https://stg.example.com');
    expect((await db.guides.get('g1'))?.guideMeOrigins).toBeUndefined();
  });

  it('rejects mappings for sites not used by the guide', async () => {
    await seedGuide('g1', { stepIds: ['s1'] });
    await db.steps.add(makeStep({ id: 's1', guideId: 'g1', url: 'https://example.com' }));

    await expect(updateGuideOriginMapping('g1', 'https://other.example.com', 'https://example.com')).rejects.toThrow(
      'not used',
    );
  });

  it('rejects HTTPS to HTTP destination downgrades', async () => {
    await seedGuide('g1', { stepIds: ['s1'] });
    await db.steps.add(makeStep({ id: 's1', guideId: 'g1', url: 'https://secure.example.com' }));

    await expect(
      updateGuideOriginMapping('g1', 'https://secure.example.com', 'http://insecure.example.com'),
    ).rejects.toThrow('insecure HTTP');
  });
});

describe('manual and rich steps', () => {
  it('inserts a manual step and screenshot atomically between captured steps', async () => {
    await seedGuide('g1', { stepIds: ['s1', 's2'] });
    await db.steps.bulkAdd([
      makeStep({ id: 's1', guideId: 'g1', index: 0 }),
      makeStep({ id: 's2', guideId: 'g1', index: 1 }),
    ]);
    const richDescription = {
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'Check the result', marks: [{ type: 'bold' }] }] },
      ],
    };

    const manual = await insertManualStep('g1', 1, richDescription, {
      blob: new Blob(['normalized'], { type: 'image/jpeg' }),
      mimeType: 'image/jpeg',
      width: 640,
      height: 480,
    });

    expect(manual).toMatchObject({ kind: 'manual', action: 'manual', index: 1, description: 'Check the result' });
    expect((await db.steps.where('guideId').equals('g1').sortBy('index')).map((step) => step.id)).toEqual([
      's1',
      manual.id,
      's2',
    ]);
    expect((await db.guides.get('g1'))?.stepIds).toEqual(['s1', manual.id, 's2']);
    expect(await db.screenshots.get(manual.screenshotId!)).toMatchObject({ stepId: manual.id, mimeType: 'image/jpeg' });
  });

  it('keeps the plain-text projection synchronized with rich content', async () => {
    await seedGuide('g1', { stepIds: ['s1'] });
    await db.steps.add(makeStep({ id: 's1', guideId: 'g1' }));
    await updateStepRichDescription('s1', {
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'First line' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Second line' }] },
      ],
    });

    expect((await db.steps.get('s1'))?.description).toBe('First line\nSecond line');
  });
});

describe('reviewed AI changes', () => {
  it('applies only proposals whose original content is still current', async () => {
    await seedGuide('g1', { title: 'Original', stepIds: ['s1', 's2'] });
    await db.steps.bulkAdd([
      makeStep({ id: 's1', guideId: 'g1', description: 'Original one' }),
      makeStep({ id: 's2', guideId: 'g1', index: 1, description: 'Edited while waiting' }),
    ]);

    await applyGuideImprovements('g1', 'Original', 'Specific workflow', [
      { stepId: 's1', original: 'Original one', proposed: 'Open settings' },
      { stepId: 's2', original: 'Old two', proposed: 'Save changes' },
    ]);

    expect(await db.guides.get('g1')).toMatchObject({ title: 'Specific workflow', titleEdited: true });
    expect((await db.steps.get('s1'))?.description).toBe('Open settings');
    expect((await db.steps.get('s2'))?.description).toBe('Edited while waiting');
  });
});

describe('getGuide', () => {
  it('returns guide with steps and screenshots', async () => {
    await seedGuide('g1', { stepIds: ['s1', 's2'] });
    const step1 = makeStep({ id: 's1', guideId: 'g1', index: 0, screenshotId: 'sc1' });
    const step2 = makeStep({ id: 's2', guideId: 'g1', index: 1, screenshotId: 'sc2' });
    await db.steps.bulkAdd([step1, step2]);
    const sc1 = makeScreenshot({ id: 'sc1', stepId: 's1' });
    const sc2 = makeScreenshot({ id: 'sc2', stepId: 's2' });
    await db.screenshots.bulkAdd([sc1, sc2]);

    const result = await getGuide('g1');

    expect(result).not.toBeNull();
    expect(result!.guide.id).toBe('g1');
    expect(result!.steps).toHaveLength(2);
    expect(result!.steps[0].id).toBe('s1');
    expect(result!.steps[1].id).toBe('s2');
    expect(result!.screenshots.size).toBe(2);
    expect(result!.screenshots.get('s1')).toBeDefined();
    expect(result!.screenshots.get('s2')).toBeDefined();
  });

  it('returns null for non-existent guide', async () => {
    const result = await getGuide('nope');
    expect(result).toBeNull();
  });
});

describe('addStepToGuide', () => {
  it('appends stepId and updates timestamp', async () => {
    const guide = await seedGuide('g1');
    const beforeUpdate = guide.updatedAt;

    await addStepToGuide('g1', 's1');

    const updated = await db.guides.get('g1');
    expect(updated!.stepIds).toEqual(['s1']);
    expect(updated!.updatedAt).toBeGreaterThanOrEqual(beforeUpdate);

    await addStepToGuide('g1', 's2');
    const updated2 = await db.guides.get('g1');
    expect(updated2!.stepIds).toEqual(['s1', 's2']);
  });
});

describe('deleteStep', () => {
  it('removes step, re-indexes remaining, cleans up screenshot', async () => {
    await seedGuide('g1', { stepIds: ['s1', 's2', 's3'] });
    await db.steps.bulkAdd([
      makeStep({ id: 's1', guideId: 'g1', index: 0, screenshotId: 'sc1' }),
      makeStep({ id: 's2', guideId: 'g1', index: 1 }),
      makeStep({ id: 's3', guideId: 'g1', index: 2 }),
    ]);
    await db.screenshots.add(makeScreenshot({ id: 'sc1', stepId: 's1' }));

    await deleteStep('g1', 's1');

    expect(await db.steps.get('s1')).toBeUndefined();
    expect(await db.screenshots.get('sc1')).toBeUndefined();

    const guide = await db.guides.get('g1');
    expect(guide!.stepIds).toEqual(['s2', 's3']);

    const remaining = await db.steps.where('guideId').equals('g1').sortBy('index');
    expect(remaining[0].index).toBe(0);
    expect(remaining[1].index).toBe(1);
  });

  it('keeps a screenshot while another translated step references it', async () => {
    await seedGuide('g1', { stepIds: ['s1'] });
    await seedGuide('g2', { stepIds: ['s2'], sourceGuideId: 'g1', language: 'ja' });
    await db.steps.bulkAdd([
      makeStep({ id: 's1', guideId: 'g1', screenshotId: 'shared' }),
      makeStep({ id: 's2', guideId: 'g2', screenshotId: 'shared' }),
    ]);
    await db.screenshots.add(makeScreenshot({ id: 'shared', stepId: 's1' }));

    await deleteStep('g2', 's2');

    expect(await db.screenshots.get('shared')).toBeDefined();
  });
});

describe('translated copies', () => {
  it('creates an independent guide while reusing local screenshot assets', async () => {
    const source = await seedGuide('g1', { title: 'Update profile', stepIds: ['s1'] });
    const sourceStep = makeStep({
      id: 's1',
      guideId: 'g1',
      description: 'Click Save changes',
      screenshotId: 'shared',
    });
    await db.steps.add(sourceStep);
    await db.screenshots.add(makeScreenshot({ id: 'shared', stepId: 's1' }));
    const job = await createTranslationJob(source, [sourceStep], 'ja');
    await updateTranslationJob(job.id, {
      translations: { 'guide-title': 'プロフィールを更新', 'step:s1': '「変更を保存」をクリックします' },
      nextIndex: 2,
      completedItems: 2,
    });

    const translatedGuideId = await completeTranslationJob(job.id);
    const translated = await getGuide(translatedGuideId);

    expect(translated?.guide).toMatchObject({
      title: 'プロフィールを更新',
      sourceGuideId: 'g1',
      language: 'ja',
    });
    expect(translated?.steps[0]).toMatchObject({
      description: '「変更を保存」をクリックします',
      screenshotId: 'shared',
    });
    expect(translated?.screenshots.get(translated.steps[0].id)?.id).toBe('shared');
    expect(await db.screenshots.count()).toBe(1);
  });

  it('copies a shared screenshot only when one guide edits it', async () => {
    await seedGuide('g1', { stepIds: ['s1'] });
    await seedGuide('g2', { stepIds: ['s2'], sourceGuideId: 'g1', language: 'ja' });
    await db.steps.bulkAdd([
      makeStep({ id: 's1', guideId: 'g1', screenshotId: 'shared' }),
      makeStep({ id: 's2', guideId: 'g2', screenshotId: 'shared' }),
    ]);
    await db.screenshots.add(makeScreenshot({ id: 'shared', stepId: 's1', blob: new Blob(['original']) }));

    const updated = await updateScreenshotBlob('shared', new Blob(['translated-edit']), 's2');

    expect(updated?.id).not.toBe('shared');
    expect((await db.steps.get('s1'))?.screenshotId).toBe('shared');
    expect((await db.steps.get('s2'))?.screenshotId).toBe(updated?.id);
    expect(await db.screenshots.count()).toBe(2);
  });

  it('masks typed values before AI translation and restores them only in the local copy', async () => {
    const source = await seedGuide('g1', { title: 'Sign in', stepIds: ['s1'] });
    const sourceStep = makeStep({
      id: 's1',
      guideId: 'g1',
      action: 'input',
      description: 'Type "private-token" in API key',
      inputValue: 'private-token',
    });
    const job = await createTranslationJob(source, [sourceStep], 'ja');
    expect(job.items.find((item) => item.id === 'step:s1')?.text).toBe('Type "{{INPUT_VALUE}}" in API key');

    await updateTranslationJob(job.id, {
      translations: { 'guide-title': 'サインイン', 'step:s1': 'APIキーに「{{INPUT_VALUE}}」を入力します' },
      nextIndex: 2,
      completedItems: 2,
    });
    const translatedGuideId = await completeTranslationJob(job.id);
    const translated = await getGuide(translatedGuideId);

    expect(translated?.steps[0].description).toBe('APIキーに「private-token」を入力します');
  });
});

describe('reorderSteps', () => {
  it('reassigns indices correctly', async () => {
    await seedGuide('g1', { stepIds: ['s1', 's2', 's3'] });
    await db.steps.bulkAdd([
      makeStep({ id: 's1', guideId: 'g1', index: 0 }),
      makeStep({ id: 's2', guideId: 'g1', index: 1 }),
      makeStep({ id: 's3', guideId: 'g1', index: 2 }),
    ]);

    await reorderSteps('g1', ['s3', 's1', 's2']);

    const guide = await db.guides.get('g1');
    expect(guide!.stepIds).toEqual(['s3', 's1', 's2']);

    const steps = await db.steps.where('guideId').equals('g1').sortBy('index');
    expect(steps.map((s) => s.id)).toEqual(['s3', 's1', 's2']);
    expect(steps.map((s) => s.index)).toEqual([0, 1, 2]);
  });
});

describe('toggleStar', () => {
  it('toggles starred boolean and broadcasts change', async () => {
    await seedGuide('g1');

    const result1 = await toggleStar('g1');
    expect(result1).toBe(true);
    expect((await db.guides.get('g1'))!.starred).toBe(true);
    expect(broadcastMessages).toContainEqual({ type: 'starred', id: 'g1', starred: true });

    broadcastMessages.length = 0;
    const result2 = await toggleStar('g1');
    expect(result2).toBe(false);
    expect((await db.guides.get('g1'))!.starred).toBe(false);
    expect(broadcastMessages).toContainEqual({ type: 'starred', id: 'g1', starred: false });
  });

  it('returns false for non-existent guide', async () => {
    const result = await toggleStar('nope');
    expect(result).toBe(false);
  });
});

describe('softDeleteGuide', () => {
  it('sets deletedAt and broadcasts mutated', async () => {
    await seedGuide('g1');

    await softDeleteGuide('g1');

    const guide = await db.guides.get('g1');
    expect(guide!.deletedAt).toBeTypeOf('number');
    expect(guide!.deletedAt).not.toBeNull();
    expect(broadcastMessages).toContainEqual({ type: 'mutated' });
  });
});

describe('permanentlyDeleteGuide', () => {
  it('cascade deletes steps and screenshots', async () => {
    await seedGuide('g1', { stepIds: ['s1', 's2'] });
    await db.steps.bulkAdd([
      makeStep({ id: 's1', guideId: 'g1', index: 0, screenshotId: 'sc1' }),
      makeStep({ id: 's2', guideId: 'g1', index: 1, screenshotId: 'sc2' }),
    ]);
    await db.screenshots.bulkAdd([
      makeScreenshot({ id: 'sc1', stepId: 's1' }),
      makeScreenshot({ id: 'sc2', stepId: 's2' }),
    ]);

    await permanentlyDeleteGuide('g1');

    expect(await db.guides.get('g1')).toBeUndefined();
    expect(await db.steps.where('guideId').equals('g1').count()).toBe(0);
    expect(await db.screenshots.get('sc1')).toBeUndefined();
    expect(await db.screenshots.get('sc2')).toBeUndefined();
    expect(broadcastMessages).toContainEqual({ type: 'mutated' });
  });
});

describe('getGuides', () => {
  it('excludes trashed guides and orders by updatedAt desc', async () => {
    await seedGuide('g1', { updatedAt: 100 });
    await seedGuide('g2', { updatedAt: 300 });
    await seedGuide('g3', { updatedAt: 200, deletedAt: Date.now() });

    const guides = await getGuides();

    expect(guides.map((g) => g.id)).toEqual(['g2', 'g1']);
  });
});

describe('getStarredGuides', () => {
  it('only returns starred guides, excludes trashed', async () => {
    await seedGuide('g1', { starred: true, updatedAt: 200 });
    await seedGuide('g2', { starred: false, updatedAt: 300 });
    await seedGuide('g3', { starred: true, updatedAt: 100, deletedAt: Date.now() });

    const guides = await getStarredGuides();

    expect(guides.map((g) => g.id)).toEqual(['g1']);
  });
});

describe('getTrashedGuides', () => {
  it('only returns trashed guides', async () => {
    await seedGuide('g1', { deletedAt: null });
    await seedGuide('g2', { deletedAt: Date.now(), updatedAt: 200 });
    await seedGuide('g3', { deletedAt: Date.now(), updatedAt: 300 });

    const guides = await getTrashedGuides();

    expect(guides.map((g) => g.id)).toEqual(['g3', 'g2']);
  });
});
