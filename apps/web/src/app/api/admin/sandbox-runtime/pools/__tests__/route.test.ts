import { beforeEach, describe, expect, it, vi } from 'vitest';

const requireAdminRequestSessionMock = vi.fn();
const getRepositoriesMock = vi.fn();
const resolveSrtPoolStatusFileMock = vi.fn();
const listAdminSandboxRuntimePoolsMock = vi.fn();

vi.mock('@/lib/admin', () => ({
  requireAdminRequestSession: requireAdminRequestSessionMock,
}));

vi.mock('@/lib/env', () => ({
  resolveSrtPoolStatusFile: resolveSrtPoolStatusFileMock,
}));

vi.mock('@/lib/repositories', () => ({
  getRepositories: getRepositoriesMock,
}));

vi.mock('@/lib/sandbox-runtime-admin', () => ({
  listAdminSandboxRuntimePools: listAdminSandboxRuntimePoolsMock,
}));

describe('/api/admin/sandbox-runtime/pools route', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    getRepositoriesMock.mockReturnValue({ repositories: true });
    resolveSrtPoolStatusFileMock.mockReturnValue('/tmp/srt-pool-status.json');
  });

  it('returns 403 when the caller is not an admin', async () => {
    const { ApiError } = await import('@/lib/api-error');
    requireAdminRequestSessionMock.mockRejectedValue(new ApiError({
      code: 'FORBIDDEN',
      message: 'You do not have access to this resource.',
      status: 403,
    }));

    const { GET } = await import('../route');
    const response = await GET(new Request('http://localhost/api/admin/sandbox-runtime/pools'));

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      data: null,
      error: {
        code: 'FORBIDDEN',
        message: 'You do not have access to this resource.',
      },
    });
  });

  it('lists sandbox runtime pools for admins', async () => {
    requireAdminRequestSessionMock.mockResolvedValue({
      user: { email: 'admin@example.com', id: 'admin_1' },
    });
    listAdminSandboxRuntimePoolsMock.mockResolvedValue({
      manager: null,
      pools: [],
      statusUpdatedAt: null,
    });

    const { GET } = await import('../route');
    const response = await GET(new Request('http://localhost/api/admin/sandbox-runtime/pools'));

    expect(listAdminSandboxRuntimePoolsMock).toHaveBeenCalledWith({
      repositories: { repositories: true },
      statusFilePath: '/tmp/srt-pool-status.json',
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      data: {
        manager: null,
        pools: [],
        statusUpdatedAt: null,
      },
      error: null,
    });
  });
});
