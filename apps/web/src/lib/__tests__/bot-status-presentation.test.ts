import { describe, expect, it } from 'vitest';
import { getDesiredStatePresentation, getRuntimeStatusPresentation } from '../bot-status-presentation';

describe('getRuntimeStatusPresentation', () => {
  it('maps waiting_for_qr to the attention bucket', () => {
    expect(getRuntimeStatusPresentation('waiting_for_qr', 'zh-CN').tone).toBe('attention');
  });

  it('maps unknown values to the neutral unknown label', () => {
    expect(getRuntimeStatusPresentation('mystery', 'en').label).toBe('Unknown');
  });

  it('returns translated desired-state labels separately from runtime status', () => {
    expect(getDesiredStatePresentation('running', 'en').label).toContain('Target');
  });
});
