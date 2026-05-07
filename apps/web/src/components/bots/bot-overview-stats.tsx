'use client';

import type { BotSummaryItem } from '@/lib/bot-service';
import { useLocale } from '@/components/providers/locale-provider';
interface BotOverviewStatsProps {
  bots: BotSummaryItem[];
}

export function BotOverviewStats({ bots }: BotOverviewStatsProps) {
  const { t } = useLocale();

  const stats = [
    {
      label: t((messages) => messages.botsList.total),
      value: bots.length,
    },
    {
      label: t((messages) => messages.botsList.running),
      value: bots.filter((bot) => bot.status === 'running').length,
    },
    {
      label: t((messages) => messages.botsList.waitingForQr),
      value: bots.filter((bot) => bot.status === 'waiting_for_qr').length,
    },
    {
      label: t((messages) => messages.botsList.unhealthy),
      value: bots.filter((bot) => bot.status === 'degraded' || bot.status === 'failed').length,
    },
  ];

  return (
    <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <div
          className="grid gap-2 rounded-[1.45rem] border border-[color:var(--border-soft)] bg-[color:var(--surface-muted)]/82 px-5 py-4 shadow-[var(--shadow-soft)]"
          key={stat.label}
        >
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[color:var(--text-soft)]">
            {stat.label}
          </span>
          <strong className="text-3xl font-semibold tracking-[-0.03em] text-foreground">{stat.value}</strong>
        </div>
      ))}
    </section>
  );
}
