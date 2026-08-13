import { logger } from '@/lib/logger';
import { sendMessage } from '@/lib/messaging';
import { extractDOMContext } from '../dom/context';
import { extractElementMeta } from '../dom/element-meta';
import { getFieldLabel, getFieldValue, isPasswordField } from '../dom/element-utils';

export class InputSession {
  stepId: string | null = null;
  target: HTMLElement | null = null;

  private guideId: string;
  private startPromise: Promise<void> | null = null;
  private pendingUpdate: { description: string; inputValue?: string } | null = null;

  constructor(
    guideId: string,
    private captureToken = '',
  ) {
    this.guideId = guideId;
  }

  get active() {
    return this.target !== null;
  }

  start(target: HTMLElement): Promise<void> {
    if (this.target === target) {
      if (this.startPromise) return this.startPromise;
      if (this.stepId) return Promise.resolve();
    }

    this.target = target;
    const promise = this.createStep(target).finally(() => {
      if (this.startPromise === promise) this.startPromise = null;
    });
    this.startPromise = promise;
    return promise;
  }

  private async createStep(target: HTMLElement): Promise<void> {
    try {
      const res = await sendMessage('captureStep', {
        guideId: this.guideId,
        captureToken: this.captureToken,
        pageUrl: window.location.href,
        action: 'input',
        elementMeta: extractElementMeta(target),
        domContext: extractDOMContext(target, 'input'),
      });
      if ('stepId' in res) {
        this.stepId = res.stepId;
        const pending = this.pendingUpdate;
        this.pendingUpdate = null;
        if (pending) this.sendUpdate(pending.description, pending.inputValue);
      }
    } finally {
      if (!this.stepId && this.target === target) {
        this.target = null;
        this.pendingUpdate = null;
      }
    }
  }

  update(target: HTMLElement) {
    if (this.target !== target) return;
    if (isPasswordField(target)) {
      const description = `Enter a password in ${getFieldLabel(target)}`;
      if (!this.stepId) {
        this.pendingUpdate = { description };
        return;
      }
      this.sendUpdate(description);
      return;
    }
    const val = getFieldValue(target);
    const desc = val ? `Type "${val}" in ${getFieldLabel(target)}` : `Clear ${getFieldLabel(target)}`;
    if (!this.stepId) {
      this.pendingUpdate = { description: desc, inputValue: val || undefined };
      return;
    }
    this.sendUpdate(desc, val || undefined);
  }

  private sendUpdate(description: string, inputValue?: string) {
    if (!this.stepId) return;
    sendMessage('updateInputStep', {
      guideId: this.guideId,
      captureToken: this.captureToken,
      stepId: this.stepId,
      description,
      ...(inputValue === undefined ? {} : { inputValue }),
    }).catch((err) => logger.warn('Failed to update input step', err));
  }

  async finalize() {
    if (!this.target || !this.stepId) return;
    const target = this.target;
    const stepId = this.stepId;
    this.stepId = null;
    this.target = null;
    this.pendingUpdate = null;
    await sendMessage('finalizeInputStep', {
      guideId: this.guideId,
      captureToken: this.captureToken,
      stepId,
      elementMeta: extractElementMeta(target),
      domContext: extractDOMContext(target, 'input'),
    });
  }
}
