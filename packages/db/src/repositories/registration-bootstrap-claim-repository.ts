import { eq, sql } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { registrationBootstrapClaims } from '../schema/registration-bootstrap-claims';
import { users } from '../schema/users';
import type * as schema from '../schema/index';

type Db = BetterSQLite3Database<typeof schema>;

const BOOTSTRAP_CLAIM_ROW_ID = 'global';

export interface ClaimRegistrationBootstrapInput {
  claimToken: string;
  claimedAt?: Date;
  claimedByEmail: string;
  staleBefore: Date;
}

export class RegistrationBootstrapClaimRepository {
  constructor(private readonly db: Db) {}

  async findByClaimToken(claimToken: string) {
    const row = this.db.select()
      .from(registrationBootstrapClaims)
      .where(eq(registrationBootstrapClaims.claimToken, claimToken))
      .get();

    return row ?? null;
  }

  async claim(input: ClaimRegistrationBootstrapInput) {
    const claimedAt = input.claimedAt ?? new Date();
    const claimedByEmail = input.claimedByEmail.trim().toLowerCase();

    const claim = this.db.transaction((tx) => {
      const countRow = tx.select({
        count: sql<number>`count(*)`,
      }).from(users).get();

      if (Number(countRow?.count ?? 0) !== 0) {
        return null;
      }

      const existing = tx.select()
        .from(registrationBootstrapClaims)
        .where(eq(registrationBootstrapClaims.id, BOOTSTRAP_CLAIM_ROW_ID))
        .get();

      if (existing?.claimedAt && existing.claimedAt >= input.staleBefore) {
        return null;
      }

      if (existing) {
        tx.update(registrationBootstrapClaims)
          .set({
            claimToken: input.claimToken,
            claimedAt,
            claimedByEmail,
          })
          .where(eq(registrationBootstrapClaims.id, BOOTSTRAP_CLAIM_ROW_ID))
          .run();
      } else {
        tx.insert(registrationBootstrapClaims)
          .values({
            id: BOOTSTRAP_CLAIM_ROW_ID,
            claimToken: input.claimToken,
            claimedAt,
            claimedByEmail,
          })
          .run();
      }

      return tx.select()
        .from(registrationBootstrapClaims)
        .where(eq(registrationBootstrapClaims.id, BOOTSTRAP_CLAIM_ROW_ID))
        .get() ?? null;
    }, { behavior: 'immediate' });

    return claim;
  }

  async release(claimToken: string) {
    this.db.update(registrationBootstrapClaims)
      .set({
        claimToken: null,
        claimedAt: null,
        claimedByEmail: null,
      })
      .where(eq(registrationBootstrapClaims.claimToken, claimToken))
      .run();
  }
}
