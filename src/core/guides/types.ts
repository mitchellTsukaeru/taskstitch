import type { JSONContent } from '@tiptap/core';

export interface Guide {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  stepIds: string[];
  starred: boolean;
  deletedAt: number | null;
  titleEdited?: boolean;
  sourceGuideId?: string;
  language?: string;
  impact?: GuideImpact;
  impactNote?: string;
  importedAt?: number;
  guideMeOrigins?: GuideOriginMappings;
}

export type GuideOriginMappings = Record<string, string>;

export type GuideImpact = 'read_only' | 'makes_changes' | 'destructive' | 'unknown';

export interface Step {
  id: string;
  guideId: string;
  index: number;
  description: string;
  action: string;
  url: string;
  timestamp: number;
  screenshotId?: string;
  elementMeta?: ElementMeta;
  inputValue?: string;
  kind?: 'captured' | 'manual';
  richDescription?: JSONContent;
}

export interface ScreenshotBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Screenshot {
  id: string;
  stepId: string;
  blob: Blob;
  mimeType: string;
  width: number;
  height: number;
  bounds?: ScreenshotBounds;
  pixelRatio?: number;
}

export type TranslationJobStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface TranslationJob {
  id: string;
  sourceGuide: Guide;
  sourceSteps: Step[];
  targetLanguage: string;
  status: TranslationJobStatus;
  items: Array<{ id: string; text: string }>;
  translations: Record<string, string>;
  nextIndex: number;
  completedItems: number;
  totalItems: number;
  translatedGuideId?: string;
  error?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Settings {
  aiApiKey: string;
  aiProvider: 'openai' | 'anthropic';
  aiModel: string;
  aiBaseUrl?: string;
}

export interface ElementMeta {
  tag: string;
  cssSelector: string;
  textContent: string | null;
  ariaLabel: string | null;
  placeholder: string | null;
  altText: string | null;
  name: string | null;
  role: string | null;
  href: string | null;
  inputType: string | null;
  dataTestId: string | null;
  rect: { x: number; y: number; width: number; height: number };
  devicePixelRatio: number;
}
