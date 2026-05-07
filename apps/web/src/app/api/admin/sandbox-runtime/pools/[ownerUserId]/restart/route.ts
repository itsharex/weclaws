import { fail, ok } from '@/lib/api-error';
import { requireAdminRequestSession } from '@/lib/admin';
import { getRepositories } from '@/lib/repositories';
import { requestAdminSandboxRuntimePoolRestart } from '@/lib/sandbox-runtime-admin';

interface RouteContext {
  params: Promise<{ ownerUserId: string }> | { ownerUserId: string };
}

export async function POST(request: Request, context: RouteContext): Promise<Response> {
  try {
    await requireAdminRequestSession(request);
    const { ownerUserId } = await context.params;

    return ok(await requestAdminSandboxRuntimePoolRestart({
      ownerUserId,
      repositories: getRepositories(),
    }));
  } catch (error) {
    return fail(error);
  }
}
