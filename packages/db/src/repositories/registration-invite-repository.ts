import { and, desc, eq, isNull, lt, or } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { registrationInvites } from '../schema/registration-invites';
import type * as schema from '../schema/index';

type Db = BetterSQLite3Database<typeof schema>;

export interface CreateRegistrationInviteInput {
  id: string;
  code: string;
  createdByUserId: string;
  createdAt?: Date;
}

export interface ReserveRegistrationInviteInput {
  code: string;
  reservationToken: string;
  reservedAt?: Date;
  reservedByEmail: string;
  staleBefore: Date;
}

export interface ConsumeRegistrationInviteReservationInput {
  reservationToken: string;
  usedAt?: Date;
  usedByUserId: string;
}

export class RegistrationInviteRepository {
  constructor(private readonly db: Db) {}

  async create(input: CreateRegistrationInviteInput) {
    this.db.insert(registrationInvites).values({
      ...input,
      createdAt: input.createdAt ?? new Date(),
    }).run();

    return this.findByCode(input.code);
  }

  async findById(id: string) {
    const row = this.db.select()
      .from(registrationInvites)
      .where(eq(registrationInvites.id, id))
      .get();

    return row ?? null;
  }

  async findByCode(code: string) {
    const row = this.db.select()
      .from(registrationInvites)
      .where(eq(registrationInvites.code, code))
      .get();

    return row ?? null;
  }

  async findByReservationToken(reservationToken: string) {
    const row = this.db.select()
      .from(registrationInvites)
      .where(eq(registrationInvites.reservationToken, reservationToken))
      .get();

    return row ?? null;
  }

  async listRecent(limit: number = 50) {
    return this.db.select()
      .from(registrationInvites)
      .orderBy(desc(registrationInvites.createdAt), desc(registrationInvites.id))
      .limit(limit)
      .all();
  }

  async deleteUnusedById(id: string) {
    const invite = await this.findById(id);

    if (!invite) {
      return null;
    }

    const result = this.db.delete(registrationInvites)
      .where(
        and(
          eq(registrationInvites.id, id),
          isNull(registrationInvites.usedAt),
          isNull(registrationInvites.reservationToken),
          isNull(registrationInvites.reservedAt),
          isNull(registrationInvites.reservedByEmail),
        ),
      )
      .run();

    if (result.changes === 0) {
      return null;
    }

    return invite;
  }

  async reserve(input: ReserveRegistrationInviteInput) {
    const reservedAt = input.reservedAt ?? new Date();
    const reservedByEmail = input.reservedByEmail.trim().toLowerCase();
    const result = this.db.update(registrationInvites)
      .set({
        reservationToken: input.reservationToken,
        reservedAt,
        reservedByEmail,
      })
      .where(
        and(
          eq(registrationInvites.code, input.code),
          isNull(registrationInvites.usedAt),
          or(
            isNull(registrationInvites.reservationToken),
            isNull(registrationInvites.reservedAt),
            lt(registrationInvites.reservedAt, input.staleBefore),
          ),
        ),
      )
      .run();

    if (result.changes === 0) {
      return null;
    }

    return this.findByReservationToken(input.reservationToken);
  }

  async releaseReservation(reservationToken: string) {
    this.db.update(registrationInvites)
      .set({
        reservationToken: null,
        reservedAt: null,
        reservedByEmail: null,
      })
      .where(
        and(
          eq(registrationInvites.reservationToken, reservationToken),
          isNull(registrationInvites.usedAt),
        ),
      )
      .run();
  }

  async consumeReservation(input: ConsumeRegistrationInviteReservationInput) {
    const invite = await this.findByReservationToken(input.reservationToken);

    if (!invite || invite.usedAt) {
      return null;
    }

    const result = this.db.update(registrationInvites)
      .set({
        reservationToken: null,
        reservedAt: null,
        reservedByEmail: null,
        usedAt: input.usedAt ?? new Date(),
        usedByUserId: input.usedByUserId,
      })
      .where(
        and(
          eq(registrationInvites.id, invite.id),
          eq(registrationInvites.reservationToken, input.reservationToken),
          isNull(registrationInvites.usedAt),
        ),
      )
      .run();

    if (result.changes === 0) {
      return null;
    }

    return this.findById(invite.id);
  }
}
