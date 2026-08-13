// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import {
  createTaskStitchPackage,
  parseTaskStitchPackage,
  TASKSTITCH_FORMAT,
  TASKSTITCH_VERSION,
  taskStitchFilename,
} from '../portable';
import type { Guide, Screenshot, Step } from '../types';

const guide: Guide = {
  id: 'guide-1',
  title: 'Update customer profile',
  createdAt: 1,
  updatedAt: 1,
  stepIds: ['step-1'],
  starred: false,
  deletedAt: null,
  guideMeOrigins: { 'https://stg.example.com': 'https://example.com' },
};

function step(overrides: Partial<Step> = {}): Step {
  return {
    id: 'step-1',
    guideId: guide.id,
    index: 0,
    description: 'Type "private-value" in API key',
    inputValue: 'private-value',
    action: 'input',
    url: 'https://example.com/settings',
    timestamp: 1,
    elementMeta: {
      tag: 'input',
      cssSelector: '#api-key',
      textContent: null,
      ariaLabel: 'API key',
      placeholder: null,
      altText: null,
      name: 'apiKey',
      role: null,
      href: null,
      inputType: 'password',
      dataTestId: null,
      rect: { x: 1, y: 2, width: 100, height: 30 },
      devicePixelRatio: 2,
    },
    ...overrides,
  };
}

describe('portable TaskStitch guides', () => {
  it('exports Guide Me metadata and screenshots without captured typed values', async () => {
    const screenshot: Screenshot = {
      id: 'shot-1',
      stepId: 'step-1',
      blob: new Blob(['image'], { type: 'image/png' }),
      mimeType: 'image/png',
      width: 800,
      height: 600,
    };
    const portable = await createTaskStitchPackage(
      guide,
      [step()],
      new Map([['step-1', screenshot]]),
      'makes_changes',
      'Uses the test tenant.',
    );

    expect(portable).toMatchObject({
      format: TASKSTITCH_FORMAT,
      version: TASKSTITCH_VERSION,
      guide: {
        impact: 'makes_changes',
        impactNote: 'Uses the test tenant.',
        guideMeOrigins: { 'https://stg.example.com': 'https://example.com' },
      },
    });
    expect(portable.steps[0].description).toBe('Type "[redacted input]" in API key');
    expect(portable.steps[0].elementMeta?.cssSelector).toBe('#api-key');
    expect(portable.steps[0].screenshot?.data).toBe(btoa('image'));
    expect(JSON.stringify(portable)).not.toContain('private-value');
  });

  it('sanitizes unsafe URLs and rich-text links while parsing', () => {
    const parsed = parseTaskStitchPackage({
      format: TASKSTITCH_FORMAT,
      version: TASKSTITCH_VERSION,
      exportedAt: new Date().toISOString(),
      guide: { title: 'Imported', impact: 'read_only' },
      steps: [
        {
          index: 0,
          description: 'Open the page',
          action: 'click',
          url: 'javascript:alert(1)',
          richDescription: {
            type: 'doc',
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: 'Unsafe', marks: [{ type: 'link', attrs: { href: 'javascript:x' } }] }],
              },
            ],
          },
        },
      ],
    });

    expect(parsed.steps[0].url).toBe('');
    expect(parsed.steps[0].richDescription?.content?.[0].content?.[0].marks).toBeUndefined();
  });

  it('sanitizes imported Guide Me origin mappings', () => {
    const parsed = parseTaskStitchPackage({
      format: TASKSTITCH_FORMAT,
      version: TASKSTITCH_VERSION,
      exportedAt: new Date().toISOString(),
      guide: {
        title: 'Imported',
        impact: 'read_only',
        guideMeOrigins: {
          'https://stg.example.com/path': 'https://example.com/ignored',
          'javascript:bad': 'https://unsafe.example.com',
        },
      },
      steps: [{ index: 0, description: 'Open page', action: 'click', url: 'https://stg.example.com/path' }],
    });

    expect(parsed.guide.guideMeOrigins).toEqual({ 'https://stg.example.com': 'https://example.com' });
  });

  it('rejects unsupported versions and produces stable filenames', () => {
    expect(() => parseTaskStitchPackage({ format: TASKSTITCH_FORMAT, version: 99, guide: {}, steps: [{}] })).toThrow(
      'not supported',
    );
    expect(taskStitchFilename('  Customer / Billing setup  ')).toBe('Customer-Billing-setup.taskstitch');
  });
});
