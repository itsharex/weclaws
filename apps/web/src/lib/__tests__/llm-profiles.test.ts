import { beforeEach, describe, expect, it, vi } from 'vitest';
const createMock = vi.fn();
const deleteByIdForUserMock = vi.fn();
const findByIdForUserMock = vi.fn();
const listByOwnerUserIdAndLlmConfigIdMock = vi.fn();
const listByUserIdMock = vi.fn();
const requestRestartMock = vi.fn();
const updateByIdForUserMock = vi.fn();

vi.mock('../repositories', () => ({
  getRepositories: () => ({
    botInstances: {
      listByOwnerUserIdAndLlmConfigId: listByOwnerUserIdAndLlmConfigIdMock,
      requestRestart: requestRestartMock,
    },
    userLlmProfiles: {
      create: createMock,
      deleteByIdForUser: deleteByIdForUserMock,
      findByIdForUser: findByIdForUserMock,
      listByUserId: listByUserIdMock,
      updateByIdForUser: updateByIdForUserMock,
    },
  }),
}));

describe('llm-profiles', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('lists owner-scoped llm profiles without exposing api keys', async () => {
    listByUserIdMock.mockResolvedValue([
      {
        apiKey: 'sk-user-1',
        apiType: 'openai-responses',
        baseUrl: 'https://gateway.example.com/v1',
        createdAt: new Date('2026-04-17T02:00:00.000Z'),
        id: 'profile_1',
        model: 'gpt-5.4',
        name: 'Primary',
        provider: 'openai',
        updatedAt: new Date('2026-04-17T03:00:00.000Z'),
        userId: 'user_1',
      },
    ]);

    const { listUserLlmProfiles } = await import('../llm-profiles');
    const profiles = await listUserLlmProfiles('user_1');

    expect(listByUserIdMock).toHaveBeenCalledWith('user_1');
    expect(profiles).toEqual([
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
  });

  it('creates a profile with the caller-selected api type', async () => {
    createMock.mockResolvedValue({
      apiKey: 'sk-user-1',
      apiType: 'anthropic-messages',
      baseUrl: null,
      createdAt: new Date('2026-04-17T02:00:00.000Z'),
      id: 'profile_1',
      model: 'claude-sonnet-4-5',
      name: 'Claude',
      provider: 'anthropic',
      updatedAt: new Date('2026-04-17T03:00:00.000Z'),
      userId: 'user_1',
    });

    const { createUserLlmProfile } = await import('../llm-profiles');
    const result = await createUserLlmProfile('user_1', {
      apiKey: 'sk-user-1',
      apiType: 'anthropic-messages',
      baseUrl: null,
      model: 'claude-sonnet-4-5',
      name: 'Claude',
      provider: 'anthropic',
    });

    expect(createMock).toHaveBeenCalledWith({
      apiKey: 'sk-user-1',
      apiType: 'anthropic-messages',
      baseUrl: null,
      id: expect.any(String),
      model: 'claude-sonnet-4-5',
      name: 'Claude',
      provider: 'anthropic',
      userId: 'user_1',
    });
    expect(result).toEqual({
      profile: {
        apiType: 'anthropic-messages',
        baseUrl: null,
        createdAt: '2026-04-17T02:00:00.000Z',
        hasApiKey: true,
        id: 'profile_1',
        model: 'claude-sonnet-4-5',
        name: 'Claude',
        provider: 'anthropic',
        updatedAt: '2026-04-17T03:00:00.000Z',
      },
      restartRequestedBotCount: 0,
    });
  });

  it('updates a profile, keeps the stored api key when omitted, and requests restart for bound running bots', async () => {
    findByIdForUserMock.mockResolvedValue({
      apiKey: 'sk-current',
      apiType: 'openai-responses',
      baseUrl: 'https://gateway.example.com/v1',
      createdAt: new Date('2026-04-17T02:00:00.000Z'),
      id: 'profile_1',
      model: 'gpt-5.4',
      name: 'Primary',
      provider: 'openai',
      updatedAt: new Date('2026-04-17T03:00:00.000Z'),
      userId: 'user_1',
    });
    updateByIdForUserMock.mockResolvedValue({
      apiKey: 'sk-current',
      apiType: 'openai-completions',
      baseUrl: null,
      createdAt: new Date('2026-04-17T02:00:00.000Z'),
      id: 'profile_1',
      model: 'gpt-5.5',
      name: 'Primary v2',
      provider: 'openai',
      updatedAt: new Date('2026-04-17T04:00:00.000Z'),
      userId: 'user_1',
    });
    listByOwnerUserIdAndLlmConfigIdMock.mockResolvedValue([
      {
        desiredState: 'running',
        id: 'bot_1',
      },
      {
        desiredState: 'stopped',
        id: 'bot_2',
      },
      {
        desiredState: 'running',
        id: 'bot_3',
      },
    ]);

    const { updateUserLlmProfile } = await import('../llm-profiles');
    const result = await updateUserLlmProfile('user_1', 'profile_1', {
      apiType: 'openai-completions',
      baseUrl: null,
      model: 'gpt-5.5',
      name: 'Primary v2',
      provider: 'openai',
    });

    expect(updateByIdForUserMock).toHaveBeenCalledWith('profile_1', 'user_1', {
      apiKey: 'sk-current',
      apiType: 'openai-completions',
      baseUrl: null,
      model: 'gpt-5.5',
      name: 'Primary v2',
      provider: 'openai',
    });
    expect(requestRestartMock).toHaveBeenCalledTimes(2);
    expect(requestRestartMock).toHaveBeenNthCalledWith(1, 'bot_1', expect.any(Date));
    expect(requestRestartMock).toHaveBeenNthCalledWith(2, 'bot_3', expect.any(Date));
    expect(result).toEqual({
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
  });

  it('treats an empty patch as a no-op even when a legacy profile still has null api type', async () => {
    findByIdForUserMock.mockResolvedValue({
      apiKey: 'sk-current',
      apiType: null,
      baseUrl: null,
      createdAt: new Date('2026-04-17T02:00:00.000Z'),
      id: 'profile_1',
      model: 'claude-sonnet-4-5',
      name: 'Claude',
      provider: 'anthropic',
      updatedAt: new Date('2026-04-17T03:00:00.000Z'),
      userId: 'user_1',
    });

    const { updateUserLlmProfile } = await import('../llm-profiles');
    const result = await updateUserLlmProfile('user_1', 'profile_1', {});

    expect(updateByIdForUserMock).not.toHaveBeenCalled();
    expect(listByOwnerUserIdAndLlmConfigIdMock).not.toHaveBeenCalled();
    expect(requestRestartMock).not.toHaveBeenCalled();
    expect(result).toEqual({
      profile: {
        apiType: null,
        baseUrl: null,
        createdAt: '2026-04-17T02:00:00.000Z',
        hasApiKey: true,
        id: 'profile_1',
        model: 'claude-sonnet-4-5',
        name: 'Claude',
        provider: 'anthropic',
        updatedAt: '2026-04-17T03:00:00.000Z',
      },
      restartRequestedBotCount: 0,
    });
  });

  it('treats an empty patch as a no-op and skips restart requests', async () => {
    findByIdForUserMock.mockResolvedValue({
      apiKey: 'sk-current',
      apiType: 'openai-responses',
      baseUrl: 'https://gateway.example.com/v1',
      createdAt: new Date('2026-04-17T02:00:00.000Z'),
      id: 'profile_1',
      model: 'gpt-5.4',
      name: 'Primary',
      provider: 'openai',
      updatedAt: new Date('2026-04-17T03:00:00.000Z'),
      userId: 'user_1',
    });

    const { updateUserLlmProfile } = await import('../llm-profiles');
    const result = await updateUserLlmProfile('user_1', 'profile_1', {});

    expect(updateByIdForUserMock).not.toHaveBeenCalled();
    expect(listByOwnerUserIdAndLlmConfigIdMock).not.toHaveBeenCalled();
    expect(requestRestartMock).not.toHaveBeenCalled();
    expect(result).toEqual({
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
  });

  it('returns a stable conflict error when creating a duplicate profile name', async () => {
    createMock.mockRejectedValue(Object.assign(
      new Error('UNIQUE constraint failed: user_llm_profiles.user_id, user_llm_profiles.name'),
      {
        code: 'SQLITE_CONSTRAINT_UNIQUE',
      },
    ));

    const { createUserLlmProfile } = await import('../llm-profiles');

    await expect(createUserLlmProfile('user_1', {
      apiKey: 'sk-user-1',
      apiType: 'openai-responses',
      baseUrl: null,
      model: 'gpt-5.4',
      name: 'Primary',
      provider: 'openai',
    })).rejects.toMatchObject({
      code: 'LLM_PROFILE_NAME_CONFLICT',
      message: 'An LLM profile with this name already exists.',
      status: 409,
    });
  });

  it('returns a stable conflict error when renaming a profile to a duplicate name', async () => {
    findByIdForUserMock.mockResolvedValue({
      apiKey: 'sk-current',
      apiType: 'openai-responses',
      baseUrl: 'https://gateway.example.com/v1',
      createdAt: new Date('2026-04-17T02:00:00.000Z'),
      id: 'profile_1',
      model: 'gpt-5.4',
      name: 'Primary',
      provider: 'openai',
      updatedAt: new Date('2026-04-17T03:00:00.000Z'),
      userId: 'user_1',
    });
    updateByIdForUserMock.mockRejectedValue(Object.assign(
      new Error('UNIQUE constraint failed: user_llm_profiles.user_id, user_llm_profiles.name'),
      {
        code: 'SQLITE_CONSTRAINT_UNIQUE',
      },
    ));

    const { updateUserLlmProfile } = await import('../llm-profiles');

    await expect(updateUserLlmProfile('user_1', 'profile_1', {
      name: 'Primary v2',
    })).rejects.toMatchObject({
      code: 'LLM_PROFILE_NAME_CONFLICT',
      message: 'An LLM profile with this name already exists.',
      status: 409,
    });
  });

  it('rejects deleting a profile that is still bound to a bot', async () => {
    listByOwnerUserIdAndLlmConfigIdMock.mockResolvedValue([
      {
        desiredState: 'stopped',
        id: 'bot_1',
      },
    ]);

    const { deleteUserLlmProfile } = await import('../llm-profiles');

    await expect(deleteUserLlmProfile('user_1', 'profile_1')).rejects.toMatchObject({
      code: 'LLM_PROFILE_IN_USE',
      message: 'Rebind or delete the bots using this profile before removing it.',
      status: 409,
    });
    expect(deleteByIdForUserMock).not.toHaveBeenCalled();
  });

  it('returns a stable conflict error when delete loses a race with a new bot binding', async () => {
    listByOwnerUserIdAndLlmConfigIdMock.mockResolvedValue([]);
    deleteByIdForUserMock.mockRejectedValue(Object.assign(
      new Error('FOREIGN KEY constraint failed'),
      {
        code: 'SQLITE_CONSTRAINT_FOREIGNKEY',
      },
    ));

    const { deleteUserLlmProfile } = await import('../llm-profiles');

    await expect(deleteUserLlmProfile('user_1', 'profile_1')).rejects.toMatchObject({
      code: 'LLM_PROFILE_IN_USE',
      message: 'Rebind or delete the bots using this profile before removing it.',
      status: 409,
    });
  });
});
