import type { GuideOriginMappings, Step } from '@/core/guides/types';

export interface GuideSiteSummary {
  sourceOrigin: string;
  targetOrigin: string;
  startUrl: string;
  firstPath: string;
  stepIndices: number[];
  mapped: boolean;
}

export function normalizeHttpOrigin(value: string): string | null {
  try {
    const url = new URL(value.trim());
    if ((url.protocol !== 'http:' && url.protocol !== 'https:') || url.username || url.password) return null;
    return url.origin;
  } catch {
    return null;
  }
}

export function resolveGuideMeUrl(urlValue: string, mappings?: GuideOriginMappings): string {
  if (!urlValue || !mappings) return urlValue;
  try {
    const sourceUrl = new URL(urlValue);
    const targetOrigin = normalizeHttpOrigin(mappings[sourceUrl.origin] ?? '');
    if (!targetOrigin || targetOrigin === sourceUrl.origin) return urlValue;
    const targetUrl = new URL(targetOrigin);
    if (sourceUrl.protocol === 'https:' && targetUrl.protocol !== 'https:') return urlValue;
    sourceUrl.protocol = targetUrl.protocol;
    sourceUrl.host = targetUrl.host;
    return sourceUrl.toString();
  } catch {
    return urlValue;
  }
}

export function resolveGuideMeStep(step: Step, mappings?: GuideOriginMappings): Step {
  const url = resolveGuideMeUrl(step.url, mappings);
  const href = step.elementMeta?.href ? resolveGuideMeUrl(step.elementMeta.href, mappings) : step.elementMeta?.href;
  if (url === step.url && href === step.elementMeta?.href) return step;
  return {
    ...step,
    url,
    elementMeta: step.elementMeta ? { ...step.elementMeta, href: href ?? null } : undefined,
  };
}

export function sanitizeGuideOriginMappings(value: unknown): GuideOriginMappings | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  const mappings: GuideOriginMappings = {};
  for (const [sourceValue, targetValue] of Object.entries(value).slice(0, 100)) {
    if (typeof targetValue !== 'string') continue;
    const sourceOrigin = normalizeHttpOrigin(sourceValue);
    const targetOrigin = normalizeHttpOrigin(targetValue);
    const secure = !sourceOrigin?.startsWith('https://') || targetOrigin?.startsWith('https://');
    if (sourceOrigin && targetOrigin && sourceOrigin !== targetOrigin && secure) mappings[sourceOrigin] = targetOrigin;
  }
  return Object.keys(mappings).length ? mappings : undefined;
}

export function getGuideSiteSummaries(steps: Step[], mappings?: GuideOriginMappings): GuideSiteSummary[] {
  const sites = new Map<string, GuideSiteSummary>();
  for (const step of steps) {
    if (!step.url) continue;
    try {
      const sourceUrl = new URL(step.url);
      if (sourceUrl.protocol !== 'http:' && sourceUrl.protocol !== 'https:') continue;
      const sourceOrigin = sourceUrl.origin;
      const existing = sites.get(sourceOrigin);
      if (existing) {
        existing.stepIndices.push(step.index);
        continue;
      }
      const startUrl = resolveGuideMeUrl(step.url, mappings);
      const targetOrigin = new URL(startUrl).origin;
      sites.set(sourceOrigin, {
        sourceOrigin,
        targetOrigin,
        startUrl,
        firstPath: `${sourceUrl.pathname}${sourceUrl.search}${sourceUrl.hash}`,
        stepIndices: [step.index],
        mapped: targetOrigin !== sourceOrigin,
      });
    } catch {}
  }
  return [...sites.values()];
}
