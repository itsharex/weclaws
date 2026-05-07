import { z } from 'zod';
import { ApiError, fail, ok } from '@/lib/api-error';
import { SUPPORTED_LLM_API_TYPES } from '@/lib/llm-api-types';
import { createUserLlmProfile, listUserLlmProfiles } from '@/lib/llm-profiles';
import { requireRequestSession } from '@/lib/session';

const createUserLlmProfileSchema = z.object({
  apiKey: z.string().trim().min(1).max(4000),
  apiType: z.enum(SUPPORTED_LLM_API_TYPES),
  baseUrl: z.string().trim().min(1).max(2000).nullable().optional(),
  model: z.string().trim().min(1).max(200),
  name: z.string().trim().min(1).max(200),
  provider: z.string().trim().min(1).max(200),
});

export async function GET(request: Request): Promise<Response> {
  try {
    const session = await requireRequestSession(request);
    return ok(await listUserLlmProfiles(session.user.id));
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const session = await requireRequestSession(request);
    const payload = await readJsonBody(request);
    const parsed = createUserLlmProfileSchema.safeParse(payload);

    if (!parsed.success) {
      throw new ApiError({
        code: 'VALIDATION_ERROR',
        message: 'Invalid llm profile payload.',
        status: 400,
      });
    }

    return ok(await createUserLlmProfile(session.user.id, parsed.data));
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
