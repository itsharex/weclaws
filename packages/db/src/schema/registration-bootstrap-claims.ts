import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const registrationBootstrapClaims = sqliteTable(
  'registration_bootstrap_claims',
  {
    id: text('id').primaryKey(),
    claimToken: text('claim_token'),
    claimedByEmail: text('claimed_by_email'),
    claimedAt: integer('claimed_at', { mode: 'timestamp_ms' }),
  },
  (table) => ({
    claimTokenIndex: uniqueIndex('registration_bootstrap_claims_token_idx').on(table.claimToken),
    claimedAtIndex: index('registration_bootstrap_claims_claimed_at_idx').on(table.claimedAt),
  }),
);
