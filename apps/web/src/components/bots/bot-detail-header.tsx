'use client';

import { useLocale } from '@/components/providers/locale-provider';
import { Badge } from '@/components/ui/badge';
import { LocalizedDateTime } from '@/components/ui/localized-date-time';
import type { BotDetailItem } from '@/lib/bot-service';
import {
  getDesiredStatePresentation,
  getRuntimeStatusPresentation,
  type PresentationTone,
} from '@/lib/bot-status-presentation';

interface BotDetailHeaderProps {
  bot: BotDetailItem;
}

export function BotDetailHeader({ bot }: BotDetailHeaderProps) {
  const { locale, t } = useLocale();
  const runtimePresentation = getRuntimeStatusPresentation(bot.status, locale);
  const desiredPresentation = getDesiredStatePresentation(bot.desiredState, locale);
  const unavailable = t((messages) => messages.common.unavailable);

  const runtimeRows = [
    {
      label: t((messages) => messages.botDetail.statusLabel),
      value: runtimePresentation.label,
    },
    {
      label: t((messages) => messages.botDetail.desiredStateLabel),
      value: desiredPresentation.label,
    },
    {
      label: t((messages) => messages.botDetail.lastHeartbeat),
      value: <LocalizedDateTime locale={locale} unavailableLabel={unavailable} value={bot.heartbeatAt} />,
    },
    {
      label: t((messages) => messages.botDetail.processState),
      value: bot.processPid === null ? unavailable : `PID ${bot.processPid}`,
    },
    {
      label: t((messages) => messages.botDetail.latestError),
      value: formatError(bot, unavailable),
    },
  ];

  const metadataRows = [
    {
      label: t((messages) => messages.botDetail.workspaceId),
      value: bot.workspaceId || unavailable,
    },
    {
      label: t((messages) => messages.botDetail.weixinAccount),
      value: bot.weixinAccountId || unavailable,
    },
    {
      label: t((messages) => messages.botDetail.restartRequested),
      value: <LocalizedDateTime locale={locale} unavailableLabel={unavailable} value={bot.restartRequestedAt} />,
    },
    {
      label: t((messages) => messages.botDetail.errorCode),
      value: bot.lastErrorCode || unavailable,
    },
  ];

  return (
    <section className="grid gap-5 rounded-[1.9rem] border border-[color:var(--border-soft)]/80 bg-[color:var(--surface)]/82 p-6 shadow-[var(--shadow-panel)]">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div className="grid gap-3">
          <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.22em] text-[color:var(--text-soft)]">
            {t((messages) => messages.botDetail.headerDescription)}
          </p>
          <h2 className="m-0 text-3xl font-semibold tracking-[-0.03em] text-foreground lg:text-[2.6rem]">{bot.name}</h2>
          <p className="m-0 text-sm leading-6 text-muted-foreground">
            {bot.provider} / {bot.model}
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5 lg:justify-end">
          <Badge variant={toBadgeVariant(runtimePresentation.tone)}>{runtimePresentation.label}</Badge>
          <Badge variant={toBadgeVariant(desiredPresentation.tone)}>{desiredPresentation.label}</Badge>
        </div>
      </div>

      <div
        className="grid gap-5 rounded-[1.5rem] border border-[color:var(--border-soft)]/75 bg-[color:var(--surface-muted)]/82 p-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]"
        data-bot-detail-summary=""
      >
        <div className="grid gap-4">
          <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.22em] text-[color:var(--text-soft)]">
            {t((messages) => messages.botDetail.currentRuntimeStatus)}
          </p>
          <dl className="grid gap-3 sm:grid-cols-2">
            {runtimeRows.map((row) => (
              <div className="grid gap-1" key={row.label}>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--text-soft)]">{row.label}</dt>
                <dd className="m-0 text-sm text-foreground">{row.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="grid gap-4 border-t border-[color:var(--border-soft)]/70 pt-5 xl:border-l xl:border-t-0 xl:pl-5 xl:pt-0">
          <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.22em] text-[color:var(--text-soft)]">
            {t((messages) => messages.botDetail.metadata)}
          </p>
          <dl className="grid gap-3 sm:grid-cols-2">
            {metadataRows.map((row) => (
              <div className="grid gap-1" key={row.label}>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--text-soft)]">{row.label}</dt>
                <dd className="m-0 break-all font-mono text-sm text-foreground">{row.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

function formatError(bot: BotDetailItem, unavailableLabel: string) {
  if (!bot.lastErrorCode && !bot.lastErrorMessage) {
    return unavailableLabel;
  }

  if (bot.lastErrorCode && bot.lastErrorMessage) {
    return `${bot.lastErrorCode}: ${bot.lastErrorMessage}`;
  }

  return bot.lastErrorCode ?? bot.lastErrorMessage ?? unavailableLabel;
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
