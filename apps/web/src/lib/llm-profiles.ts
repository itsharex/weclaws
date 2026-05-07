import { randomUUID } from 'node:crypto';
import { ApiError } from './api-error';
import { getRepositories } from './repositories';

export interface LlmProfileItem {
  id: string;
  name: string;
  provider: string;
  model: string;
  baseUrl: string | null;
  apiType: string | null;
  hasApiKey: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserLlmProfileInput {
  name: string;
  provider: string;
  model: string;
  apiKey: string;
  apiType: string;
  baseUrl?: string | null;
}

export interface UpdateUserLlmProfileInput {
  name?: string;
  provider?: string;
  model?: string;
  apiKey?: string;
  baseUrl?: string | null;
  apiType?: string;
}

export interface LlmProfileMutationResult {
  profile: LlmProfileItem;
  restartRequestedBotCount: number;
}

type UserLlmProfileRecord = Awaited<ReturnType<ReturnType<typeof getRepositories>['userLlmProfiles']['findByIdForUser']>>;

export async function listUserLlmProfiles(userId: string): Promise<LlmProfileItem[]> {
  const rows = await getRepositories().userLlmProfiles.listByUserId(userId);
  return rows.map(toLlmProfileItem);
}

export async function createUserLlmProfile(
  userId: string,
  input: CreateUserLlmProfileInput,
): Promise<LlmProfileMutationResult> {
  let profile: UserLlmProfileRecord;

  try {
    profile = await getRepositories().userLlmProfiles.create({
      apiKey: input.apiKey,
      apiType: input.apiType,
      baseUrl: input.baseUrl ?? null,
      id: randomUUID(),
      model: input.model,
      name: input.name,
      provider: input.provider,
      userId,
    });
  } catch (error) {
    throw normalizeLlmProfileWriteError(error);
  }

  if (!profile) {
    throw createInternalError('Failed to create llm profile.');
  }

  return {
    profile: toLlmProfileItem(profile),
    restartRequestedBotCount: 0,
  };
}

export async function updateUserLlmProfile(
  userId: string,
  profileId: string,
  input: UpdateUserLlmProfileInput,
): Promise<LlmProfileMutationResult> {
  const repositories = getRepositories();
  const current = await requireUserLlmProfile(userId, profileId);
  const nextValues = {
    apiKey: input.apiKey ?? current.apiKey,
    apiType: input.apiType === undefined ? current.apiType : input.apiType,
    baseUrl: input.baseUrl === undefined ? current.baseUrl : input.baseUrl,
    model: input.model ?? current.model,
    name: input.name ?? current.name,
    provider: input.provider ?? current.provider,
  };

  if (isNoOpProfileUpdate(current, nextValues)) {
    return {
      profile: toLlmProfileItem(current),
      restartRequestedBotCount: 0,
    };
  }

  let updated: UserLlmProfileRecord;

  try {
    updated = await repositories.userLlmProfiles.updateByIdForUser(profileId, userId, nextValues);
  } catch (error) {
    throw normalizeLlmProfileWriteError(error);
  }

  if (!updated) {
    throw createLlmProfileNotFoundError();
  }

  const restartRequestedBotCount = await requestRestartForBoundRunningBots(userId, profileId);

  return {
    profile: toLlmProfileItem(updated),
    restartRequestedBotCount,
  };
}

export async function deleteUserLlmProfile(
  userId: string,
  profileId: string,
): Promise<{ id: string }> {
  const repositories = getRepositories();
  const boundBots = await repositories.botInstances.listByOwnerUserIdAndLlmConfigId(userId, profileId);

  if (boundBots.length > 0) {
    throw createLlmProfileInUseError();
  }

  let deleted;

  try {
    deleted = await repositories.userLlmProfiles.deleteByIdForUser(profileId, userId);
  } catch (error) {
    if (isSqliteForeignKeyConstraintError(error)) {
      throw createLlmProfileInUseError();
    }

    throw error;
  }

  if (!deleted) {
    throw createLlmProfileNotFoundError();
  }

  return { id: profileId };
}

function toLlmProfileItem(profile: NonNullable<UserLlmProfileRecord>): LlmProfileItem {
  return {
    apiType: profile.apiType,
    baseUrl: profile.baseUrl,
    createdAt: profile.createdAt.toISOString(),
    hasApiKey: Boolean(profile.apiKey),
    id: profile.id,
    model: profile.model,
    name: profile.name,
    provider: profile.provider,
    updatedAt: profile.updatedAt.toISOString(),
  };
}

async function requireUserLlmProfile(userId: string, profileId: string) {
  const profile = await getRepositories().userLlmProfiles.findByIdForUser(profileId, userId);

  if (!profile) {
    throw createLlmProfileNotFoundError();
  }

  return profile;
}

async function requestRestartForBoundRunningBots(userId: string, profileId: string) {
  const repositories = getRepositories();
  const bots = await repositories.botInstances.listByOwnerUserIdAndLlmConfigId(userId, profileId);
  const restartTargets = bots.filter((bot) => bot.desiredState === 'running');

  await Promise.all(restartTargets.map(async (bot) => {
    await repositories.botInstances.requestRestart(bot.id, new Date());
  }));

  return restartTargets.length;
}

function isNoOpProfileUpdate(
  current: NonNullable<UserLlmProfileRecord>,
  next: {
    apiKey: string;
    apiType: string | null;
    baseUrl: string | null;
    model: string;
    name: string;
    provider: string;
  },
) {
  return current.apiKey === next.apiKey
    && current.apiType === next.apiType
    && current.baseUrl === next.baseUrl
    && current.model === next.model
    && current.name === next.name
    && current.provider === next.provider;
}

function normalizeLlmProfileWriteError(error: unknown) {
  if (isSqliteProfileNameConflict(error)) {
    return createLlmProfileNameConflictError();
  }

  return error;
}

function isSqliteProfileNameConflict(error: unknown) {
  return hasSqliteErrorCode(error, 'SQLITE_CONSTRAINT_UNIQUE')
    && hasErrorMessage(error, 'user_llm_profiles.user_id, user_llm_profiles.name');
}

function isSqliteForeignKeyConstraintError(error: unknown) {
  return hasSqliteErrorCode(error, 'SQLITE_CONSTRAINT_FOREIGNKEY')
    || hasErrorMessage(error, 'FOREIGN KEY constraint failed');
}

function hasSqliteErrorCode(error: unknown, code: string) {
  return typeof error === 'object'
    && error !== null
    && 'code' in error
    && error.code === code;
}

function hasErrorMessage(error: unknown, messageFragment: string) {
  return typeof error === 'object'
    && error !== null
    && 'message' in error
    && typeof error.message === 'string'
    && error.message.includes(messageFragment);
}

function createLlmProfileNotFoundError() {
  return new ApiError({
    code: 'NOT_FOUND',
    message: 'LLM profile not found.',
    status: 404,
  });
}

function createLlmProfileNameConflictError() {
  return new ApiError({
    code: 'LLM_PROFILE_NAME_CONFLICT',
    message: 'An LLM profile with this name already exists.',
    status: 409,
  });
}

function createLlmProfileInUseError() {
  return new ApiError({
    code: 'LLM_PROFILE_IN_USE',
    message: 'Rebind or delete the bots using this profile before removing it.',
    status: 409,
  });
}

function createInternalError(message: string) {
  return new ApiError({
    code: 'INTERNAL_SERVER_ERROR',
    message,
    status: 500,
  });
}
