const TRUSTED_QR_CODE_PROTOCOL = 'https:';
const TRUSTED_QR_CODE_HOSTNAME = 'liteapp.weixin.qq.com';
const TRUSTED_QR_CODE_PATH_PREFIX = '/q/';

export function normalizeTrustedQrCodeUrl(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  try {
    const parsed = new URL(value);

    if (parsed.protocol !== TRUSTED_QR_CODE_PROTOCOL) {
      return null;
    }

    if (parsed.hostname !== TRUSTED_QR_CODE_HOSTNAME) {
      return null;
    }

    if (!parsed.pathname.startsWith(TRUSTED_QR_CODE_PATH_PREFIX)) {
      return null;
    }

    return parsed.toString();
  } catch {
    return null;
  }
}

export function isTrustedQrCodeUrl(value: string | null | undefined): value is string {
  return normalizeTrustedQrCodeUrl(value) !== null;
}
