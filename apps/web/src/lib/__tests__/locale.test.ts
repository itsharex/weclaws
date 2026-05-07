import { describe, expect, it } from 'vitest';
import { DEFAULT_LOCALE, resolveLocale } from '../locale';

describe('resolveLocale', () => {
  it('falls back to zh-CN for unsupported values', () => {
    expect(resolveLocale('fr')).toBe(DEFAULT_LOCALE);
  });

  it('preserves en when the cookie is set', () => {
    expect(resolveLocale('en')).toBe('en');
  });
});
