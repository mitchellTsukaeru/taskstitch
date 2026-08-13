import type { JSONContent } from '@tiptap/core';
import { blobToBase64 } from '@/core/export/utils';
import { sanitizeGuideOriginMappings } from '@/core/guideme/urls';
import { saveImportedGuide } from './service';
import type { ElementMeta, Guide, GuideImpact, Screenshot, ScreenshotBounds, Step } from './types';

export const TASKSTITCH_FORMAT = 'taskstitch-guide';
export const TASKSTITCH_VERSION = 1;
export const TASKSTITCH_MIME = 'application/vnd.taskstitch.guide+json';
export const MAX_TASKSTITCH_FILE_SIZE = 100 * 1024 * 1024;

interface PortableScreenshot {
  mimeType: 'image/png' | 'image/jpeg' | 'image/webp';
  data: string;
  width: number;
  height: number;
  bounds?: ScreenshotBounds;
  pixelRatio?: number;
}

interface PortableStep {
  index: number;
  description: string;
  action: string;
  url: string;
  kind?: 'captured' | 'manual';
  richDescription?: JSONContent;
  elementMeta?: ElementMeta;
  screenshot?: PortableScreenshot;
}

export interface TaskStitchPackage {
  format: typeof TASKSTITCH_FORMAT;
  version: typeof TASKSTITCH_VERSION;
  exportedAt: string;
  guide: {
    title: string;
    language?: string;
    impact: GuideImpact;
    impactNote?: string;
    guideMeOrigins?: Guide['guideMeOrigins'];
  };
  steps: PortableStep[];
}

const ALLOWED_IMAGE_TYPES = new Set<PortableScreenshot['mimeType']>(['image/png', 'image/jpeg', 'image/webp']);
const ALLOWED_NODE_TYPES = new Set(['doc', 'paragraph', 'bulletList', 'orderedList', 'listItem', 'hardBreak', 'text']);
const ALLOWED_MARK_TYPES = new Set(['bold', 'italic', 'underline', 'code', 'link']);
const IMPACTS = new Set<GuideImpact>(['read_only', 'makes_changes', 'destructive', 'unknown']);

function safeString(value: unknown, maxLength: number, fallback = ''): string {
  return typeof value === 'string' ? value.slice(0, maxLength) : fallback;
}

function finiteNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function safeUrl(value: unknown): string {
  const url = safeString(value, 4_000);
  if (!url) return '';
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.toString() : '';
  } catch {
    return '';
  }
}

function sanitizeRichText(value: unknown, depth = 0, count = { value: 0 }): JSONContent | undefined {
  if (!value || typeof value !== 'object' || depth > 12 || count.value++ > 1_000) return undefined;
  const input = value as JSONContent;
  if (!input.type || !ALLOWED_NODE_TYPES.has(input.type)) return undefined;
  const node: JSONContent = { type: input.type };
  if (input.type === 'text') {
    node.text = safeString(input.text, 20_000);
    const marks = (input.marks ?? [])
      .filter((mark) => ALLOWED_MARK_TYPES.has(mark.type))
      .slice(0, 8)
      .map((mark) => {
        if (mark.type !== 'link') return { type: mark.type };
        const href = safeUrl(mark.attrs?.href);
        return href ? { type: 'link', attrs: { href } } : undefined;
      })
      .filter(Boolean) as NonNullable<JSONContent['marks']>;
    if (marks.length) node.marks = marks;
  }
  const content = (input.content ?? [])
    .slice(0, 1_000)
    .map((child) => sanitizeRichText(child, depth + 1, count))
    .filter(Boolean) as JSONContent[];
  if (content.length) node.content = content;
  return node;
}

function sanitizeElementMeta(value: unknown): ElementMeta | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const input = value as Partial<ElementMeta>;
  const tag = safeString(input.tag, 40, 'div').toLowerCase();
  const rect = input.rect && typeof input.rect === 'object' ? input.rect : { x: 0, y: 0, width: 0, height: 0 };
  const nullable = (item: unknown, max = 500) => (typeof item === 'string' ? item.slice(0, max) : null);
  return {
    tag: /^[a-z][a-z0-9-]*$/.test(tag) ? tag : 'div',
    cssSelector: safeString(input.cssSelector, 4_000),
    textContent: nullable(input.textContent, 1_000),
    ariaLabel: nullable(input.ariaLabel),
    placeholder: nullable(input.placeholder),
    altText: nullable(input.altText),
    name: nullable(input.name),
    role: nullable(input.role),
    href: input.href ? safeUrl(input.href) || null : null,
    inputType: nullable(input.inputType, 100),
    dataTestId: nullable(input.dataTestId),
    rect: {
      x: finiteNumber(rect.x),
      y: finiteNumber(rect.y),
      width: Math.max(0, finiteNumber(rect.width)),
      height: Math.max(0, finiteNumber(rect.height)),
    },
    devicePixelRatio: Math.max(0.1, Math.min(10, finiteNumber(input.devicePixelRatio, 1))),
  };
}

function redactDescription(step: Step): string {
  if (!step.inputValue) return step.description;
  return step.description.split(step.inputValue).join('[redacted input]');
}

export async function createTaskStitchPackage(
  guide: Guide,
  steps: Step[],
  screenshots: Map<string, Screenshot>,
  impact: GuideImpact,
  impactNote?: string,
): Promise<TaskStitchPackage> {
  return {
    format: TASKSTITCH_FORMAT,
    version: TASKSTITCH_VERSION,
    exportedAt: new Date().toISOString(),
    guide: {
      title: guide.title,
      language: guide.language,
      impact,
      impactNote: impactNote?.trim().slice(0, 500) || undefined,
      guideMeOrigins: guide.guideMeOrigins,
    },
    steps: await Promise.all(
      steps.map(async (step) => {
        const screenshot = screenshots.get(step.id);
        return {
          index: step.index,
          description: redactDescription(step),
          action: step.action,
          url: step.url,
          kind: step.kind,
          richDescription: step.inputValue ? undefined : step.richDescription,
          elementMeta: step.elementMeta,
          screenshot: screenshot
            ? {
                mimeType: screenshot.mimeType as PortableScreenshot['mimeType'],
                data: await blobToBase64(screenshot.blob),
                width: screenshot.width,
                height: screenshot.height,
                bounds: screenshot.bounds,
                pixelRatio: screenshot.pixelRatio,
              }
            : undefined,
        };
      }),
    ),
  };
}

export async function exportTaskStitchGuide(
  guide: Guide,
  steps: Step[],
  screenshots: Map<string, Screenshot>,
  impact: GuideImpact,
  impactNote?: string,
): Promise<Blob> {
  const portable = await createTaskStitchPackage(guide, steps, screenshots, impact, impactNote);
  return new Blob([JSON.stringify(portable)], { type: TASKSTITCH_MIME });
}

function parseScreenshot(value: unknown): PortableScreenshot | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const input = value as Partial<PortableScreenshot>;
  if (!input.mimeType || !ALLOWED_IMAGE_TYPES.has(input.mimeType) || typeof input.data !== 'string') return undefined;
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(input.data) || input.data.length > MAX_TASKSTITCH_FILE_SIZE * 1.4) {
    throw new Error('The guide contains an invalid screenshot');
  }
  const bounds = input.bounds
    ? {
        x: finiteNumber(input.bounds.x),
        y: finiteNumber(input.bounds.y),
        width: Math.max(0, finiteNumber(input.bounds.width)),
        height: Math.max(0, finiteNumber(input.bounds.height)),
      }
    : undefined;
  return {
    mimeType: input.mimeType,
    data: input.data,
    width: Math.max(1, Math.min(50_000, finiteNumber(input.width, 1))),
    height: Math.max(1, Math.min(50_000, finiteNumber(input.height, 1))),
    bounds,
    pixelRatio: Math.max(0.1, Math.min(10, finiteNumber(input.pixelRatio, 1))),
  };
}

export function parseTaskStitchPackage(value: unknown): TaskStitchPackage {
  if (!value || typeof value !== 'object') throw new Error('This is not a TaskStitch guide');
  const input = value as Partial<TaskStitchPackage>;
  if (input.format !== TASKSTITCH_FORMAT) throw new Error('This is not a TaskStitch guide');
  if (input.version !== TASKSTITCH_VERSION)
    throw new Error(`TaskStitch guide version ${String(input.version)} is not supported`);
  if (!input.guide || typeof input.guide !== 'object') throw new Error('The guide metadata is missing');
  if (!Array.isArray(input.steps) || input.steps.length === 0) throw new Error('The guide has no steps');
  if (input.steps.length > 2_000) throw new Error('The guide has too many steps');
  const impact = IMPACTS.has(input.guide.impact) ? input.guide.impact : 'unknown';
  const steps = input.steps.map((value, index) => {
    if (!value || typeof value !== 'object') throw new Error(`Step ${index + 1} is invalid`);
    const step = value as Partial<PortableStep>;
    const description = safeString(step.description, 20_000);
    if (!description && !step.screenshot) throw new Error(`Step ${index + 1} has no content`);
    return {
      index,
      description,
      action: safeString(step.action, 100, 'manual'),
      url: safeUrl(step.url),
      kind: step.kind === 'manual' ? 'manual' : 'captured',
      richDescription: sanitizeRichText(step.richDescription),
      elementMeta: sanitizeElementMeta(step.elementMeta),
      screenshot: parseScreenshot(step.screenshot),
    } satisfies PortableStep;
  });
  return {
    format: TASKSTITCH_FORMAT,
    version: TASKSTITCH_VERSION,
    exportedAt: safeString(input.exportedAt, 100, new Date().toISOString()),
    guide: {
      title: safeString(input.guide.title, 300, 'Imported guide') || 'Imported guide',
      language: safeString(input.guide.language, 30) || undefined,
      impact,
      impactNote: safeString(input.guide.impactNote, 500) || undefined,
      guideMeOrigins: sanitizeGuideOriginMappings(input.guide.guideMeOrigins),
    },
    steps,
  };
}

export async function readTaskStitchFile(file: File): Promise<TaskStitchPackage> {
  if (file.size > MAX_TASKSTITCH_FILE_SIZE) throw new Error('TaskStitch guide files must be smaller than 100 MB');
  try {
    return parseTaskStitchPackage(JSON.parse(await file.text()));
  } catch (error) {
    if (error instanceof SyntaxError) throw new Error('The TaskStitch guide file is not valid JSON');
    throw error;
  }
}

function base64ToBlob(data: string, mimeType: string): Blob {
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index++) bytes[index] = binary.charCodeAt(index);
  return new Blob([bytes], { type: mimeType });
}

export async function importTaskStitchPackage(portable: TaskStitchPackage): Promise<string> {
  const guideId = crypto.randomUUID();
  const now = Date.now();
  const steps: Step[] = [];
  const screenshots: Screenshot[] = [];
  for (const portableStep of portable.steps) {
    const stepId = crypto.randomUUID();
    let screenshotId: string | undefined;
    if (portableStep.screenshot) {
      screenshotId = crypto.randomUUID();
      screenshots.push({
        id: screenshotId,
        stepId,
        blob: base64ToBlob(portableStep.screenshot.data, portableStep.screenshot.mimeType),
        mimeType: portableStep.screenshot.mimeType,
        width: portableStep.screenshot.width,
        height: portableStep.screenshot.height,
        bounds: portableStep.screenshot.bounds,
        pixelRatio: portableStep.screenshot.pixelRatio,
      });
    }
    steps.push({
      id: stepId,
      guideId,
      index: portableStep.index,
      description: portableStep.description,
      action: portableStep.action,
      url: portableStep.url,
      timestamp: now,
      screenshotId,
      elementMeta: portableStep.elementMeta,
      kind: portableStep.kind,
      richDescription: portableStep.richDescription,
    });
  }
  const guide: Guide = {
    id: guideId,
    title: portable.guide.title,
    createdAt: now,
    updatedAt: now,
    stepIds: steps.map((step) => step.id),
    starred: false,
    deletedAt: null,
    titleEdited: true,
    language: portable.guide.language,
    impact: portable.guide.impact,
    impactNote: portable.guide.impactNote,
    guideMeOrigins: portable.guide.guideMeOrigins,
    importedAt: now,
  };
  await saveImportedGuide(guide, steps, screenshots);
  return guideId;
}

export function taskStitchFilename(title: string): string {
  const base = title
    .normalize('NFKD')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100);
  return `${base || 'taskstitch-guide'}.taskstitch`;
}
