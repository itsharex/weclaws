import { desc } from 'drizzle-orm';
import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { users } from './users';

export const registrationInvites = sqliteTable(
  'registration_invites',
  {
    id: text('id').primaryKey(),
    code: text('code').notNull(),
    createdByUserId: text('created_by_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
    reservationToken: text('reservation_token'),
    reservedAt: integer('reserved_at', { mode: 'timestamp_ms' }),
    reservedByEmail: text('reserved_by_email'),
    usedByUserId: text('used_by_user_id')
      .references(() => users.id, { onDelete: 'set null' }),
    usedAt: integer('used_at', { mode: 'timestamp_ms' }),
  },
  (table) => ({
    codeIndex: uniqueIndex('registration_invites_code_idx').on(table.code),
    createdAtIndex: index('registration_invites_created_at_idx').on(desc(table.createdAt), desc(table.id)),
    createdByUserIdIndex: index('registration_invites_created_by_user_idx').on(table.createdByUserId),
    reservationTokenIndex: uniqueIndex('registration_invites_reservation_token_idx').on(table.reservationToken),
    reservedAtIndex: index('registration_invites_reserved_at_idx').on(table.reservedAt),
    usedByUserIdIndex: index('registration_invites_used_by_user_idx').on(table.usedByUserId),
  }),
);
