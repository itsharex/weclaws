import { getAuth } from '@/lib/auth';
import { toNextJsHandler } from 'better-auth/next-js';

type AuthHandlerSet = ReturnType<typeof toNextJsHandler>;

export async function GET(...args: Parameters<AuthHandlerSet['GET']>) {
  const { GET: handleGet } = toNextJsHandler(getAuth());
  return handleGet(...args);
}

export async function POST(...args: Parameters<AuthHandlerSet['POST']>) {
  const { POST: handlePost } = toNextJsHandler(getAuth());
  return handlePost(...args);
}
