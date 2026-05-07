import { ApiError } from './api-error';
import { getEnv } from './env';
import { requireRequestSession, requireServerSession, type AuthSession } from './session';

export function parseAdminEmails(value: string | null | undefined): string[] {
  if (!value) {
    return [];
  }

  return value
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function getAdminEmails(): string[] {
  return parseAdminEmails(getEnv().WEB_ADMIN_EMAILS);
}

export function isAdminEmail(email: string | null | undefined, adminEmails: string[] = getAdminEmails()): boolean {
  if (!email) {
    return false;
  }

  return adminEmails.includes(email.trim().toLowerCase());
}

export function requireAdminEmail(email: string | null | undefined, adminEmails: string[] = getAdminEmails()): string {
  if (!isAdminEmail(email, adminEmails)) {
    throw new ApiError({
      code: 'FORBIDDEN',
      message: 'You do not have access to this resource.',
      status: 403,
    });
  }

  return email as string;
}

export async function requireAdminServerSession(): Promise<AuthSession> {
  const session = await requireServerSession();
  requireAdminEmail(session.user.email);
  return session;
}

export async function requireAdminRequestSession(request: Request): Promise<AuthSession> {
  const session = await requireRequestSession(request);
  requireAdminEmail(session.user.email);
  return session;
}
