import { getBotDetail, listBotEvents, listBotEventsAfterCursor } from '@/lib/bot-service';
import { fail } from '@/lib/api-error';
import { requireOwnedBot, requireRequestSession } from '@/lib/session';
import { createBotStreamResponse } from '@/lib/sse';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ id: string }> | { id: string };
}

export async function GET(request: Request, context: RouteContext): Promise<Response> {
  try {
    const session = await requireRequestSession(request);
    const { id } = await context.params;

    await requireOwnedBot(id, session.user.id);

    return createBotStreamResponse({
      botId: id,
      getBotDetail,
      listBotEvents,
      listBotEventsAfterCursor,
      signal: request.signal,
    });
  } catch (error) {
    return fail(error);
  }
}
