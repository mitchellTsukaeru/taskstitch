// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { showStartNotification } from '../start-notification';

describe('showStartNotification', () => {
  let shadow: ShadowRoot | undefined;

  beforeEach(() => {
    document.documentElement.querySelectorAll('mimik-notification').forEach((element) => {
      element.remove();
    });
    const attachShadow = HTMLElement.prototype.attachShadow;
    vi.spyOn(HTMLElement.prototype, 'attachShadow').mockImplementation(function attachOpenShadow() {
      shadow = attachShadow.call(this, { mode: 'open' });
      return shadow;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the TaskStitch mark instead of the legacy mascot', () => {
    void showStartNotification();

    expect(shadow?.querySelector('.stitch-line')).not.toBeNull();
    expect(shadow?.querySelectorAll('.logo-node')).toHaveLength(3);
    expect(shadow?.querySelector('.glyph-three')).not.toBeNull();
    expect(shadow?.querySelector('.mascot-wrap')).toBeNull();
    expect(shadow?.querySelector('.wink-eye')).toBeNull();
    expect(shadow?.querySelector('[role="status"]')?.getAttribute('aria-label')).toBe('TaskStitch capture starting');
  });

  it('removes the overlay and resolves after the outer animation finishes', async () => {
    let resolved = false;
    const finished = showStartNotification().then(() => {
      resolved = true;
    });
    const host = document.documentElement.querySelector('mimik-notification');
    const line = shadow?.querySelector('.stitch-line');
    const wrap = shadow?.querySelector('.wrap');

    line?.dispatchEvent(new Event('animationend', { bubbles: true }));
    await Promise.resolve();
    expect(resolved).toBe(false);
    expect(host?.isConnected).toBe(true);

    wrap?.dispatchEvent(new Event('animationend'));
    await finished;

    expect(resolved).toBe(true);
    expect(host?.isConnected).toBe(false);
  });
});
