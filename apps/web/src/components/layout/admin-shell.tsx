'use client';

import type { CSSProperties, ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bot, Menu, Server, Ticket } from 'lucide-react';
import { AccountMenu } from '@/components/layout/account-menu';
import { BrandLockup } from '@/components/layout/brand-lockup';
import { LanguageSwitcher } from '@/components/layout/language-switcher';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { useLocale } from '@/components/providers/locale-provider';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

interface AdminShellProps {
  children: ReactNode;
  email: string;
}

interface AdminShellNavProps {
  email: string;
  layout: 'rail' | 'sheet';
}

const DESKTOP_SHELL_MAX_WIDTH = '1480px';
const DESKTOP_SHELL_SIDE_PADDING = '1.5rem';
const DESKTOP_RAIL_LEFT_OFFSET = `max(${DESKTOP_SHELL_SIDE_PADDING}, calc((100vw - ${DESKTOP_SHELL_MAX_WIDTH}) / 2 + ${DESKTOP_SHELL_SIDE_PADDING}))`;

function AdminShellNav({ email, layout }: AdminShellNavProps) {
  const { t } = useLocale();
  const pathname = usePathname();
  const isSandboxRuntimeRoute = pathname === '/admin/sandbox-runtime';
  const isInvitesRoute = pathname.startsWith('/admin/invites');

  return (
    <div className="flex h-full min-h-0 flex-col gap-8" data-admin-shell-nav={layout}>
      <div className="grid gap-8">
        <div className="grid gap-4">
          <BrandLockup
            className="items-center gap-4"
            labelClassName="leading-none"
            variant="rail"
          />
          <div className="grid gap-1.5">
            <strong className="text-xl font-semibold text-foreground">
              {t((messages) => messages.shell.adminWorkspaceTitle)}
            </strong>
            <span className="max-w-[18rem] text-sm leading-6 text-muted-foreground">
              {t((messages) => messages.shell.adminWorkspaceDescription)}
            </span>
          </div>
        </div>

        <nav aria-label={t((messages) => messages.shell.adminWorkspaceTitle)} className="grid gap-3">
          <AdminNavLink
            href="/admin/sandbox-runtime"
            icon={<Server className="h-4 w-4" />}
            isActive={isSandboxRuntimeRoute}
            label={t((messages) => messages.shell.adminSandboxRuntime)}
          />
          <AdminNavLink
            href="/admin/invites"
            icon={<Ticket className="h-4 w-4" />}
            isActive={isInvitesRoute}
            label={t((messages) => messages.shell.invites)}
          />
          <AdminNavLink
            href="/bots"
            icon={<Bot className="h-4 w-4" />}
            isActive={false}
            label={t((messages) => messages.shell.bots)}
          />
        </nav>
      </div>

      <div className="mt-auto pt-2" data-admin-shell-nav-bottom="">
        <AccountMenu email={email} isAdmin />
      </div>
    </div>
  );
}

interface AdminNavLinkProps {
  href: string;
  icon: ReactNode;
  isActive: boolean;
  label: string;
}

function AdminNavLink({ href, icon, isActive, label }: AdminNavLinkProps) {
  return (
    <Link
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'flex items-center gap-2 rounded-[1.15rem] px-4 py-3 text-sm font-medium transition-[background-color,color,box-shadow,border-color]',
        isActive
          ? 'border border-[color:var(--accent-strong)] bg-[color:var(--accent-strong)] text-[color:var(--accent-contrast)] shadow-[var(--shadow-raise)]'
          : 'bg-[color:var(--surface)]/64 text-foreground hover:bg-[color:var(--surface)]/78'
      )}
      href={href}
    >
      {icon}
      {label}
    </Link>
  );
}

export function AdminShell({ children, email }: AdminShellProps) {
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
        <SheetTitle className="sr-only">{t((messages) => messages.shell.adminWorkspaceTitle)}</SheetTitle>
        <AdminShellNav email={email} layout="sheet" />
      </SheetContent>
    </Sheet>
  );

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,var(--chrome-glow-left),transparent_38%),radial-gradient(circle_at_top_right,var(--chrome-glow-right),transparent_30%),radial-gradient(circle_at_bottom_center,var(--chrome-glow-bottom),transparent_40%)]" />
      <div
        className="relative mx-auto grid min-h-screen max-w-[1480px] gap-5 px-4 py-4 lg:grid-cols-[260px_minmax(0,1fr)] lg:px-6 lg:py-5"
        data-admin-shell-frame=""
        style={shellFrameStyle}
      >
        <aside className="hidden lg:block">
          <div
            className="flex flex-col rounded-[var(--radius-shell)] border border-[color:var(--border-soft)]/40 bg-[color:var(--app-panel)]/46 p-5 shadow-[var(--shadow-soft)] backdrop-blur-xl lg:fixed lg:left-[var(--shell-rail-left)] lg:top-5 lg:h-[calc(100vh-2.5rem)] lg:w-[260px]"
            data-admin-shell-rail=""
          >
            <AdminShellNav email={email} layout="rail" />
          </div>
        </aside>

        <div className="grid min-h-screen content-start gap-5">
          <header className="sticky top-4 z-20 rounded-[1.5rem] border border-[color:var(--border-soft)]/40 bg-[color:var(--surface)]/58 px-4 py-2.5 shadow-[var(--shadow-soft)] backdrop-blur-xl lg:px-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="lg:hidden">{mobileNavigation}</div>
                <span className="inline-flex h-9 items-center rounded-[0.95rem] border border-[color:var(--border-soft)]/60 bg-[color:var(--surface)]/72 px-3 text-xs font-semibold uppercase tracking-[0.12em] text-foreground">
                  {t((messages) => messages.shell.adminConsole)}
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2">
                <ThemeToggle />
                <LanguageSwitcher />
              </div>
            </div>
          </header>

          <main className="grid content-start gap-8 rounded-[calc(var(--radius-shell)+0.1rem)] border border-[color:var(--border-soft)]/38 bg-[color:var(--surface)]/54 px-4 py-6 shadow-[var(--shadow-soft)] backdrop-blur-xl lg:px-8 lg:py-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
