import { beforeEach, describe, expect, it, vi } from 'vitest';

const requireOwnedBotMock = vi.fn();
const requireRequestSessionMock = vi.fn();
const updateBotLlmProfileMock = vi.fn();

vi.mock('@/lib/session', () => ({
  requireOwnedBot: requireOwnedBotMock,
  requireRequestSession: requireRequestSessionMock,
}));

vi.mock('@/lib/bot-service', () => ({
  updateBotLlmProfile: updateBotLlmProfileMock,
}));

describe('/api/bots/[id]/llm-profile route', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('rebinds a bot to another llm profile for the authorized owner', async () => {
    requireRequestSessionMock.mockResolvedValue({
      user: { email: 'zac@example.com', id: 'user_1' },
    });
    requireOwnedBotMock.mockResolvedValue({
      id: 'bot_1',
      ownerUserId: 'user_1',
    });
    updateBotLlmProfileMock.mockResolvedValue({
      desiredState: 'running',
      id: 'bot_1',
      llmConfigId: 'profile_2',
      llmProfileName: 'Secondary',
      restartRequestedAt: '2026-04-17T03:00:00.000Z',
      status: 'running',
    });

    const { PATCH } = await import('../route');
    const response = await PATCH(new Request('http://localhost/api/bots/bot_1/llm-profile', {
      body: JSON.stringify({
        llmProfileId: 'profile_2',
      }),
      headers: { 'content-type': 'application/json' },
      method: 'PATCH',
    }), {
      params: Promise.resolve({ id: 'bot_1' }),
    });

    expect(updateBotLlmProfileMock).toHaveBeenCalledWith({
      botId: 'bot_1',
      llmProfileId: 'profile_2',
      ownerUserId: 'user_1',
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      data: {
        desiredState: 'running',
        id: 'bot_1',
        llmConfigId: 'profile_2',
        llmProfileName: 'Secondary',
        restartRequestedAt: '2026-04-17T03:00:00.000Z',
        status: 'running',
      },
      error: null,
    });
  });

  it('rejects invalid payloads', async () => {
    requireRequestSessionMock.mockResolvedValue({
      user: { email: 'zac@example.com', id: 'user_1' },
    });
    requireOwnedBotMock.mockResolvedValue({
      id: 'bot_1',
      ownerUserId: 'user_1',
    });

    const { PATCH } = await import('../route');
    const response = await PATCH(new Request('http://localhost/api/bots/bot_1/llm-profile', {
      body: JSON.stringify({}),
      headers: { 'content-type': 'application/json' },
      method: 'PATCH',
    }), {
      params: Promise.resolve({ id: 'bot_1' }),
    });

    expect(updateBotLlmProfileMock).not.toHaveBeenCalled();
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      data: null,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid llm profile binding payload.',
      },
    });
  });
});
