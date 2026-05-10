'use client';

import { useEffect, useState, useTransition } from 'react';
import { useLocale } from '@/components/providers/locale-provider';
import { SectionCard } from '@/components/layout/section-card';
import { Button } from '@/components/ui/button';
import { ErrorNotice } from '@/components/ui/error-notice';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { BotDetailItem } from '@/lib/bot-service';
import type { LlmProfileItem } from '@/lib/llm-profiles';

interface BotLlmProfileCardProps {
  bot: BotDetailItem;
  embedded?: boolean;
  onBotUpdated(bot: BotDetailItem): void;
  profiles: LlmProfileItem[];
}

interface UpdateBotLlmProfileResponse {
  data: BotDetailItem | null;
  error: {
    code: string;
    message: string;
  } | null;
}

export function BotLlmProfileCard({
  bot,
  embedded = false,
  onBotUpdated,
  profiles,
}: BotLlmProfileCardProps) {
  const { t } = useLocale();
  const [selectedProfileId, setSelectedProfileId] = useState(bot.llmConfigId ?? profiles[0]?.id ?? '');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const selectedProfile = profiles.find((profile) => profile.id === selectedProfileId) ?? null;
  const canApply = Boolean(selectedProfileId) && selectedProfileId !== bot.llmConfigId;

  useEffect(() => {
    setSelectedProfileId(bot.llmConfigId ?? profiles[0]?.id ?? '');
  }, [bot.llmConfigId, profiles]);

  const content = (
    <div className="grid gap-3">
      <div className="grid gap-1 rounded-[1.2rem] border border-[color:var(--border-soft)]/80 bg-[color:var(--surface-muted)]/72 px-4 py-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--text-soft)]">
          {t((messages) => messages.botDetail.currentProfile)}
        </span>
        <strong className="text-sm text-foreground">{bot.llmProfileName ?? t((messages) => messages.common.unavailable)}</strong>
        <span className="text-sm text-muted-foreground">
          {bot.provider} / {bot.model}
        </span>
      </div>

      <Label className="grid gap-2.5 text-sm font-medium text-foreground">
        {t((messages) => messages.botDetail.llmProfileLabel)}
        <Select onValueChange={setSelectedProfileId} value={selectedProfileId}>
          <SelectTrigger aria-label={t((messages) => messages.botDetail.llmProfileLabel)}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {profiles.map((profile) => (
              <SelectItem key={profile.id} value={profile.id}>
                {profile.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Label>

      {selectedProfile ? (
        <p className="m-0 text-sm text-muted-foreground">
          {selectedProfile.provider} / {selectedProfile.model}
        </p>
      ) : null}

      <Button disabled={isPending || !canApply} onClick={applyProfile} type="button">
        {isPending
          ? t((messages) => messages.botDetail.applyProfilePending)
          : t((messages) => messages.botDetail.applyProfile)}
      </Button>

      {errorMessage ? <ErrorNotice>{errorMessage}</ErrorNotice> : null}
    </div>
  );

  if (embedded) {
    return content;
  }

  return (
    <SectionCard
      contentClassName="grid gap-4"
      description={t((messages) => messages.botDetail.llmProfileDescription)}
      title={t((messages) => messages.botDetail.llmProfileTitle)}
    >
      {content}
    </SectionCard>
  );

  function applyProfile() {
    if (!selectedProfileId || !canApply) {
      return;
    }

    setErrorMessage(null);

    startTransition(async () => {
      try {
        const response = await fetch(`/api/bots/${bot.id}/llm-profile`, {
          body: JSON.stringify({
            llmProfileId: selectedProfileId,
          }),
          headers: {
            'content-type': 'application/json',
          },
          method: 'PATCH',
        });
        const payload = (await response.json()) as UpdateBotLlmProfileResponse;

        if (!response.ok || !payload.data) {
          setErrorMessage(payload.error?.message ?? t((messages) => messages.botDetail.profileSwitchFailed));
          return;
        }

        onBotUpdated(payload.data);
      } catch {
        setErrorMessage(t((messages) => messages.botDetail.profileSwitchFailed));
      }
    });
  }
}
