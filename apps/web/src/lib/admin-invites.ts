import type { WebRepositories } from './repositories';

type RegistrationInviteRecord = Awaited<ReturnType<WebRepositories['registrationInvites']['listRecent']>>[number];

export interface AdminInviteItem {
  canDelete: boolean;
  code: string;
  createdAt: string;
  createdByEmail: string;
  id: string;
  reservedAt: string | null;
  reservedByEmail: string | null;
  usedAt: string | null;
  usedByEmail: string | null;
}

export async function toAdminInviteItem(
  invite: RegistrationInviteRecord,
  repositories: Pick<WebRepositories, 'users'>,
): Promise<AdminInviteItem> {
  const [item] = await toAdminInviteItems([invite], repositories);

  return item;
}

export async function toAdminInviteItems(
  invites: readonly RegistrationInviteRecord[],
  repositories: Pick<WebRepositories, 'users'>,
): Promise<AdminInviteItem[]> {
  const userIds = Array.from(new Set(
    invites.flatMap((invite) => [
      invite.createdByUserId,
      invite.usedByUserId,
    ]).filter((userId): userId is string => Boolean(userId))
  ));

  const users = await Promise.all(userIds.map(async (userId) => repositories.users.findById(userId)));
  const emailByUserId = new Map<string, string>();

  users.forEach((user, index) => {
    if (!user) {
      return;
    }

    emailByUserId.set(userIds[index], user.email);
  });

  return invites.map((invite) => ({
    canDelete: invite.usedAt === null
      && invite.reservedAt == null
      && invite.reservedByEmail == null
      && invite.reservationToken == null,
    code: invite.code,
    createdAt: invite.createdAt.toISOString(),
    createdByEmail: emailByUserId.get(invite.createdByUserId) ?? invite.createdByUserId,
    id: invite.id,
    reservedAt: invite.reservedAt ? invite.reservedAt.toISOString() : null,
    reservedByEmail: invite.reservedByEmail ?? null,
    usedAt: invite.usedAt ? invite.usedAt.toISOString() : null,
    usedByEmail: invite.usedByUserId
      ? (emailByUserId.get(invite.usedByUserId) ?? invite.usedByUserId)
      : null,
  }));
}
