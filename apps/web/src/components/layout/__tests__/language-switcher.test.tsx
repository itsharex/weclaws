// @vitest-environment jsdom

import * as React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import { LocaleProvider } from '@/components/providers/locale-provider';
import { LanguageSwitcher } from '../language-switcher';

const refreshMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

afterEach(() => {
  refreshMock.mockReset();
  document.cookie = 'locale=; Max-Age=0; path=/';
});

it('writes the locale cookie and refreshes the route', async () => {
  render(
    <LocaleProvider initialLocale="zh-CN">
      <LanguageSwitcher />
    </LocaleProvider>
  );

  await userEvent.click(screen.getByRole('button', { name: /english/i }));

  expect(document.cookie).toContain('locale=en');
  expect(refreshMock).toHaveBeenCalledTimes(1);
});
