// @vitest-environment happy-dom

import { afterEach, describe, expect, it } from 'vitest';
import { freezeCaptureTarget } from '../capture-freeze';

describe('freezeCaptureTarget', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    for (const freeze of document.querySelectorAll('[data-taskstitch-capture-freeze]')) freeze.remove();
  });

  it('keeps a visual copy after the clicked control is removed', () => {
    const button = document.createElement('button');
    const label = document.createElement('span');
    label.textContent = 'Log in to Control Panel';
    button.appendChild(label);
    button.style.backgroundColor = 'rgb(79, 70, 229)';
    document.body.appendChild(button);
    Object.defineProperty(button, 'getBoundingClientRect', {
      value: () => ({ left: 20, top: 30, width: 180, height: 40, right: 200, bottom: 70, x: 20, y: 30 }),
    });

    const release = freezeCaptureTarget(button);
    button.remove();

    const freeze = document.querySelector('[data-taskstitch-capture-freeze]');
    expect(freeze).not.toBeNull();
    expect(freeze?.textContent).toBe('Log in to Control Panel');
    expect((freeze as HTMLElement).style.left).toBe('20px');
    expect((freeze as HTMLElement).style.top).toBe('30px');
    expect((freeze as HTMLElement).style.getPropertyValue('pointer-events')).toBe('none');
    expect((freeze?.querySelector('span') as HTMLElement).style.getPropertyValue('pointer-events')).toBe('none');
    expect(freeze?.hasAttribute('data-mimik-ignore')).toBe(true);

    release();
    expect(document.querySelector('[data-taskstitch-capture-freeze]')).toBeNull();
  });

  it('does nothing for a detached target', () => {
    const button = document.createElement('button');
    const release = freezeCaptureTarget(button);
    release();

    expect(document.querySelector('[data-taskstitch-capture-freeze]')).toBeNull();
  });

  it('does not clone arbitrary page containers', () => {
    const container = document.createElement('div');
    container.textContent = 'Page content';
    document.body.appendChild(container);
    Object.defineProperty(container, 'getBoundingClientRect', {
      value: () => ({ left: 0, top: 0, width: 800, height: 600, right: 800, bottom: 600, x: 0, y: 0 }),
    });

    const release = freezeCaptureTarget(container);
    release();

    expect(document.querySelector('[data-taskstitch-capture-freeze]')).toBeNull();
  });
});
