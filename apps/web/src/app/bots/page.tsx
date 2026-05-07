import Link from 'next/link';
import { BotsConsole } from '@/components/bots/bots-console';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { buildBotCreationQuota, listBots } from '@/lib/bot-service';
import { getMessages, getRequestLocale } from '@/lib/locale';
import { requireServerSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

export default async function BotsPage() {
  const locale = await getRequestLocale();
  const messages = getMessages(locale);
  const session = await requireServerSession();
  const bots = await listBots(session.user.id);
  const quota = buildBotCreationQuota(bots.length);

  return (
    <section className="grid gap-8">
      <PageHeader
        actions={(
          <Button asChild>
            <Link href="/bots/new">{messages.shell.createBot}</Link>
          </Button>
        )}
        description={messages.botsList.pageDescription}
        title={messages.botsList.pageTitle}
      />

      <BotsConsole bots={bots} quota={quota} />
    </section>
  );
}
