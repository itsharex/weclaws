import { z } from 'zod';
import { fail, ok, ApiError } from '@/lib/api-error';
import { updateBotLlmProfile } from '@/lib/bot-service';
import { requireOwnedBot, requireRequestSession } from '@/lib/session';

interface RouteContext {
  params: Promise<{ id: string }> | { id: string };
}

const updateBotLlmProfileSchema = z.object({
  llmProfileId: z.string().trim().min(1),
});

export async function PATCH(request: Request, context: RouteContext): Promise<Response> {
  try {
    const session = await requireRequestSession(request);
    const { id } = await context.params;
    await requireOwnedBot(id, session.user.id);
    const payload = await readJsonBody(request);
    const parsed = updateBotLlmProfileSchema.safeParse(payload);

    if (!parsed.success) {
      throw new ApiError({
        code: 'VALIDATION_ERROR',
        message: 'Invalid llm profile binding payload.',
        status: 400,
      });
    }

    return ok(await updateBotLlmProfile({
      botId: id,
      llmProfileId: parsed.data.llmProfileId,
      ownerUserId: session.user.id,
    }));
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
