import { beforeEach, describe, expect, it, vi } from 'vitest';

const requireAdminRequestSessionMock = vi.fn();
const getRepositoriesMock = vi.fn();
const requestAdminSandboxRuntimePoolRestartMock = vi.fn();

vi.mock('@/lib/admin', () => ({
  requireAdminRequestSession: requireAdminRequestSessionMock,
}));

vi.mock('@/lib/repositories', () => ({
  getRepositories: getRepositoriesMock,
}));

vi.mock('@/lib/sandbox-runtime-admin', () => ({
  requestAdminSandboxRuntimePoolRestart: requestAdminSandboxRuntimePoolRestartMock,
}));

describe('/api/admin/sandbox-runtime/pools/[ownerUserId]/restart route', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    getRepositoriesMock.mockReturnValue({ repositories: true });
  });

  it('requests a sandbox runtime pool restart for admins', async () => {
    requireAdminRequestSessionMock.mockResolvedValue({
      user: { email: 'admin@example.com', id: 'admin_1' },
    });
    requestAdminSandboxRuntimePoolRestartMock.mockResolvedValue({
      ownerUserId: 'user_1',
      restartRequestedAt: '2026-05-02T03:00:00.000Z',
    });

    const { POST } = await import('../route');
    const response = await POST(
      new Request('http://localhost/api/admin/sandbox-runtime/pools/user_1/restart', {
        method: 'POST',
      }),
      {
        params: Promise.resolve({ ownerUserId: 'user_1' }),
      },
    );

    expect(requestAdminSandboxRuntimePoolRestartMock).toHaveBeenCalledWith({
      ownerUserId: 'user_1',
      repositories: { repositories: true },
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      data: {
        ownerUserId: 'user_1',
        restartRequestedAt: '2026-05-02T03:00:00.000Z',
      },
      error: null,
    });
  });

  it('returns not found for unknown pools', async () => {
    const { ApiError } = await import('@/lib/api-error');
    requireAdminRequestSessionMock.mockResolvedValue({
      user: { email: 'admin@example.com', id: 'admin_1' },
    });
    requestAdminSandboxRuntimePoolRestartMock.mockRejectedValue(new ApiError({
      code: 'SRT_POOL_NOT_FOUND',
      message: 'Sandbox runtime pool not found.',
      status: 404,
    }));

    const { POST } = await import('../route');
    const response = await POST(
      new Request('http://localhost/api/admin/sandbox-runtime/pools/missing_user/restart', {
        method: 'POST',
      }),
      {
        params: Promise.resolve({ ownerUserId: 'missing_user' }),
      },
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      data: null,
      error: {
        code: 'SRT_POOL_NOT_FOUND',
        message: 'Sandbox runtime pool not found.',
      },
    });
  });
});
