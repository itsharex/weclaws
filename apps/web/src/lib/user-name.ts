const FALLBACK_USER_NAME = 'user';

export function getDefaultUserName(email: string): string {
  const [prefix] = email.split('@');
  const sanitized = prefix.trim().replace(/\s+/g, '-');

  return sanitized.length > 0 ? sanitized : FALLBACK_USER_NAME;
}
