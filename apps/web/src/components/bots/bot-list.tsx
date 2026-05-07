'use client';

import Link from 'next/link';
import { useLocale } from '@/components/providers/locale-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LocalizedDateTime } from '@/components/ui/localized-date-time';
import {
  getDesiredStatePresentation,
  getRuntimeStatusPresentation,
  type PresentationTone,
} from '@/lib/bot-status-presentation';
import type { BotSummaryItem } from '@/lib/bot-service';

interface BotListProps {
  bots: BotSummaryItem[];
}

export function BotList({ bots }: BotListProps) {
  const { locale, t } = useLocale();

  return (
    <ul className="grid gap-3">
      {bots.map((bot) => {
        const runtimePresentation = getRuntimeStatusPresentation(bot.status, locale);
        const desiredPresentation = getDesiredStatePresentation(bot.desiredState, locale);

        return (
          <li className="list-none" key={bot.id}>
            <Card className="border-[color:var(--border-soft)] bg-[color:var(--surface)]/94">
              <CardContent className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                <div className="grid gap-3">
                  <div className="grid gap-2">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <strong className="text-xl font-semibold tracking-[-0.02em] text-foreground">{bot.name}</strong>
                      <Badge variant={toBadgeVariant(runtimePresentation.tone)}>{runtimePresentation.label}</Badge>
                      <Badge variant={toBadgeVariant(desiredPresentation.tone)}>{desiredPresentation.label}</Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {bot.provider} / {bot.model}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
                    <span>
                      <RecencyText
                        bot={bot}
                        locale={locale}
                        unavailableLabel={t((messages) => messages.common.unavailable)}
                        createdLabel={t((messages) => messages.botsList.created)}
                        updatedLabel={t((messages) => messages.botsList.updated)}
                      />
                    </span>
                    <span className="font-mono text-[13px] text-[color:var(--text-soft)]">
                      {t((messages) => messages.botsList.workspace)}: {bot.workspaceId}
                    </span>
                  </div>
                </div>

                <Button asChild className="justify-center" variant="outline">
                  <Link href={`/bots/${bot.id}`}>{t((messages) => messages.botsList.open)}</Link>
                </Button>
              </CardContent>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}

interface RecencyTextProps {
  bot: BotSummaryItem;
  locale: string;
  updatedLabel: string;
  createdLabel: string;
  unavailableLabel: string;
}

function RecencyText({
  bot,
  locale,
  updatedLabel,
  createdLabel,
  unavailableLabel,
}: RecencyTextProps) {
  const value = bot.updatedAt || bot.createdAt;
  const label = bot.updatedAt ? updatedLabel : createdLabel;

  return (
    <>
      {label}:{' '}
      <LocalizedDateTime locale={locale} unavailableLabel={unavailableLabel} value={value} />
    </>
  );
}

function toBadgeVariant(tone: PresentationTone) {
  if (tone === 'success') {
    return 'success';
  }

  if (tone === 'attention') {
    return 'warning';
  }

  if (tone === 'danger') {
    return 'danger';
  }

  return 'neutral';
}
