import { z } from 'zod';
import { ApiError, fail, ok } from '@/lib/api-error';
import { SUPPORTED_LLM_API_TYPES } from '@/lib/llm-api-types';
import { deleteUserLlmProfile, updateUserLlmProfile } from '@/lib/llm-profiles';
import { requireRequestSession } from '@/lib/session';

interface RouteContext {
  params: Promise<{ profileId: string }> | { profileId: string };
}

const updateUserLlmProfileSchema = z.object({
  apiKey: z.string().trim().min(1).max(4000).optional(),
  apiType: z.enum(SUPPORTED_LLM_API_TYPES).optional(),
  baseUrl: z.string().trim().min(1).max(2000).nullable().optional(),
  model: z.string().trim().min(1).max(200).optional(),
  name: z.string().trim().min(1).max(200).optional(),
  provider: z.string().trim().min(1).max(200).optional(),
});

export async function PATCH(request: Request, context: RouteContext): Promise<Response> {
  try {
    const session = await requireRequestSession(request);
    const { profileId } = await context.params;
    const payload = await readJsonBody(request);
    const parsed = updateUserLlmProfileSchema.safeParse(payload);

    if (!parsed.success) {
      throw new ApiError({
        code: 'VALIDATION_ERROR',
        message: 'Invalid llm profile payload.',
        status: 400,
      });
    }

    return ok(await updateUserLlmProfile(session.user.id, profileId, parsed.data));
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(request: Request, context: RouteContext): Promise<Response> {
  try {
    const session = await requireRequestSession(request);
    const { profileId } = await context.params;
    return ok(await deleteUserLlmProfile(session.user.id, profileId));
  } catch (error) {
    return fail(error);
  }
}

async function readJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}
