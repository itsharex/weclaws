import { z } from 'zod';
import { deleteBot, getBotDetail, updateBotName } from '@/lib/bot-service';
import { ApiError, fail, ok } from '@/lib/api-error';
import { requireOwnedBot, requireRequestSession } from '@/lib/session';

interface RouteContext {
  params: Promise<{ id: string }> | { id: string };
}

const updateBotSchema = z.object({
  name: z.string().trim().min(1),
}).strict();

export async function GET(request: Request, context: RouteContext): Promise<Response> {
  try {
    const session = await requireRequestSession(request);
    const { id } = await context.params;

    await requireOwnedBot(id, session.user.id);

    return ok(await getBotDetail(id));
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(request: Request, context: RouteContext): Promise<Response> {
  try {
    const session = await requireRequestSession(request);
    const { id } = await context.params;

    await requireOwnedBot(id, session.user.id);

    return ok(await deleteBot(id));
  } catch (error) {
    return fail(error);
  }
}

export async function PATCH(request: Request, context: RouteContext): Promise<Response> {
  try {
    const session = await requireRequestSession(request);
    const { id } = await context.params;

    await requireOwnedBot(id, session.user.id);

    const payload = await readJsonBody(request);
    const parsed = updateBotSchema.safeParse(payload);

    if (!parsed.success) {
      throw new ApiError({
        code: 'VALIDATION_ERROR',
        message: 'Invalid bot update payload.',
        status: 400,
      });
    }

    return ok(await updateBotName({
      botId: id,
      ownerUserId: session.user.id,
      name: parsed.data.name,
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
