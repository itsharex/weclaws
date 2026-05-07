import { beforeEach, describe, expect, it, vi } from 'vitest';

const getSessionMock = vi.fn();
const findByIdMock = vi.fn();

vi.mock('@/lib/auth', () => ({
  getAuth: () => ({
    api: {
      getSession: getSessionMock,
    },
  }),
}));

vi.mock('@/lib/repositories', () => ({
  getRepositories: () => ({
    botInstances: {
      findById: findByIdMock,
    },
  }),
}));

describe('session helpers', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('derives the default user name from the email prefix', async () => {
    const { getDefaultUserName } = await import('../session');

    expect(getDefaultUserName('zac@example.com')).toBe('zac');
  });

  it('rejects missing request sessions for protected API handlers', async () => {
    getSessionMock.mockResolvedValue(null);

    const { requireRequestSession } = await import('../session');

    await expect(
      requireRequestSession(new Request('http://localhost/api/bots')),
    ).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
      status: 401,
    });
  });

  it('rejects non-owner bot access', async () => {
    findByIdMock.mockResolvedValue({
      id: 'bot_1',
      ownerUserId: 'user_2',
    });

    const { requireOwnedBot } = await import('../session');

    await expect(requireOwnedBot('bot_1', 'user_1')).rejects.toMatchObject({
      code: 'FORBIDDEN',
      status: 403,
    });
  });
});
