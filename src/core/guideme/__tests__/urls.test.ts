import { describe, expect, it } from 'vitest';
import type { Step } from '@/core/guides/types';
import {
  getGuideSiteSummaries,
  normalizeHttpOrigin,
  resolveGuideMeStep,
  resolveGuideMeUrl,
  sanitizeGuideOriginMappings,
} from '../urls';

function step(index: number, url: string): Step {
  return {
    id: `step-${index}`,
    guideId: 'guide-1',
    index,
    description: 'Open page',
    action: 'click',
    url,
    timestamp: 1,
  };
}

describe('Guide Me origin mappings', () => {
  it('normalizes safe HTTP origins and rejects credentials or unsafe protocols', () => {
    expect(normalizeHttpOrigin('https://example.com/path')).toBe('https://example.com');
    expect(normalizeHttpOrigin('https://user:secret@example.com')).toBeNull();
    expect(normalizeHttpOrigin('javascript:alert(1)')).toBeNull();
  });

  it('replaces only the origin while preserving the path, query, and hash', () => {
    expect(
      resolveGuideMeUrl('https://stg.example.com/customers/new?tab=billing#contact', {
        'https://stg.example.com': 'https://example.com',
      }),
    ).toBe('https://example.com/customers/new?tab=billing#contact');
  });

  it('does not downgrade an HTTPS guide to HTTP', () => {
    expect(
      resolveGuideMeUrl('https://secure.example.com/account', {
        'https://secure.example.com': 'http://insecure.example.com',
      }),
    ).toBe('https://secure.example.com/account');
  });

  it('also maps captured link metadata used by the element finder', () => {
    const original = step(0, 'https://stg.example.com/customers');
    original.elementMeta = {
      tag: 'a',
      cssSelector: 'a.customers',
      textContent: 'Customers',
      ariaLabel: null,
      placeholder: null,
      altText: null,
      name: null,
      role: null,
      href: 'https://stg.example.com/customers/new',
      inputType: null,
      dataTestId: null,
      rect: { x: 0, y: 0, width: 10, height: 10 },
      devicePixelRatio: 1,
    };

    const resolved = resolveGuideMeStep(original, { 'https://stg.example.com': 'https://example.com' });
    expect(resolved.url).toBe('https://example.com/customers');
    expect(resolved.elementMeta?.href).toBe('https://example.com/customers/new');
    expect(original.url).toBe('https://stg.example.com/customers');
  });

  it('summarizes each recorded site and its final destination in first-seen order', () => {
    const summaries = getGuideSiteSummaries(
      [
        step(0, 'https://stg.example.com/customers/new'),
        step(1, 'https://stg.example.com/customers/1'),
        step(2, 'https://login.example.net/'),
      ],
      { 'https://stg.example.com': 'https://example.com' },
    );

    expect(summaries).toEqual([
      {
        sourceOrigin: 'https://stg.example.com',
        targetOrigin: 'https://example.com',
        startUrl: 'https://example.com/customers/new',
        firstPath: '/customers/new',
        stepIndices: [0, 1],
        mapped: true,
      },
      {
        sourceOrigin: 'https://login.example.net',
        targetOrigin: 'https://login.example.net',
        startUrl: 'https://login.example.net/',
        firstPath: '/',
        stepIndices: [2],
        mapped: false,
      },
    ]);
  });

  it('sanitizes imported mappings and drops no-op or unsafe entries', () => {
    expect(
      sanitizeGuideOriginMappings({
        'https://stg.example.com/path': 'https://example.com/ignored',
        'https://same.example.com': 'https://same.example.com',
        'javascript:bad': 'https://example.com',
        'https://secure.example.com': 'http://insecure.example.com',
      }),
    ).toEqual({ 'https://stg.example.com': 'https://example.com' });
  });
});
