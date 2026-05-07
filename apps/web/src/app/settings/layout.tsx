import type { ReactNode } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { isAdminEmail } from '@/lib/admin';
import { getFastAgentCliVersion } from '@/lib/fastagent-cli-version';
import { requireServerSession } from '@/lib/session';

interface SettingsLayoutProps {
  children: ReactNode;
}

export default async function SettingsLayout({ children }: SettingsLayoutProps) {
  const session = await requireServerSession();
  const fastAgentCliVersion = await getFastAgentCliVersion();

  return (
    <AppShell
      email={session.user.email}
      fastAgentCliVersion={fastAgentCliVersion}
      isAdmin={isAdminEmail(session.user.email)}
    >
      {children}
    </AppShell>
  );
}
