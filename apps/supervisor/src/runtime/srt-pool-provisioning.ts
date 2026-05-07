import type {
  UserSandboxRuntimePoolRepository,
  UserSandboxRuntimePoolRecord,
} from '@weclaws/db';
import type { SandboxRuntimePoolDefaults } from '@weclaws/shared';
import { writeSandboxRuntimePoolConfigFile } from './srt-pool-config-file';

export interface EnsureUserSandboxRuntimePoolInput {
  defaults: SandboxRuntimePoolDefaults;
  ownerUserId: string;
  repository: UserSandboxRuntimePoolRepository;
}

export interface RenderAllSandboxRuntimePoolsInput {
  filePath: string;
  now?: Date;
  repository: UserSandboxRuntimePoolRepository;
  serviceHost: string;
  workspaceMapDir: string;
}

export async function ensureUserSandboxRuntimePool(
  input: EnsureUserSandboxRuntimePoolInput,
): Promise<UserSandboxRuntimePoolRecord> {
  return input.repository.ensureForUser({
    defaults: input.defaults,
    ownerUserId: input.ownerUserId,
  });
}

export async function renderAllSandboxRuntimePools(input: RenderAllSandboxRuntimePoolsInput): Promise<void> {
  const pools = await input.repository.listAll();

  await writeSandboxRuntimePoolConfigFile({
    filePath: input.filePath,
    now: input.now,
    pools,
    serviceHost: input.serviceHost,
    workspaceMapDir: input.workspaceMapDir,
  });
}
