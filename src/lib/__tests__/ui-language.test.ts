import { describe, expect, it } from 'vitest';
import { formatLocalizedMessage } from '../ui-language';

describe('interface language messages', () => {
  it('applies Chrome-style positional substitutions', () => {
    expect(formatLocalizedMessage('$1 / $2 ステップ', [2, 5])).toBe('2 / 5 ステップ');
  });

  it('leaves missing substitutions intact', () => {
    expect(formatLocalizedMessage('Step $1 of $2', [3])).toBe('Step 3 of $2');
  });
});
