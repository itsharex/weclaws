import { randomUUID } from 'node:crypto';
import { ApiError, fail, ok } from '@/lib/api-error';
import { toAdminInviteItem, toAdminInviteItems } from '@/lib/admin-invites';
import { requireAdminRequestSession } from '@/lib/admin';
import { getRepositories } from '@/lib/repositories';

export async function GET(request: Request): Promise<Response> {
  try {
    await requireAdminRequestSession(request);
    const repositories = getRepositories();
    const invites = await repositories.registrationInvites.listRecent();

    return ok(await toAdminInviteItems(invites, repositories));
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const session = await requireAdminRequestSession(request);
    const repositories = getRepositories();
    const invite = await repositories.registrationInvites.create({
      code: createInviteCode(),
      createdByUserId: session.user.id,
      id: randomUUID(),
    });

    if (!invite) {
      throw new ApiError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create invite.',
        status: 500,
      });
    }

    return ok(await toAdminInviteItem(invite, repositories));
  } catch (error) {
    return fail(error);
  }
}

function createInviteCode() {
  return `INV-${randomUUID().replaceAll('-', '').slice(0, 12).toUpperCase()}`;
}
