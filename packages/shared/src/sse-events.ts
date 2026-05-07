export const BOT_SSE_EVENT_NAMES = [
  'bot.status.updated',
  'bot.qrcode.updated',
  'bot.event.created',
  'bot.error.updated',
  'bot.stream.error',
] as const;

export type BotSseEventName = (typeof BOT_SSE_EVENT_NAMES)[number];
