import type { ReactElement } from 'react';
import { render } from '@testing-library/react';
import { LocaleProvider } from '@/components/providers/locale-provider';
import type { Locale } from '@/lib/locale';

interface RenderWithLocaleOptions {
  locale?: Locale;
}

export function renderWithLocale(ui: ReactElement, options: RenderWithLocaleOptions = {}) {
  const { locale = 'zh-CN' } = options;

  return render(
    <LocaleProvider initialLocale={locale}>
      {ui}
    </LocaleProvider>
  );
}
