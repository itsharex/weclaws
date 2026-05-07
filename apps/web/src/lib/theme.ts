export const THEME_COOKIE_NAME = 'theme';
export const DEFAULT_THEME = 'light';
export const SUPPORTED_THEMES = ['light', 'dark'] as const;

export type Theme = (typeof SUPPORTED_THEMES)[number];

export function resolveTheme(value: string | null | undefined): Theme {
  return value === 'dark' ? 'dark' : DEFAULT_THEME;
}

export async function getRequestTheme(): Promise<Theme> {
  const [{ cookies }] = await Promise.all([import('next/headers')]);
  const cookieStore = await cookies();

  return resolveTheme(cookieStore.get(THEME_COOKIE_NAME)?.value);
}

export function buildThemeCookie(theme: Theme) {
  return `${THEME_COOKIE_NAME}=${theme}; Path=/; Max-Age=31536000; SameSite=Lax`;
}
