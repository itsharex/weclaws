import { ApiError, fail, ok } from '@/lib/api-error';
import { requireAdminRequestSession } from '@/lib/admin';
import { getRepositories } from '@/lib/repositories';

interface RouteContext {
  params: Promise<{ id: string }> | { id: string };
}

export async function DELETE(request: Request, context: RouteContext): Promise<Response> {
  try {
    await requireAdminRequestSession(request);
    const { id } = await context.params;
    const repositories = getRepositories();
    const deleted = await repositories.registrationInvites.deleteUnusedById(id);

    if (deleted) {
      return ok({ id: deleted.id });
    }

    const current = await repositories.registrationInvites.findById(id);

    if (!current) {
      throw new ApiError({
        code: 'NOT_FOUND',
        message: 'Invite not found.',
        status: 404,
      });
    }

    throw new ApiError({
      code: 'INVITE_DELETE_NOT_ALLOWED',
      message: 'Only unused and unreserved invites can be deleted.',
      status: 409,
    });
  } catch (error) {
    return fail(error);
  }
}
