import { z } from 'zod';
import { createBot, listBots } from '@/lib/bot-service';
import { ApiError, fail, ok } from '@/lib/api-error';
import { requireRequestSession } from '@/lib/session';

const createBotSchema = z.object({
  llmProfileId: z.string().trim().min(1),
  name: z.string().trim().min(1),
});

export async function GET(request: Request): Promise<Response> {
  try {
    const session = await requireRequestSession(request);
    const bots = await listBots(session.user.id);

    return ok(bots);
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const session = await requireRequestSession(request);
    const payload = await readJsonBody(request);
    const parsed = createBotSchema.safeParse(payload);

    if (!parsed.success) {
      throw new ApiError({
        code: 'VALIDATION_ERROR',
        message: 'Invalid bot creation payload.',
        status: 400,
      });
    }

    const bot = await createBot({
      ownerUserId: session.user.id,
      ...parsed.data,
    });

    return ok(bot);
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
