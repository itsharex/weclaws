'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { buildLocaleCookie, getMessages, type Locale, type LocaleMessages } from '@/lib/locale';

interface LocaleContextValue {
  locale: Locale;
  messages: LocaleMessages;
  setLocale(nextLocale: Locale): void;
  t<T>(selector: (messages: LocaleMessages) => T): T;
}

const LocaleContext = React.createContext<LocaleContextValue | null>(null);

interface LocaleProviderProps {
  children: React.ReactNode;
  initialLocale: Locale;
}

export function LocaleProvider({ children, initialLocale }: LocaleProviderProps) {
  const router = useRouter();
  const [locale, setLocaleState] = React.useState<Locale>(initialLocale);

  const setLocale = React.useCallback((nextLocale: Locale) => {
    setLocaleState(nextLocale);
    document.cookie = buildLocaleCookie(nextLocale);
    router.refresh();
  }, [router]);

  const value = React.useMemo<LocaleContextValue>(() => {
    const localeMessages = getMessages(locale);

    return {
      locale,
      messages: localeMessages,
      setLocale,
      t: (selector) => selector(localeMessages),
    };
  }, [locale, setLocale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = React.useContext(LocaleContext);

  if (!context) {
    throw new Error('useLocale must be used within LocaleProvider.');
  }

  return context;
}
