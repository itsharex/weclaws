'use client';

import { normalizeTrustedQrCodeUrl } from '@weclaws/shared';
import { useLocale } from '@/components/providers/locale-provider';
import { SectionCard } from '@/components/layout/section-card';
import { Button } from '@/components/ui/button';

interface QrCodePanelProps {
  embedded?: boolean;
  qrCodeId: string | null;
  qrCodeUrl: string | null;
}

export function QrCodePanel({ embedded = false, qrCodeId, qrCodeUrl }: QrCodePanelProps) {
  const { t } = useLocale();
  const trustedQrCodeUrl = normalizeTrustedQrCodeUrl(qrCodeUrl);
  const qrPreviewUrl = trustedQrCodeUrl ? `/api/qrcode?value=${encodeURIComponent(trustedQrCodeUrl)}` : null;
  const content = trustedQrCodeUrl ? (
    <div className="grid gap-4">
      {qrPreviewUrl ? (
        <div className="grid place-items-center rounded-[1.4rem] border border-[color:var(--border-soft)] bg-[color:var(--surface-elevated)] p-4">
          <img
            alt={qrCodeId ?? 'Weixin QR code'}
            className="w-full max-w-[320px] rounded-[1.2rem] border border-[color:var(--border-soft)] bg-white"
            src={qrPreviewUrl}
          />
        </div>
      ) : null}

      <div className="grid gap-2 text-sm leading-6 text-muted-foreground">
        {qrCodeId ? (
          <p className="m-0">
            {t((messages) => messages.botDetail.qrId)}: <span className="font-mono text-foreground">{qrCodeId}</span>
          </p>
        ) : null}
        <p className="m-0">
          {qrCodeId
            ? t((messages) => messages.botDetail.qrSourcePair)
            : t((messages) => messages.botDetail.qrSourceUrlOnly)}
        </p>
        <p className="m-0">{t((messages) => messages.botDetail.qrPreviewDescription)}</p>
      </div>

      <div>
        <Button asChild type="button" variant="outline">
          <a href={trustedQrCodeUrl} rel="noreferrer" target="_blank">
            {t((messages) => messages.botDetail.openQrPage)}
          </a>
        </Button>
      </div>
    </div>
  ) : (
    <div className="grid gap-2 rounded-[1.25rem] border border-dashed border-[color:var(--border-strong)]/75 bg-[color:var(--surface-muted)]/72 px-5 py-6">
      <strong className="text-base font-semibold text-foreground">{t((messages) => messages.botDetail.noQrTitle)}</strong>
      <p className="m-0 text-sm leading-6 text-muted-foreground">{t((messages) => messages.botDetail.noQrDescription)}</p>
    </div>
  );

  if (embedded) {
    return content;
  }

  return (
    <SectionCard title={t((messages) => messages.botDetail.qrCode)}>
      {content}
    </SectionCard>
  );
}
