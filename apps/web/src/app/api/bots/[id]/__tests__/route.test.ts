import { beforeEach, describe, expect, it, vi } from 'vitest';

const requireRequestSessionMock = vi.fn();
const requireOwnedBotMock = vi.fn();
const deleteBotMock = vi.fn();
const getBotDetailMock = vi.fn();

vi.mock('@/lib/session', () => ({
  requireOwnedBot: requireOwnedBotMock,
  requireRequestSession: requireRequestSessionMock,
}));

vi.mock('@/lib/bot-service', () => ({
  deleteBot: deleteBotMock,
  getBotDetail: getBotDetailMock,
}));

describe('/api/bots/[id] route', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('returns detail payloads with runtime fields for authorized owners', async () => {
    requireRequestSessionMock.mockResolvedValue({
      user: { id: 'user_1', email: 'zac@example.com' },
    });
    requireOwnedBotMock.mockResolvedValue({
      id: 'bot_1',
      ownerUserId: 'user_1',
    });
    getBotDetailMock.mockResolvedValue({
      id: 'bot_1',
      llmConfigId: 'profile_1',
      llmProfileName: 'Primary',
      name: 'Bot One',
      provider: 'anthropic',
      model: 'claude-opus-4-6',
      workspaceId: 'ws_1',
      desiredState: 'running',
      status: 'running',
      processPid: 120,
      processStartedAt: '2026-03-30T00:00:00.000Z',
      heartbeatAt: '2026-03-30T00:00:03.000Z',
      restartRequestedAt: null,
      lastQrCodeId: 'qr_1',
      lastQrCodeUrl: 'https://example.com/qrcode/1',
      weixinAccountId: 'wx_acc_1',
      lastErrorCode: null,
      lastErrorMessage: null,
      createdAt: '2026-03-30T00:00:00.000Z',
      updatedAt: '2026-03-30T00:00:03.000Z',
    });

    const { GET } = await import('../route');
    const response = await GET(new Request('http://localhost/api/bots/bot_1'), {
      params: Promise.resolve({ id: 'bot_1' }),
    });

    expect(getBotDetailMock).toHaveBeenCalledWith('bot_1');
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      data: {
        id: 'bot_1',
        llmConfigId: 'profile_1',
        llmProfileName: 'Primary',
        name: 'Bot One',
        provider: 'anthropic',
        model: 'claude-opus-4-6',
        workspaceId: 'ws_1',
        desiredState: 'running',
        status: 'running',
        processPid: 120,
        processStartedAt: '2026-03-30T00:00:00.000Z',
        heartbeatAt: '2026-03-30T00:00:03.000Z',
        restartRequestedAt: null,
        lastQrCodeId: 'qr_1',
        lastQrCodeUrl: 'https://example.com/qrcode/1',
        weixinAccountId: 'wx_acc_1',
        lastErrorCode: null,
        lastErrorMessage: null,
        createdAt: '2026-03-30T00:00:00.000Z',
        updatedAt: '2026-03-30T00:00:03.000Z',
      },
      error: null,
    });
  });

  it('returns the same real runtime detail shape even when qr id is absent', async () => {
    requireRequestSessionMock.mockResolvedValue({
      user: { id: 'user_1', email: 'zac@example.com' },
    });
    requireOwnedBotMock.mockResolvedValue({
      id: 'bot_1',
      ownerUserId: 'user_1',
    });
    getBotDetailMock.mockResolvedValue({
      id: 'bot_1',
      llmConfigId: null,
      llmProfileName: null,
      name: 'Bot One',
      provider: 'openai',
      model: 'gpt-5.4',
      workspaceId: 'ws_1',
      desiredState: 'running',
      status: 'running',
      processPid: 84721,
      processStartedAt: '2026-03-30T10:18:18.753Z',
      heartbeatAt: '2026-03-30T10:18:19.068Z',
      restartRequestedAt: null,
      lastQrCodeId: null,
      lastQrCodeUrl: 'https://liteapp.weixin.qq.com/q/7GiQu1?qrcode=81617e3de8b98a196dd0842c26bdba4b&bot_type=3',
      weixinAccountId: 'a8452ac9698f@im.bot',
      lastErrorCode: 'RUNTIME_ERROR',
      lastErrorMessage: 'Sandbox session crashed unexpectedly',
      createdAt: '2026-03-30T00:00:00.000Z',
      updatedAt: '2026-03-30T10:18:19.068Z',
    });

    const { GET } = await import('../route');
    const response = await GET(new Request('http://localhost/api/bots/bot_1'), {
      params: Promise.resolve({ id: 'bot_1' }),
    });

    await expect(response.json()).resolves.toEqual({
      data: {
        id: 'bot_1',
        llmConfigId: null,
        llmProfileName: null,
        name: 'Bot One',
        provider: 'openai',
        model: 'gpt-5.4',
        workspaceId: 'ws_1',
        desiredState: 'running',
        status: 'running',
        processPid: 84721,
        processStartedAt: '2026-03-30T10:18:18.753Z',
        heartbeatAt: '2026-03-30T10:18:19.068Z',
        restartRequestedAt: null,
        lastQrCodeId: null,
        lastQrCodeUrl: 'https://liteapp.weixin.qq.com/q/7GiQu1?qrcode=81617e3de8b98a196dd0842c26bdba4b&bot_type=3',
        weixinAccountId: 'a8452ac9698f@im.bot',
        lastErrorCode: 'RUNTIME_ERROR',
        lastErrorMessage: 'Sandbox session crashed unexpectedly',
        createdAt: '2026-03-30T00:00:00.000Z',
        updatedAt: '2026-03-30T10:18:19.068Z',
      },
      error: null,
    });
  });

  it('deletes a bot for the authorized owner', async () => {
    requireRequestSessionMock.mockResolvedValue({
      user: { id: 'user_1', email: 'zac@example.com' },
    });
    requireOwnedBotMock.mockResolvedValue({
      id: 'bot_1',
      ownerUserId: 'user_1',
    });
    deleteBotMock.mockResolvedValue({
      id: 'bot_1',
    });

    const { DELETE } = await import('../route');
    const response = await DELETE(new Request('http://localhost/api/bots/bot_1', {
      method: 'DELETE',
    }), {
      params: Promise.resolve({ id: 'bot_1' }),
    });

    expect(deleteBotMock).toHaveBeenCalledWith('bot_1');
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      data: {
        id: 'bot_1',
      },
      error: null,
    });
  });
});
