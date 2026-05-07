import { integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { users } from './users';

export const userLlmProfiles = sqliteTable(
  'user_llm_profiles',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    provider: text('provider').notNull(),
    model: text('model').notNull(),
    apiKey: text('api_key').notNull(),
    baseUrl: text('base_url'),
    apiType: text('api_type'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => ({
    userNameIndex: uniqueIndex('user_llm_profiles_user_name_idx').on(table.userId, table.name),
  }),
);
