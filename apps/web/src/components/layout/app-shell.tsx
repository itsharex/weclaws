'use client';

import type { CSSProperties, ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bot, Menu, Plus } from 'lucide-react';
import { AccountMenu } from '@/components/layout/account-menu';
import { BrandLockup } from '@/components/layout/brand-lockup';
import { ConsoleToolbar } from '@/components/layout/console-toolbar';
import { useLocale } from '@/components/providers/locale-provider';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

interface AppShellProps {
  children: ReactNode;
  email: string;
  fastAgentCliVersion?: string | null;
  isAdmin: boolean;
}

interface AppShellNavProps {
  email: string;
  isAdmin: boolean;
  layout: 'rail' | 'sheet';
}

const DESKTOP_SHELL_MAX_WIDTH = '1480px';
const DESKTOP_SHELL_SIDE_PADDING = '1.5rem';
const DESKTOP_RAIL_LEFT_OFFSET = `max(${DESKTOP_SHELL_SIDE_PADDING}, calc((100vw - ${DESKTOP_SHELL_MAX_WIDTH}) / 2 + ${DESKTOP_SHELL_SIDE_PADDING}))`;

function AppShellNav({ email, isAdmin, layout }: AppShellNavProps) {
  const { t } = useLocale();
  const pathname = usePathname();
  const isBotsRoute = pathname === '/bots' || pathname.startsWith('/bots/');

  return (
    <div className="flex h-full min-h-0 flex-col gap-8" data-shell-nav={layout}>
      <div className="grid gap-8">
        <div className="grid gap-4">
          <BrandLockup
            className="items-center gap-4"
            labelClassName="leading-none"
            variant="rail"
          />
          <div className="grid gap-1.5">
            <strong className="text-xl font-semibold tracking-[-0.02em] text-foreground">
              {t((messages) => messages.shell.workspaceTitle)}
            </strong>
            <span className="max-w-[18rem] text-sm leading-6 text-muted-foreground">
              {t((messages) => messages.shell.workspaceDescription)}
            </span>
          </div>
        </div>

        <nav aria-label={t((messages) => messages.shell.workspaceTitle)} className="grid gap-3">
          <Link
            className={cn(
              'flex items-center gap-2 rounded-[1.15rem] px-4 py-3 text-sm font-medium transition-[background-color,color,box-shadow,border-color]',
              isBotsRoute
                ? 'border border-[color:var(--border-soft)]/80 bg-[color:var(--surface-elevated)]/88 text-foreground shadow-none'
                : 'bg-[color:var(--surface)]/64 text-foreground hover:bg-[color:var(--surface)]/78'
            )}
            href="/bots"
          >
            <Bot className="h-4 w-4" />
            {t((messages) => messages.shell.bots)}
          </Link>
          <Link href="/bots/new">
            <Button className="w-full justify-start" type="button">
              <Plus className="h-4 w-4" />
              {t((messages) => messages.shell.createBot)}
            </Button>
          </Link>
        </nav>
      </div>

      <div className="mt-auto pt-2" data-shell-nav-bottom="">
        <AccountMenu email={email} isAdmin={isAdmin} />
      </div>
    </div>
  );
}

export function AppShell({ children, email, fastAgentCliVersion, isAdmin }: AppShellProps) {
  const { t } = useLocale();
  const shellFrameStyle: CSSProperties & Record<'--shell-rail-left', string> = {
    '--shell-rail-left': DESKTOP_RAIL_LEFT_OFFSET,
  };

  const mobileNavigation = (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          aria-label={t((messages) => messages.shell.openNavigation)}
          size="icon"
          type="button"
          variant="outline"
        >
          <Menu className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent
        aria-describedby={undefined}
        className="flex h-full w-[min(88vw,20rem)] flex-col border-r-[color:var(--border-soft)]/50 bg-[color:var(--app-panel)]/92"
      >
        <SheetTitle className="sr-only">{t((messages) => messages.shell.workspaceTitle)}</SheetTitle>
        <AppShellNav email={email} isAdmin={isAdmin} layout="sheet" />
      </SheetContent>
    </Sheet>
  );

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,var(--chrome-glow-left),transparent_38%),radial-gradient(circle_at_top_right,var(--chrome-glow-right),transparent_30%),radial-gradient(circle_at_bottom_center,var(--chrome-glow-bottom),transparent_40%)]" />
      <div
        className="relative mx-auto grid min-h-screen max-w-[1480px] gap-5 px-4 py-4 lg:grid-cols-[260px_minmax(0,1fr)] lg:px-6 lg:py-5"
        data-shell-frame=""
        style={shellFrameStyle}
      >
        <aside className="hidden lg:block">
          <div
            className="flex flex-col rounded-[var(--radius-shell)] border border-[color:var(--border-soft)]/40 bg-[color:var(--app-panel)]/46 p-5 shadow-[var(--shadow-soft)] backdrop-blur-xl lg:fixed lg:left-[var(--shell-rail-left)] lg:top-5 lg:h-[calc(100vh-2.5rem)] lg:w-[260px]"
            data-shell-rail=""
          >
            <AppShellNav email={email} isAdmin={isAdmin} layout="rail" />
          </div>
        </aside>

        <div className="grid min-h-screen content-start gap-5">
          <ConsoleToolbar fastAgentCliVersion={fastAgentCliVersion} navigation={mobileNavigation} />

          <main className="grid content-start gap-8 rounded-[calc(var(--radius-shell)+0.1rem)] border border-[color:var(--border-soft)]/38 bg-[color:var(--surface)]/54 px-4 py-6 shadow-[var(--shadow-soft)] backdrop-blur-xl lg:px-8 lg:py-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
