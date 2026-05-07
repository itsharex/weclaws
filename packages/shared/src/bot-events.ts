import {
  FASTAGENT_JSONL_EVENT_TYPES,
  type FastAgentJsonlEvent,
  type FastAgentJsonlEventType,
} from './fastagent-jsonl';

export const BOT_EVENT_TYPES = FASTAGENT_JSONL_EVENT_TYPES;

export type BotEventType = FastAgentJsonlEventType;

export type BotEvent = FastAgentJsonlEvent;
