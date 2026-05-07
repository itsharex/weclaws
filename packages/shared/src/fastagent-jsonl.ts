import { z } from 'zod';

export const FASTAGENT_JSONL_EVENT_TYPES = [
  'process_started',
  'qr_code',
  'login_confirmed',
  'running',
  'account_invalid',
  'runtime_error',
  'stopping',
  'stopped',
] as const;

export const FastAgentJsonlEventTypeSchema = z.enum(FASTAGENT_JSONL_EVENT_TYPES);

export type FastAgentJsonlEventType = z.infer<typeof FastAgentJsonlEventTypeSchema>;

export const FastAgentJsonlEventSchema = z.object({
  type: FastAgentJsonlEventTypeSchema,
  timestamp: z.string().datetime(),
  pid: z.number().int().nonnegative(),
  message: z.string().min(1),
  data: z.record(z.string(), z.unknown()),
  agentId: z.string().min(1).optional(),
});

export type FastAgentJsonlEvent = z.infer<typeof FastAgentJsonlEventSchema>;
