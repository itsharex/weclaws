import { beforeEach, describe, expect, it, vi } from 'vitest';

const createUserLlmProfileMock = vi.fn();
const listUserLlmProfilesMock = vi.fn();
const requireRequestSessionMock = vi.fn();

vi.mock('@/lib/session', () => ({
  requireRequestSession: requireRequestSessionMock,
}));

vi.mock('@/lib/llm-profiles', () => ({
  createUserLlmProfile: createUserLlmProfileMock,
  listUserLlmProfiles: listUserLlmProfilesMock,
}));

describe('/api/settings/llm-profiles route', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('lists owner-scoped llm profiles for the authenticated user', async () => {
    requireRequestSessionMock.mockResolvedValue({
      user: { email: 'zac@example.com', id: 'user_1' },
    });
    listUserLlmProfilesMock.mockResolvedValue([
      {
        apiType: 'openai-responses',
        baseUrl: 'https://gateway.example.com/v1',
        createdAt: '2026-04-17T02:00:00.000Z',
        hasApiKey: true,
        id: 'profile_1',
        model: 'gpt-5.4',
        name: 'Primary',
        provider: 'openai',
        updatedAt: '2026-04-17T03:00:00.000Z',
      },
    ]);

    const { GET } = await import('../route');
    const response = await GET(new Request('http://localhost/api/settings/llm-profiles'));

    expect(listUserLlmProfilesMock).toHaveBeenCalledWith('user_1');
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      data: [
        {
          apiType: 'openai-responses',
          baseUrl: 'https://gateway.example.com/v1',
          createdAt: '2026-04-17T02:00:00.000Z',
          hasApiKey: true,
          id: 'profile_1',
          model: 'gpt-5.4',
          name: 'Primary',
          provider: 'openai',
          updatedAt: '2026-04-17T03:00:00.000Z',
        },
      ],
      error: null,
    });
  });

  it('creates an llm profile for the authenticated user', async () => {
    requireRequestSessionMock.mockResolvedValue({
      user: { email: 'zac@example.com', id: 'user_1' },
    });
    createUserLlmProfileMock.mockResolvedValue({
      profile: {
        apiType: 'openai-responses',
        baseUrl: 'https://gateway.example.com/v1',
        createdAt: '2026-04-17T02:00:00.000Z',
        hasApiKey: true,
        id: 'profile_1',
        model: 'gpt-5.4',
        name: 'Primary',
        provider: 'openai',
        updatedAt: '2026-04-17T03:00:00.000Z',
      },
      restartRequestedBotCount: 0,
    });

    const { POST } = await import('../route');
    const response = await POST(new Request('http://localhost/api/settings/llm-profiles', {
      body: JSON.stringify({
        apiKey: 'sk-user-1',
        apiType: 'openai-responses',
        baseUrl: 'https://gateway.example.com/v1',
        model: 'gpt-5.4',
        name: 'Primary',
        provider: 'openai',
      }),
      headers: { 'content-type': 'application/json' },
      method: 'POST',
    }));

    expect(createUserLlmProfileMock).toHaveBeenCalledWith('user_1', {
      apiKey: 'sk-user-1',
      apiType: 'openai-responses',
      baseUrl: 'https://gateway.example.com/v1',
      model: 'gpt-5.4',
      name: 'Primary',
      provider: 'openai',
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      data: {
        profile: {
          apiType: 'openai-responses',
          baseUrl: 'https://gateway.example.com/v1',
          createdAt: '2026-04-17T02:00:00.000Z',
          hasApiKey: true,
          id: 'profile_1',
          model: 'gpt-5.4',
          name: 'Primary',
          provider: 'openai',
          updatedAt: '2026-04-17T03:00:00.000Z',
        },
        restartRequestedBotCount: 0,
      },
      error: null,
    });
  });

  it('rejects invalid profile creation payloads', async () => {
    requireRequestSessionMock.mockResolvedValue({
      user: { email: 'zac@example.com', id: 'user_1' },
    });

    const { POST } = await import('../route');
    const response = await POST(new Request('http://localhost/api/settings/llm-profiles', {
      body: JSON.stringify({
        model: 'gpt-5.4',
        name: 'Primary',
        provider: 'openai',
        apiKey: 'sk-user-1',
      }),
      headers: { 'content-type': 'application/json' },
      method: 'POST',
    }));

    expect(createUserLlmProfileMock).not.toHaveBeenCalled();
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
