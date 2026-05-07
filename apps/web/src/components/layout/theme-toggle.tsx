'use client';

import { useLocale } from '@/components/providers/locale-provider';
import { useTheme } from '@/components/providers/theme-provider';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function ThemeToggle() {
  const { t } = useLocale();
  const { setTheme, theme } = useTheme();

  return (
    <div
      className="inline-flex h-9 items-center rounded-[0.95rem] border border-[color:var(--border-soft)] bg-[color:var(--surface)]/88 p-0.5 shadow-[var(--shadow-soft)]"
      data-toolbar-control="theme"
    >
      <Button
        aria-pressed={theme === 'light'}
        className={cn(
          'h-8 rounded-[0.7rem] px-3 text-[11px] tracking-[0.01em]',
          theme === 'light'
            ? 'bg-[color:var(--surface-elevated)] text-foreground shadow-[0_8px_18px_rgba(54,40,27,0.08)]'
            : 'text-muted-foreground hover:bg-transparent hover:text-foreground'
        )}
        onClick={() => setTheme('light')}
        size="sm"
        type="button"
        variant="ghost"
      >
        {t((messages) => messages.shell.themeLight)}
      </Button>
      <Button
        aria-pressed={theme === 'dark'}
        className={cn(
          'h-8 rounded-[0.7rem] px-3 text-[11px] tracking-[0.01em]',
          theme === 'dark'
            ? 'bg-[color:var(--surface-elevated)] text-foreground shadow-[0_8px_18px_rgba(54,40,27,0.08)]'
            : 'text-muted-foreground hover:bg-transparent hover:text-foreground'
        )}
        onClick={() => setTheme('dark')}
        size="sm"
        type="button"
        variant="ghost"
      >
        {t((messages) => messages.shell.themeDark)}
      </Button>
    </div>
  );
}
