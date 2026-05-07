import { beforeEach, describe, expect, it, vi } from 'vitest';

const requireRequestSessionMock = vi.fn();
const createBotMock = vi.fn();
const listBotsMock = vi.fn();

vi.mock('@/lib/session', () => ({
  requireRequestSession: requireRequestSessionMock,
}));

vi.mock('@/lib/bot-service', () => ({
  createBot: createBotMock,
  listBots: listBotsMock,
}));

describe('/api/bots route', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('returns 401 when the caller is not authenticated', async () => {
    const { ApiError } = await import('@/lib/api-error');
    requireRequestSessionMock.mockRejectedValue(new ApiError({
      code: 'UNAUTHORIZED',
      message: 'Please sign in.',
      status: 401,
    }));

    const { GET } = await import('../route');

    const response = await GET(new Request('http://localhost/api/bots'));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      data: null,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Please sign in.',
      },
    });
  });

  it('creates a bot for the authenticated user', async () => {
    requireRequestSessionMock.mockResolvedValue({
      user: { id: 'user_1', email: 'zac@example.com' },
    });
    createBotMock.mockResolvedValue({
      id: 'bot_1',
      llmConfigId: 'profile_1',
      llmProfileName: 'Primary',
      workspaceId: 'ws_1',
      status: 'provisioning',
      desiredState: 'running',
    });

    const { POST } = await import('../route');
    const response = await POST(
      new Request('http://localhost/api/bots', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          llmProfileId: 'profile_1',
          name: 'Bot One',
        }),
      }),
    );

    expect(createBotMock).toHaveBeenCalledWith({
      llmProfileId: 'profile_1',
      ownerUserId: 'user_1',
      name: 'Bot One',
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      data: {
        id: 'bot_1',
        llmConfigId: 'profile_1',
        llmProfileName: 'Primary',
        workspaceId: 'ws_1',
        status: 'provisioning',
        desiredState: 'running',
      },
      error: null,
    });
  });

  it('rejects invalid create payloads', async () => {
    requireRequestSessionMock.mockResolvedValue({
      user: { id: 'user_1', email: 'zac@example.com' },
    });

    const { POST } = await import('../route');
    const response = await POST(
      new Request('http://localhost/api/bots', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: 'Bot One',
        }),
      }),
    );

    expect(createBotMock).not.toHaveBeenCalled();
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      data: null,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid bot creation payload.',
      },
    });
  });

  it('lists bots for the authenticated user', async () => {
    requireRequestSessionMock.mockResolvedValue({
      user: { id: 'user_1', email: 'zac@example.com' },
    });
    listBotsMock.mockResolvedValue([
      {
        id: 'bot_1',
        name: 'Bot One',
        desiredState: 'running',
        status: 'running',
      },
    ]);

    const { GET } = await import('../route');
    const response = await GET(new Request('http://localhost/api/bots'));

    expect(listBotsMock).toHaveBeenCalledWith('user_1');
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      data: [
        {
          id: 'bot_1',
          name: 'Bot One',
          desiredState: 'running',
          status: 'running',
        },
      ],
      error: null,
    });
  });

  it('hides unexpected internal error messages from clients', async () => {
    requireRequestSessionMock.mockResolvedValue({
      user: { id: 'user_1', email: 'zac@example.com' },
    });
    createBotMock.mockRejectedValue(new Error('sqlite constraint failed at /private/tmp/test.sqlite'));

    const { POST } = await import('../route');
    const response = await POST(
      new Request('http://localhost/api/bots', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          llmProfileId: 'profile_1',
          name: 'Bot One',
        }),
      }),
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      data: null,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Unexpected server error.',
      },
    });
  });

  it('returns 409 when the authenticated user has reached the bot limit', async () => {
    const { ApiError } = await import('@/lib/api-error');

    requireRequestSessionMock.mockResolvedValue({
      user: { id: 'user_1', email: 'zac@example.com' },
    });
    createBotMock.mockRejectedValue(new ApiError({
      code: 'BOT_LIMIT_REACHED',
      message: 'You have reached the bot limit for this account.',
      status: 409,
    }));

    const { POST } = await import('../route');
    const response = await POST(
      new Request('http://localhost/api/bots', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          llmProfileId: 'profile_1',
          name: 'Bot One',
        }),
      }),
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      data: null,
      error: {
        code: 'BOT_LIMIT_REACHED',
        message: 'You have reached the bot limit for this account.',
      },
    });
  });
});
