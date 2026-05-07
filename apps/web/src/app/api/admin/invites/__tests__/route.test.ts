import { beforeEach, describe, expect, it, vi } from 'vitest';

const requireAdminRequestSessionMock = vi.fn();
const createMock = vi.fn();
const listRecentMock = vi.fn();
const findUserByIdMock = vi.fn();

vi.mock('@/lib/admin', () => ({
  requireAdminRequestSession: requireAdminRequestSessionMock,
}));

vi.mock('@/lib/repositories', () => ({
  getRepositories: () => ({
    registrationInvites: {
      create: createMock,
      listRecent: listRecentMock,
    },
    users: {
      findById: findUserByIdMock,
    },
  }),
}));

describe('/api/admin/invites route', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    findUserByIdMock.mockImplementation(async (id: string) => {
      if (id === 'admin_1') {
        return {
          email: 'admin@example.com',
          id: 'admin_1',
        };
      }

      if (id === 'user_2') {
        return {
          email: 'member@example.com',
          id: 'user_2',
        };
      }

      return null;
    });
  });

  it('returns 401 when the caller is not authenticated', async () => {
    const { ApiError } = await import('@/lib/api-error');
    requireAdminRequestSessionMock.mockRejectedValue(new ApiError({
      code: 'UNAUTHORIZED',
      message: 'Please sign in.',
      status: 401,
    }));

    const { GET } = await import('../route');
    const response = await GET(new Request('http://localhost/api/admin/invites'));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      data: null,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Please sign in.',
      },
    });
  });

  it('returns 403 when the caller is not an admin', async () => {
    const { ApiError } = await import('@/lib/api-error');
    requireAdminRequestSessionMock.mockRejectedValue(new ApiError({
      code: 'FORBIDDEN',
      message: 'You do not have access to this resource.',
      status: 403,
    }));

    const { POST } = await import('../route');
    const response = await POST(new Request('http://localhost/api/admin/invites', { method: 'POST' }));

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      data: null,
      error: {
        code: 'FORBIDDEN',
        message: 'You do not have access to this resource.',
      },
    });
  });

  it('lists recent invites for admins', async () => {
    requireAdminRequestSessionMock.mockResolvedValue({
      user: { id: 'admin_1', email: 'admin@example.com' },
    });
    listRecentMock.mockResolvedValue([
      {
        code: 'INVITE-TWO',
        createdAt: new Date('2026-04-02T07:00:00.000Z'),
        createdByUserId: 'admin_1',
        id: 'invite_2',
        usedAt: new Date('2026-04-02T07:30:00.000Z'),
        usedByUserId: 'user_2',
      },
    ]);

    const { GET } = await import('../route');
    const response = await GET(new Request('http://localhost/api/admin/invites'));

    expect(listRecentMock).toHaveBeenCalledWith();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      data: [
        {
          canDelete: false,
          code: 'INVITE-TWO',
          createdAt: '2026-04-02T07:00:00.000Z',
          createdByEmail: 'admin@example.com',
          id: 'invite_2',
          reservedAt: null,
          reservedByEmail: null,
          usedAt: '2026-04-02T07:30:00.000Z',
          usedByEmail: 'member@example.com',
        },
      ],
      error: null,
    });
  });

  it('creates a new invite for admins', async () => {
    requireAdminRequestSessionMock.mockResolvedValue({
      user: { id: 'admin_1', email: 'admin@example.com' },
    });
    createMock.mockResolvedValue({
      code: 'INVITE-NEW',
      createdAt: new Date('2026-04-02T08:00:00.000Z'),
      createdByUserId: 'admin_1',
      id: 'invite_1',
      usedAt: null,
      usedByUserId: null,
    });

    const { POST } = await import('../route');
    const response = await POST(new Request('http://localhost/api/admin/invites', { method: 'POST' }));

    expect(createMock).toHaveBeenCalledWith(expect.objectContaining({
      code: expect.any(String),
      createdByUserId: 'admin_1',
      id: expect.any(String),
    }));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      data: {
        canDelete: true,
        code: 'INVITE-NEW',
        createdAt: '2026-04-02T08:00:00.000Z',
        createdByEmail: 'admin@example.com',
        id: 'invite_1',
        reservedAt: null,
        reservedByEmail: null,
        usedAt: null,
        usedByEmail: null,
      },
      error: null,
    });
  });
});
