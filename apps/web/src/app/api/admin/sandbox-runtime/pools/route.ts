import { fail, ok } from '@/lib/api-error';
import { requireAdminRequestSession } from '@/lib/admin';
import { resolveSrtPoolStatusFile } from '@/lib/env';
import { getRepositories } from '@/lib/repositories';
import { listAdminSandboxRuntimePools } from '@/lib/sandbox-runtime-admin';

export async function GET(request: Request): Promise<Response> {
  try {
    await requireAdminRequestSession(request);

    return ok(await listAdminSandboxRuntimePools({
      repositories: getRepositories(),
      statusFilePath: resolveSrtPoolStatusFile(),
    }));
  } catch (error) {
    return fail(error);
  }
}
