import type { AppMessages } from './messages';
import { messages } from './messages';

export const LOCALE_COOKIE_NAME = 'locale';
export const DEFAULT_LOCALE = 'zh-CN';
export const SUPPORTED_LOCALES = ['zh-CN', 'en'] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];
export type LocaleMessages = AppMessages[Locale];

export function resolveLocale(value: string | null | undefined): Locale {
  return value === 'en' ? 'en' : DEFAULT_LOCALE;
}

export async function getRequestLocale(): Promise<Locale> {
  const [{ cookies }] = await Promise.all([import('next/headers')]);
  const cookieStore = await cookies();
  return resolveLocale(cookieStore.get(LOCALE_COOKIE_NAME)?.value);
}

export function buildLocaleCookie(locale: Locale) {
  return `${LOCALE_COOKIE_NAME}=${locale}; Path=/; Max-Age=31536000; SameSite=Lax`;
}

export function getMessages(locale: Locale): LocaleMessages {
  return messages[locale];
}
