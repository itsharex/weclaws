export const BOT_DESIRED_STATES = ['running', 'stopped'] as const;

export type BotDesiredState = (typeof BOT_DESIRED_STATES)[number];

export const BOT_STATUSES = [
  'provisioning',
  'starting',
  'waiting_for_qr',
  'running',
  'degraded',
  'stopping',
  'stopped',
  'failed',
] as const;

export type BotStatus = (typeof BOT_STATUSES)[number];
