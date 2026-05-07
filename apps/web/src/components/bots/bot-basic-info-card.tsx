'use client';

import type { FormEvent } from 'react';
import { useEffect, useState, useTransition } from 'react';
import { useLocale } from '@/components/providers/locale-provider';
import { SectionCard } from '@/components/layout/section-card';
import { Button } from '@/components/ui/button';
import { ErrorNotice } from '@/components/ui/error-notice';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { BotDetailItem } from '@/lib/bot-service';

interface BotBasicInfoCardProps {
  bot: BotDetailItem;
  onBotUpdated(bot: BotDetailItem): void;
}

interface UpdateBotResponse {
  data: BotDetailItem | null;
  error: {
    code: string;
    message: string;
  } | null;
}

function RequiredIndicator() {
  return (
    <span aria-hidden="true" className="text-[color:var(--text-soft)]" data-required-indicator="">
      {' *'}
    </span>
  );
}

export function BotBasicInfoCard({ bot, onBotUpdated }: BotBasicInfoCardProps) {
  const { t } = useLocale();
  const nameLabel = t((messages) => messages.botDetail.botNameLabel);
  const [name, setName] = useState(bot.name);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const trimmedName = name.trim();
  const canSubmit = Boolean(trimmedName) && trimmedName !== bot.name.trim() && !isPending;

  useEffect(() => {
    setName(bot.name);
  }, [bot.name]);

  return (
    <SectionCard
      contentClassName="grid gap-4"
      description={t((messages) => messages.botDetail.basicInfoDescription)}
      title={t((messages) => messages.botDetail.basicInfoTitle)}
    >
      <form className="grid gap-4" onSubmit={handleSubmit}>
        <Label className="grid gap-2.5 text-sm font-medium text-foreground">
          <span>
            {nameLabel}
            <RequiredIndicator />
          </span>
          <Input
            aria-label={nameLabel}
            name="name"
            onChange={(event) => setName(event.target.value)}
            required
            type="text"
            value={name}
          />
        </Label>

        <Button disabled={!canSubmit} type="submit">
          {isPending
            ? t((messages) => messages.botDetail.saveBotInfoPending)
            : t((messages) => messages.botDetail.saveBotInfo)}
        </Button>

        {errorMessage ? <ErrorNotice>{errorMessage}</ErrorNotice> : null}
      </form>
    </SectionCard>
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSubmit) {
      return;
    }

    setErrorMessage(null);

    startTransition(async () => {
      try {
        const response = await fetch(`/api/bots/${bot.id}`, {
          body: JSON.stringify({ name: trimmedName }),
          headers: {
            'content-type': 'application/json',
          },
          method: 'PATCH',
        });
        const payload = (await response.json()) as UpdateBotResponse;

        if (!response.ok || !payload.data) {
          setErrorMessage(payload.error?.message ?? t((messages) => messages.botDetail.saveBotInfoFailed));
          return;
        }

        setName(payload.data.name);
        onBotUpdated(payload.data);
      } catch {
        setErrorMessage(t((messages) => messages.botDetail.saveBotInfoFailed));
      }
    });
  }
}
