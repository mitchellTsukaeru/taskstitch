import PQueue from 'p-queue';
import { localStorage } from '@/lib/browser-api';
import { sendMessage } from '@/lib/messaging';
import { freezeCaptureTarget } from '../capture-freeze';
import { extractDOMContext } from '../dom/context';
import { extractElementMeta } from '../dom/element-meta';
import { findFocusableAncestor, isNavigatingClick, isTaskStitchElement, isTextField } from '../dom/element-utils';
import { getScreenshotDelayMs } from '../screenshot-timing';
import { InputSession } from './input-session';

const DEDUP_MS = 300;
const DRAG_MIN_PX = 30;
const INTERCEPT_DELAY_MS = 100;
const ABANDONED_FREEZE_TTL_MS = 2_000;

async function waitForScreenshotDelay(): Promise<void> {
  const { screenshotTiming } = await localStorage.get(['screenshotTiming']);
  const delayMs = getScreenshotDelayMs(screenshotTiming);
  await new Promise<void>((resolve) => setTimeout(resolve, delayMs));
}

let lastClickTarget: Element | null = null;
let lastClickTime = 0;

interface PendingClickCapture {
  captureId: string;
  target: HTMLElement;
  ready: Promise<unknown>;
  releaseFreeze: () => void;
}

interface CaptureDeliveryOptions {
  captureId?: string;
  eventId?: string;
  ready?: Promise<unknown>;
  releaseFreeze?: () => void;
}

export interface CaptureHandle {
  stop: () => Promise<void>;
}

export interface CaptureActionSnapshot {
  action: string;
  elementMeta: ReturnType<typeof extractElementMeta>;
  domContext: ReturnType<typeof extractDOMContext>;
}

export function snapshotCaptureAction(action: string, target: HTMLElement): CaptureActionSnapshot {
  return {
    action,
    elementMeta: extractElementMeta(target),
    domContext: extractDOMContext(target, action),
  };
}

const PASSIVE_CAPTURE = { capture: true, passive: true } as const;
const ACTIVE_CAPTURE = { capture: true } as const;

class CaptureController {
  private input: InputSession;
  private queue = new PQueue({ concurrency: 1 });
  private listeners: [string, EventListener, AddEventListenerOptions][] = [];
  private dragStartX: number | null = null;
  private dragStartY: number | null = null;
  private dragStartElement: Element | null = null;
  private pendingClickCapture: PendingClickCapture | null = null;

  constructor(
    private guideId: string,
    private captureToken: string,
    isTopFrame: boolean,
  ) {
    this.input = new InputSession(guideId, captureToken);
    this.listeners = [
      ['click', this.onClick.bind(this), ACTIVE_CAPTURE],
      ['auxclick', this.onAuxClick.bind(this), ACTIVE_CAPTURE],
      ['contextmenu', this.onContextMenu.bind(this), ACTIVE_CAPTURE],
      ['keydown', this.onKeydown.bind(this), ACTIVE_CAPTURE],
      ['input', this.onInput.bind(this), PASSIVE_CAPTURE],
      ['focusout', this.onFocusOut.bind(this), PASSIVE_CAPTURE],
      ['pointerdown', this.onPointerDown.bind(this), PASSIVE_CAPTURE],
    ];
    if (isTopFrame) {
      this.listeners.push(
        ['copy', this.onClipboard.bind(this), PASSIVE_CAPTURE],
        ['paste', this.onClipboard.bind(this), PASSIVE_CAPTURE],
        ['cut', this.onClipboard.bind(this), PASSIVE_CAPTURE],
        ['pointerup', this.onPointerUp.bind(this), PASSIVE_CAPTURE],
        ['dragend', this.onDragEnd.bind(this), PASSIVE_CAPTURE],
      );
    }
    for (const [event, handler, opts] of this.listeners) {
      window.addEventListener(event, handler, opts);
    }
  }

  private async captureAction(snapshot: CaptureActionSnapshot, options: CaptureDeliveryOptions = {}) {
    try {
      await options.ready?.catch(() => {});
      if (!options.captureId) await waitForScreenshotDelay();
      await sendMessage('captureStep', {
        guideId: this.guideId,
        captureToken: this.captureToken,
        pageUrl: window.location.href,
        ...snapshot,
        captureId: options.captureId,
        eventId: options.eventId,
      });
    } finally {
      options.releaseFreeze?.();
    }
  }

  private enqueueCaptureAction(action: string, target: HTMLElement, options: CaptureDeliveryOptions = {}) {
    // Capture coordinates and context during the event. A click can synchronously
    // open a modal and detach the target before the delayed screenshot is taken.
    const snapshot = snapshotCaptureAction(action, target);
    this.queue.add(() => this.captureAction(snapshot, options));
  }

  private onClick(e: Event) {
    const me = e as MouseEvent;
    const raw = me.target;
    if (!raw || !(raw instanceof Element)) return;
    const target = findFocusableAncestor(raw);
    if (isTaskStitchElement(target)) return;

    const now = Date.now();
    if (target === lastClickTarget && now - lastClickTime < DEDUP_MS) {
      this.pendingClickCapture?.releaseFreeze();
      this.pendingClickCapture = null;
      return;
    }
    lastClickTarget = target;
    lastClickTime = now;

    const pending = this.pendingClickCapture?.target === target ? this.pendingClickCapture : null;
    if (!pending) this.pendingClickCapture?.releaseFreeze();
    this.pendingClickCapture = null;

    if (isTextField(target)) {
      this.queue.add(async () => {
        if (this.input.active && this.input.target !== target) await this.input.finalize();
        if (!this.input.active) await this.input.start(target);
      });
      return;
    }

    const captureOptions = {
      captureId: pending?.captureId,
      eventId: `${this.guideId}:click:${me.timeStamp}:${me.button}`,
      ready: pending?.ready,
      releaseFreeze: pending?.releaseFreeze,
    };

    if (isNavigatingClick(target)) {
      me.preventDefault();
      me.stopImmediatePropagation();
      this.enqueueCaptureAction('click', target, captureOptions);
      const anchor = target.closest('a[href]') as HTMLAnchorElement;
      if (anchor) {
        const href = anchor.href;
        requestAnimationFrame(() =>
          setTimeout(() => {
            window.location.href = href;
          }, INTERCEPT_DELAY_MS),
        );
      }
      return;
    }

    this.enqueueCaptureAction('click', target, captureOptions);
  }

  private onAuxClick(e: Event) {
    const me = e as MouseEvent;
    // Right-clicks are captured by contextmenu so web-app menus have a chance
    // to render before the delayed screenshot. Keep auxclick for middle-clicks.
    if (me.button === 2) return;
    const raw = me.target;
    if (!raw || !(raw instanceof Element)) return;
    const target = findFocusableAncestor(raw);
    if (isTaskStitchElement(target)) return;
    this.enqueueCaptureAction('auxclick', target);
  }

  private onContextMenu(e: Event) {
    const raw = (e as MouseEvent).target;
    if (!raw || !(raw instanceof Element)) return;
    const target = findFocusableAncestor(raw);
    if (isTaskStitchElement(target)) return;
    this.enqueueCaptureAction('contextmenu', target);
  }

  private onKeydown(e: Event) {
    const ke = e as KeyboardEvent;
    const target = ke.target instanceof HTMLElement ? ke.target : document.activeElement;
    if (!target || !(target instanceof HTMLElement) || isTaskStitchElement(target)) return;

    if (this.input.active && (ke.key === 'Enter' || ke.key === 'Escape')) {
      this.queue.add(() => this.input.finalize());
      return;
    }

    if (isTextField(target)) return;
    this.enqueueCaptureAction(`keydown:${ke.key}`, target);
  }

  private onInput(e: Event) {
    const target = e.target;
    if (!target || !(target instanceof HTMLElement)) return;
    if (
      !(
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        target.isContentEditable
      )
    )
      return;

    if (target instanceof HTMLSelectElement) {
      this.enqueueCaptureAction('input', target);
      return;
    }

    if (target instanceof HTMLInputElement && (target.type === 'checkbox' || target.type === 'radio')) return;

    if (this.input.active && this.input.target === target) {
      this.input.update(target);
      return;
    }

    this.queue.add(async () => {
      if (this.input.active && this.input.target !== target) await this.input.finalize();
      await this.input.start(target);
      this.input.update(target);
    });
  }

  private onFocusOut(e: Event) {
    if (!this.input.active) return;
    const related = (e as FocusEvent).relatedTarget;
    if (related instanceof Element && related === this.input.target) return;
    this.queue.add(() => this.input.finalize());
  }

  private onClipboard(e: Event) {
    const target =
      (e as ClipboardEvent).target instanceof HTMLElement
        ? ((e as ClipboardEvent).target as HTMLElement)
        : document.activeElement;
    if (!target || !(target instanceof HTMLElement) || isTaskStitchElement(target)) return;
    this.enqueueCaptureAction(e.type, target);
  }

  private onPointerDown(e: Event) {
    const pe = e as PointerEvent;
    const raw = pe.target;
    if (pe.button === 0 && raw instanceof Element) {
      const target = findFocusableAncestor(raw);
      if (!isTaskStitchElement(target) && !isTextField(target)) {
        this.pendingClickCapture?.releaseFreeze();
        const captureId = `${this.guideId}:pointer:${performance.timeOrigin}:${pe.timeStamp}:${pe.pointerId}`;
        const releaseFreeze = freezeCaptureTarget(target);
        setTimeout(releaseFreeze, ABANDONED_FREEZE_TTL_MS);
        this.pendingClickCapture = {
          captureId,
          target,
          ready: sendMessage('prepareCapture', { captureId }),
          releaseFreeze,
        };
      }
    }

    this.dragStartX = pe.pageX;
    this.dragStartY = pe.pageY;
    this.dragStartElement = pe.target instanceof Element ? pe.target : null;
  }

  private onPointerUp(e: Event) {
    const pe = e as PointerEvent;
    if (this.dragStartX == null || this.dragStartY == null || !this.dragStartElement) {
      this.dragStartX = this.dragStartY = null;
      this.dragStartElement = null;
      return;
    }

    const dx = Math.abs(pe.pageX - this.dragStartX);
    const dy = Math.abs(pe.pageY - this.dragStartY);

    if (dx >= DRAG_MIN_PX || dy >= DRAG_MIN_PX) {
      const target = findFocusableAncestor(this.dragStartElement);
      if (!isTaskStitchElement(target)) this.enqueueCaptureAction('drag', target);
    }

    this.dragStartX = this.dragStartY = null;
    this.dragStartElement = null;
  }

  private onDragEnd(e: Event) {
    if (!e.target || !(e.target instanceof Element) || isTaskStitchElement(e.target)) return;
    this.enqueueCaptureAction('drag', findFocusableAncestor(e.target as Element));
  }

  async stop(): Promise<void> {
    for (const [event, handler, opts] of this.listeners) {
      window.removeEventListener(event, handler, opts);
    }
    this.pendingClickCapture?.releaseFreeze();
    this.pendingClickCapture = null;
    await this.queue.add(() => this.input.finalize());
    await this.queue.onIdle();
  }
}

export function startCapture(guideId: string, captureToken: string, isTopFrame = true): CaptureHandle {
  const controller = new CaptureController(guideId, captureToken, isTopFrame);
  return {
    stop: () => controller.stop(),
  };
}
