// @vitest-environment jsdom

import * as React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import { LocaleProvider } from '@/components/providers/locale-provider';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { ThemeToggle } from '../theme-toggle';

const refreshMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

afterEach(() => {
  refreshMock.mockReset();
  document.cookie = 'theme=; Max-Age=0; path=/';
  delete document.documentElement.dataset.theme;
});

it('writes the theme cookie, updates the document theme, and refreshes the route', async () => {
  render(
    <ThemeProvider initialTheme="light">
      <LocaleProvider initialLocale="en">
        <ThemeToggle />
      </LocaleProvider>
    </ThemeProvider>
  );

  await userEvent.click(screen.getByRole('button', { name: 'Dark' }));

  expect(document.cookie).toContain('theme=dark');
  expect(document.documentElement.dataset.theme).toBe('dark');
  expect(refreshMock).toHaveBeenCalledTimes(1);
});
