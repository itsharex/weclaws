import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { botInstances } from './bot-instances';

export const botEvents = sqliteTable(
  'bot_events',
  {
    id: text('id').primaryKey(),
    botInstanceId: text('bot_instance_id')
      .notNull()
      .references(() => botInstances.id, { onDelete: 'cascade' }),
    type: text('type').notNull(),
    message: text('message').notNull(),
    payloadJson: text('payload_json').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => ({
    botInstanceCreatedAtIndex: index('bot_events_bot_instance_created_at_idx').on(
      table.botInstanceId,
      table.createdAt,
    ),
  }),
);
