import { listBotEvents } from '@/lib/bot-service';
import { fail, ok } from '@/lib/api-error';
import { requireOwnedBot, requireRequestSession } from '@/lib/session';

interface RouteContext {
  params: Promise<{ id: string }> | { id: string };
}

export async function GET(request: Request, context: RouteContext): Promise<Response> {
  try {
    const session = await requireRequestSession(request);
    const { id } = await context.params;

    await requireOwnedBot(id, session.user.id);

    return ok(await listBotEvents(id));
  } catch (error) {
    return fail(error);
  }
}
