import { beforeEach, describe, expect, it, vi } from 'vitest';

const deleteInviteByIdMock = vi.fn();
const findInviteByIdMock = vi.fn();
const requireAdminRequestSessionMock = vi.fn();

vi.mock('@/lib/admin', () => ({
  requireAdminRequestSession: requireAdminRequestSessionMock,
}));

vi.mock('@/lib/repositories', () => ({
  getRepositories: () => ({
    registrationInvites: {
      deleteUnusedById: deleteInviteByIdMock,
      findById: findInviteByIdMock,
    },
  }),
}));

describe('/api/admin/invites/[id] route', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('deletes an unused invite for admins', async () => {
    requireAdminRequestSessionMock.mockResolvedValue({
      user: { email: 'admin@example.com', id: 'admin_1' },
    });
    deleteInviteByIdMock.mockResolvedValue({
      id: 'invite_1',
    });

    const { DELETE } = await import('../route');
    const response = await DELETE(new Request('http://localhost/api/admin/invites/invite_1', {
      method: 'DELETE',
    }), {
      params: Promise.resolve({ id: 'invite_1' }),
    });

    expect(deleteInviteByIdMock).toHaveBeenCalledWith('invite_1');
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      data: {
        id: 'invite_1',
      },
      error: null,
    });
  });

  it('returns 409 when the invite is already used or reserved', async () => {
    requireAdminRequestSessionMock.mockResolvedValue({
      user: { email: 'admin@example.com', id: 'admin_1' },
    });
    deleteInviteByIdMock.mockResolvedValue(null);
    findInviteByIdMock.mockResolvedValue({
      code: 'INV-USED',
      createdAt: new Date('2026-04-17T02:00:00.000Z'),
      createdByUserId: 'admin_1',
      id: 'invite_2',
      reservedAt: new Date('2026-04-17T02:10:00.000Z'),
      reservedByEmail: 'member@example.com',
      reservationToken: 'token_1',
      usedAt: null,
      usedByUserId: null,
    });

    const { DELETE } = await import('../route');
    const response = await DELETE(new Request('http://localhost/api/admin/invites/invite_2', {
      method: 'DELETE',
    }), {
      params: Promise.resolve({ id: 'invite_2' }),
    });

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      data: null,
      error: {
        code: 'INVITE_DELETE_NOT_ALLOWED',
        message: 'Only unused and unreserved invites can be deleted.',
      },
    });
  });
});
