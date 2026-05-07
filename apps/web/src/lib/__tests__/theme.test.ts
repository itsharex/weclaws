import { describe, expect, it } from 'vitest';
import {
  DEFAULT_THEME,
  THEME_COOKIE_NAME,
  buildThemeCookie,
  resolveTheme,
} from '../theme';

describe('theme helpers', () => {
  it('falls back to light for unsupported values', () => {
    expect(resolveTheme('sepia')).toBe(DEFAULT_THEME);
    expect(resolveTheme(undefined)).toBe(DEFAULT_THEME);
  });

  it('preserves the dark theme when the cookie is set', () => {
    expect(resolveTheme('dark')).toBe('dark');
  });

  it('serializes a stable theme cookie', () => {
    expect(buildThemeCookie('dark')).toBe(
      `${THEME_COOKIE_NAME}=dark; Path=/; Max-Age=31536000; SameSite=Lax`,
    );
  });
});
