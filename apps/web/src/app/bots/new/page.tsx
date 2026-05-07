import Link from 'next/link';
import { CreateBotForm } from '@/components/bots/create-bot-form';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { getBotCreationQuota } from '@/lib/bot-service';
import { listUserLlmProfiles } from '@/lib/llm-profiles';
import { getMessages, getRequestLocale } from '@/lib/locale';
import { requireServerSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

export default async function NewBotPage() {
  const locale = await getRequestLocale();
  const messages = getMessages(locale);
  const session = await requireServerSession();
  const [profiles, quota] = await Promise.all([
    listUserLlmProfiles(session.user.id),
    getBotCreationQuota(session.user.id),
  ]);

  return (
    <section className="grid max-w-5xl gap-6">
      <PageHeader
        actions={(
          <Button asChild type="button" variant="outline">
            <Link href="/bots">{messages.createBot.backToBots}</Link>
          </Button>
        )}
        description={messages.createBot.pageDescription}
        title={messages.createBot.pageTitle}
      />

      <div className="rounded-[1.6rem] border border-[color:var(--border-soft)] bg-[color:var(--surface)]/78 px-5 py-4 text-sm leading-7 text-muted-foreground shadow-[var(--shadow-soft)]">
        {messages.createBot.intro}
      </div>

      <div>
        <CreateBotForm profiles={profiles} quota={quota} />
      </div>
    </section>
  );
}
