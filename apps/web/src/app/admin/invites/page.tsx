import { AdminInvitesConsole } from '@/components/admin/admin-invites-console';
import { PageHeader } from '@/components/layout/page-header';
import { toAdminInviteItems } from '@/lib/admin-invites';
import { getMessages, getRequestLocale } from '@/lib/locale';
import { getRepositories } from '@/lib/repositories';

export const dynamic = 'force-dynamic';

export default async function AdminInvitesPage() {
  const locale = await getRequestLocale();
  const messages = getMessages(locale);
  const repositories = getRepositories();
  const invites = await repositories.registrationInvites.listRecent();
  const inviteItems = await toAdminInviteItems(invites, repositories);

  return (
    <section className="grid gap-8">
      <PageHeader
        description={messages.adminInvites.pageDescription}
        title={messages.adminInvites.pageTitle}
      />

      <AdminInvitesConsole
        invites={inviteItems}
      />
    </section>
  );
}
