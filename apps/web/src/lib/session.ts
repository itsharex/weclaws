import { ApiError } from './api-error';
import { getAuth, type AuthInstance } from './auth';
import { getRepositories } from './repositories';
import { getDefaultUserName } from './user-name';

export { getDefaultUserName } from './user-name';

export type AuthSession = NonNullable<Awaited<ReturnType<AuthInstance['api']['getSession']>>>;

export async function getServerSession(): Promise<AuthSession | null> {
  const [{ headers }] = await Promise.all([
    import('next/headers'),
  ]);

  return getAuth().api.getSession({
    headers: await headers(),
  });
}

export async function requireServerSession(): Promise<AuthSession> {
  const session = await getServerSession();

  if (!session) {
    const [{ redirect }] = await Promise.all([
      import('next/navigation'),
    ]);

    redirect('/login');
  }

  return session as AuthSession;
}

export async function requireRequestSession(request: Request): Promise<AuthSession> {
  const session = await getAuth().api.getSession({
    headers: request.headers,
  });

  if (!session) {
    throw new ApiError({
      code: 'UNAUTHORIZED',
      message: 'Please sign in.',
      status: 401,
    });
  }

  return session;
}

export async function requireOwnedBot(botId: string, ownerUserId: string) {
  const bot = await getRepositories().botInstances.findById(botId);

  if (!bot) {
    throw new ApiError({
      code: 'NOT_FOUND',
      message: 'Bot not found.',
      status: 404,
    });
  }

  if (bot.ownerUserId !== ownerUserId) {
    throw new ApiError({
      code: 'FORBIDDEN',
      message: 'You do not have access to this bot.',
      status: 403,
    });
  }

  return bot;
}
