// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { InputSession } from '../input-session';

const mocks = vi.hoisted(() => ({
  sendMessage: vi.fn(),
}));

vi.mock('@/lib/messaging', () => ({
  sendMessage: mocks.sendMessage,
}));

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolver) => {
    resolve = resolver;
  });
  return { promise, resolve };
}

function createInput() {
  const input = document.createElement('input');
  input.placeholder = 'e.g., Sales, Marketing';
  document.body.appendChild(input);
  return input;
}

describe('InputSession', () => {
  beforeEach(() => {
    document.body.replaceChildren();
    vi.clearAllMocks();
  });

  it('creates one step when start is requested repeatedly for the same field', async () => {
    const capture = deferred<{ stepId: string }>();
    mocks.sendMessage.mockImplementation((message: string) => {
      if (message === 'captureStep') return capture.promise;
      return Promise.resolve({ updated: true });
    });
    const input = createInput();
    const session = new InputSession('guide-1');

    const first = session.start(input);
    const duplicate = session.start(input);

    expect(session.active).toBe(true);
    expect(duplicate).toBe(first);
    expect(mocks.sendMessage).toHaveBeenCalledTimes(1);

    capture.resolve({ stepId: 'step-1' });
    await Promise.all([first, duplicate]);
    await session.start(input);

    expect(mocks.sendMessage).toHaveBeenCalledTimes(1);
    expect(session.stepId).toBe('step-1');
  });

  it('applies the latest typed value after the pending step is created', async () => {
    const capture = deferred<{ stepId: string }>();
    mocks.sendMessage.mockImplementation((message: string) => {
      if (message === 'captureStep') return capture.promise;
      return Promise.resolve({ updated: true });
    });
    const input = createInput();
    const session = new InputSession('guide-1');

    const starting = session.start(input);
    input.value = 'Test';
    session.update(input);
    input.value = 'Test Group';
    session.update(input);

    capture.resolve({ stepId: 'step-1' });
    await starting;

    expect(mocks.sendMessage).toHaveBeenCalledTimes(2);
    expect(mocks.sendMessage).toHaveBeenLastCalledWith('updateInputStep', {
      guideId: 'guide-1',
      captureToken: '',
      stepId: 'step-1',
      description: 'Type "Test Group" in e.g., Sales, Marketing',
      inputValue: 'Test Group',
    });
  });

  it('captures a password-field step without sending the password value', async () => {
    const capture = deferred<{ stepId: string }>();
    mocks.sendMessage.mockImplementation((message: string) => {
      if (message === 'captureStep') return capture.promise;
      return Promise.resolve({ updated: true });
    });
    const input = createInput();
    input.type = 'password';
    input.placeholder = 'Account password';
    input.value = 'secret';
    const session = new InputSession('guide-1');

    const starting = session.start(input);
    session.update(input);
    capture.resolve({ stepId: 'step-1' });
    await starting;
    await session.finalize();

    const update = mocks.sendMessage.mock.calls[1];
    expect(update).toEqual([
      'updateInputStep',
      expect.objectContaining({
        stepId: 'step-1',
        description: 'Enter a password in Account password',
      }),
    ]);
    expect(update[1]).not.toHaveProperty('inputValue');
    expect(mocks.sendMessage).toHaveBeenLastCalledWith(
      'finalizeInputStep',
      expect.objectContaining({ stepId: 'step-1' }),
    );
    expect(JSON.stringify(mocks.sendMessage.mock.calls)).not.toContain('secret');
  });
});
