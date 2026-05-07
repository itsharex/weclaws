'use client';

import type { ReactNode } from 'react';
import { LanguageSwitcher } from '@/components/layout/language-switcher';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { useLocale } from '@/components/providers/locale-provider';

interface ConsoleToolbarProps {
  fastAgentCliVersion?: string | null;
  navigation?: ReactNode;
}

export function ConsoleToolbar({ fastAgentCliVersion, navigation }: ConsoleToolbarProps) {
  const { t } = useLocale();

  return (
    <header className="sticky top-4 z-20 rounded-[1.5rem] border border-[color:var(--border-soft)]/40 bg-[color:var(--surface)]/58 px-4 py-2.5 shadow-[var(--shadow-soft)] backdrop-blur-xl lg:px-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {navigation ? <div className="lg:hidden">{navigation}</div> : null}
          {fastAgentCliVersion ? (
            <span className="inline-flex h-9 items-center rounded-[0.95rem] border border-[color:var(--border-soft)]/60 bg-[color:var(--surface)]/72 px-3 text-xs font-semibold tracking-[0.01em] text-foreground">
              {t((messages) => messages.shell.fastAgentCliVersion)} v{fastAgentCliVersion}
            </span>
          ) : null}
          {!navigation && !fastAgentCliVersion ? <div aria-hidden className="hidden h-9 w-9 lg:block" /> : null}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <ThemeToggle />
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}
