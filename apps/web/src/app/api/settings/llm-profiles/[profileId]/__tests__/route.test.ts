import { beforeEach, describe, expect, it, vi } from 'vitest';

const deleteUserLlmProfileMock = vi.fn();
const requireRequestSessionMock = vi.fn();
const updateUserLlmProfileMock = vi.fn();

vi.mock('@/lib/session', () => ({
  requireRequestSession: requireRequestSessionMock,
}));

vi.mock('@/lib/llm-profiles', () => ({
  deleteUserLlmProfile: deleteUserLlmProfileMock,
  updateUserLlmProfile: updateUserLlmProfileMock,
}));

describe('/api/settings/llm-profiles/[profileId] route', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('updates an llm profile for the authenticated user', async () => {
    requireRequestSessionMock.mockResolvedValue({
      user: { email: 'zac@example.com', id: 'user_1' },
    });
    updateUserLlmProfileMock.mockResolvedValue({
      profile: {
        apiType: 'openai-completions',
        baseUrl: null,
        createdAt: '2026-04-17T02:00:00.000Z',
        hasApiKey: true,
        id: 'profile_1',
        model: 'gpt-5.5',
        name: 'Primary v2',
        provider: 'openai',
        updatedAt: '2026-04-17T04:00:00.000Z',
      },
      restartRequestedBotCount: 2,
    });

    const { PATCH } = await import('../route');
    const response = await PATCH(new Request('http://localhost/api/settings/llm-profiles/profile_1', {
      body: JSON.stringify({
        apiType: 'openai-completions',
        baseUrl: null,
        model: 'gpt-5.5',
        name: 'Primary v2',
      }),
      headers: { 'content-type': 'application/json' },
      method: 'PATCH',
    }), {
      params: Promise.resolve({ profileId: 'profile_1' }),
    });

    expect(updateUserLlmProfileMock).toHaveBeenCalledWith('user_1', 'profile_1', {
      apiType: 'openai-completions',
      baseUrl: null,
      model: 'gpt-5.5',
      name: 'Primary v2',
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      data: {
        profile: {
          apiType: 'openai-completions',
          baseUrl: null,
          createdAt: '2026-04-17T02:00:00.000Z',
          hasApiKey: true,
          id: 'profile_1',
          model: 'gpt-5.5',
          name: 'Primary v2',
          provider: 'openai',
          updatedAt: '2026-04-17T04:00:00.000Z',
        },
        restartRequestedBotCount: 2,
      },
      error: null,
    });
  });

  it('deletes an unused llm profile for the authenticated user', async () => {
    requireRequestSessionMock.mockResolvedValue({
      user: { email: 'zac@example.com', id: 'user_1' },
    });
    deleteUserLlmProfileMock.mockResolvedValue({
      id: 'profile_1',
    });

    const { DELETE } = await import('../route');
    const response = await DELETE(new Request('http://localhost/api/settings/llm-profiles/profile_1', {
      method: 'DELETE',
    }), {
      params: Promise.resolve({ profileId: 'profile_1' }),
    });

    expect(deleteUserLlmProfileMock).toHaveBeenCalledWith('user_1', 'profile_1');
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      data: {
        id: 'profile_1',
      },
      error: null,
    });
  });

  it('rejects invalid profile updates', async () => {
    requireRequestSessionMock.mockResolvedValue({
      user: { email: 'zac@example.com', id: 'user_1' },
    });

    const { PATCH } = await import('../route');
    const response = await PATCH(new Request('http://localhost/api/settings/llm-profiles/profile_1', {
      body: JSON.stringify({
        apiType: null,
      }),
      headers: { 'content-type': 'application/json' },
      method: 'PATCH',
    }), {
      params: Promise.resolve({ profileId: 'profile_1' }),
    });

    expect(updateUserLlmProfileMock).not.toHaveBeenCalled();
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      data: null,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid llm profile payload.',
      },
    });
  });
});
