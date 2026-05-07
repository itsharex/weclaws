import { mkdir, rename, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import type { UserSandboxRuntimePoolRecord } from '@weclaws/db';
import {
  normalizeSandboxRuntimeDenyReadPaths,
  SRT_POOL_CONFIG_FILE_VERSION,
} from '@weclaws/shared';

export interface SandboxRuntimePoolConfigEntry {
  apiKey: string;
  defaultAllowRead: string[];
  defaultAllowWrite: string[];
  defaultDeniedDomains: string[];
  defaultDenyRead: string[];
  defaultDenyWrite: string[];
  enabled: boolean;
  healthCheckIntervalMs: number;
  maxConcurrentInit: number;
  minReadyProcesses: number;
  ownerUserId: string;
  poolSize: number;
  port: number;
  portRangeEnd: number;
  portRangeStart: number;
  restartRequestedAt: string | null;
  sessionTimeoutMs: number;
  updatedAt: string;
  url: string;
  workspaceBasePath: string;
  workspaceMapFile: string;
}

export interface SandboxRuntimePoolConfigDocument {
  pools: SandboxRuntimePoolConfigEntry[];
  updatedAt: string;
  version: number;
}

export interface CreateSandboxRuntimePoolConfigDocumentInput {
  now?: Date;
  pools: UserSandboxRuntimePoolRecord[];
  serviceHost: string;
  workspaceMapDir: string;
}

export interface WriteSandboxRuntimePoolConfigFileInput extends CreateSandboxRuntimePoolConfigDocumentInput {
  filePath: string;
}

export function createSandboxRuntimePoolConfigDocument(
  input: CreateSandboxRuntimePoolConfigDocumentInput,
): SandboxRuntimePoolConfigDocument {
  return {
    pools: [...input.pools]
      .sort((first, second) => first.ownerUserId.localeCompare(second.ownerUserId))
      .map((pool) => ({
        apiKey: pool.apiKey,
        defaultAllowRead: pool.defaultAllowRead,
        defaultAllowWrite: pool.defaultAllowWrite,
        defaultDeniedDomains: pool.defaultDeniedDomains,
        defaultDenyRead: normalizeSandboxRuntimeDenyReadPaths(pool.defaultDenyRead),
        defaultDenyWrite: pool.defaultDenyWrite,
        enabled: pool.enabled,
        healthCheckIntervalMs: pool.healthCheckIntervalMs,
        maxConcurrentInit: pool.maxConcurrentInit,
        minReadyProcesses: pool.minReadyProcesses,
        ownerUserId: pool.ownerUserId,
        poolSize: pool.poolSize,
        port: pool.port,
        portRangeEnd: pool.portRangeEnd,
        portRangeStart: pool.portRangeStart,
        restartRequestedAt: pool.restartRequestedAt?.toISOString() ?? null,
        sessionTimeoutMs: pool.sessionTimeoutMs,
        updatedAt: pool.updatedAt.toISOString(),
        url: `http://${input.serviceHost}:${pool.port}`,
        workspaceBasePath: pool.workspaceBasePath,
        workspaceMapFile: join(input.workspaceMapDir, `${pool.ownerUserId}.json`),
      })),
    updatedAt: (input.now ?? new Date()).toISOString(),
    version: SRT_POOL_CONFIG_FILE_VERSION,
  };
}

export async function writeSandboxRuntimePoolConfigFile(
  input: WriteSandboxRuntimePoolConfigFileInput,
): Promise<SandboxRuntimePoolConfigDocument> {
  const document = createSandboxRuntimePoolConfigDocument(input);
  await mkdir(dirname(input.filePath), { recursive: true });

  const tempFile = `${input.filePath}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(tempFile, `${JSON.stringify(document, null, 2)}\n`, 'utf8');
  await rename(tempFile, input.filePath);

  return document;
}
