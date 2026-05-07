'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { buildThemeCookie, type Theme } from '@/lib/theme';

interface ThemeContextValue {
  setTheme(nextTheme: Theme): void;
  theme: Theme;
}

const ThemeContext = React.createContext<ThemeContextValue | null>(null);

interface ThemeProviderProps {
  children: React.ReactNode;
  initialTheme: Theme;
}

export function ThemeProvider({ children, initialTheme }: ThemeProviderProps) {
  const router = useRouter();
  const [theme, setThemeState] = React.useState<Theme>(initialTheme);

  React.useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const setTheme = (nextTheme: Theme) => {
    setThemeState(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    document.cookie = buildThemeCookie(nextTheme);
    router.refresh();
  };

  return (
    <ThemeContext.Provider
      value={{
        setTheme,
        theme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = React.useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider.');
  }

  return context;
}
