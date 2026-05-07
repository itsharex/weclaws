'use client';

import { useLocale } from '@/components/providers/locale-provider';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useLocale();

  return (
    <div
      className="inline-flex h-9 items-center rounded-[0.95rem] border border-[color:var(--border-soft)] bg-[color:var(--surface)]/88 p-0.5 shadow-[var(--shadow-soft)]"
      data-toolbar-control="language"
    >
      <Button
        className={cn(
          'h-8 rounded-[0.7rem] px-3 text-[11px] tracking-[0.01em]',
          locale === 'zh-CN'
            ? 'bg-[color:var(--surface-elevated)] text-foreground shadow-[0_8px_18px_rgba(54,40,27,0.08)]'
            : 'text-muted-foreground hover:bg-transparent hover:text-foreground'
        )}
        onClick={() => setLocale('zh-CN')}
        size="sm"
        type="button"
        variant="ghost"
      >
        {t((messages) => messages.shell.languageChinese)}
      </Button>
      <Button
        className={cn(
          'h-8 rounded-[0.7rem] px-3 text-[11px] tracking-[0.01em]',
          locale === 'en'
            ? 'bg-[color:var(--surface-elevated)] text-foreground shadow-[0_8px_18px_rgba(54,40,27,0.08)]'
            : 'text-muted-foreground hover:bg-transparent hover:text-foreground'
        )}
        onClick={() => setLocale('en')}
        size="sm"
        type="button"
        variant="ghost"
      >
        {t((messages) => messages.shell.languageEnglish)}
      </Button>
    </div>
  );
}
