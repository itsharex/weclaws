import { existsSync } from 'node:fs';
import path from 'node:path';
import {
  DEFAULT_RECONCILE_INTERVAL_MS,
  parseSandboxRuntimePoolDefaults,
  resolveInstancesRootPath,
  type SandboxRuntimePoolDefaults,
} from '@weclaws/shared';
import { getFastAgentBinaryPathOrThrow } from './runtime/resolve-fastagent-binary-path';

const DEFAULT_DATABASE_URL = 'file:./storage/sqlite/db.sqlite';
const DEFAULT_SRT_SERVICE_HOST = 'sandbox-runtime';

export type SupervisorSandboxMode = 'disabled' | 'remote';

export interface SupervisorConfig {
  databaseUrl: string;
  fastagentBinaryPath: string;
  instancesRoot: string;
  mockFastAgentFixturePath: string;
  reconcileIntervalMs: number;
  sandboxApiKey: string | null;
  sandboxMode: SupervisorSandboxMode;
  sandboxUrl: string | null;
  srtPoolConfigFile: string | null;
  srtPoolDefaults: SandboxRuntimePoolDefaults | null;
  srtPoolStatusFile: string | null;
  srtServiceHost: string | null;
  srtWorkspaceMapDir: string | null;
  workspaceRoot: string;
}

export function getSupervisorConfig(
  env: NodeJS.ProcessEnv = process.env,
  cwd: string = process.cwd(),
): SupervisorConfig {
  const workspaceRoot = getWorkspaceRoot(cwd);
  loadWorkspaceEnvFileIfNeeded(env, workspaceRoot);
  const sandboxMode = parseSandboxMode(env.FASTAGENT_SANDBOX_MODE);
  const reconcileIntervalMs = parsePositiveInteger(
    env.RECONCILE_INTERVAL_MS,
    DEFAULT_RECONCILE_INTERVAL_MS,
    'RECONCILE_INTERVAL_MS',
  );
  const instancesRoot = resolveInstancesRootPath(workspaceRoot, env.INSTANCES_ROOT);

  return {
    databaseUrl: env.DATABASE_URL ?? DEFAULT_DATABASE_URL,
    fastagentBinaryPath: getFastAgentBinaryPathOrThrow(env, {
      packageRoot: path.join(workspaceRoot, 'apps', 'supervisor'),
    }),
    instancesRoot,
    mockFastAgentFixturePath: path.join(workspaceRoot, 'tests', 'fixtures', 'mock-fastagent.ts'),
    reconcileIntervalMs,
    sandboxApiKey: null,
    sandboxMode,
    sandboxUrl: null,
    srtPoolConfigFile: sandboxMode === 'remote'
      ? resolveWorkspaceRelativePath(
        env.SRT_POOL_CONFIG_FILE,
        workspaceRoot,
        path.join('storage', 'sandbox-runtime-private', 'srt-pools.json'),
      )
      : null,
    srtPoolDefaults: sandboxMode === 'remote' ? parseSandboxRuntimePoolDefaults(env) : null,
    srtPoolStatusFile: sandboxMode === 'remote'
      ? resolveWorkspaceRelativePath(
        env.SRT_POOL_STATUS_FILE,
        workspaceRoot,
        path.join('storage', 'sandbox-runtime-private', 'srt-pool-status.json'),
      )
      : null,
    srtServiceHost: sandboxMode === 'remote' ? (env.SRT_SERVICE_HOST?.trim() || DEFAULT_SRT_SERVICE_HOST) : null,
    srtWorkspaceMapDir: sandboxMode === 'remote'
      ? resolveWorkspaceRelativePath(
        env.SRT_WORKSPACE_MAP_DIR,
        workspaceRoot,
        path.join('storage', 'sandbox-runtime-private', 'workspace-map'),
      )
      : null,
    workspaceRoot,
  };
}

function loadWorkspaceEnvFileIfNeeded(env: NodeJS.ProcessEnv, workspaceRoot: string) {
  if (env !== process.env) {
    return;
  }

  const envFilePath = path.join(workspaceRoot, '.env');

  if (!existsSync(envFilePath)) {
    return;
  }

  process.loadEnvFile(envFilePath);
}

function parseSandboxMode(value: string | undefined): SupervisorSandboxMode {
  if (!value || value === 'remote') {
    return 'remote';
  }

  if (value === 'disabled') {
    return 'disabled';
  }

  throw new Error('FASTAGENT_SANDBOX_MODE must be one of: remote, disabled.');
}

function parsePositiveInteger(value: string | undefined, fallback: number, key: string): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${key} must be a positive integer.`);
  }

  return parsed;
}

function resolveWorkspaceRelativePath(
  configuredPath: string | undefined,
  workspaceRoot: string,
  fallbackRelativePath: string,
): string {
  const nextPath = configuredPath?.trim() || fallbackRelativePath;
  return path.isAbsolute(nextPath) ? nextPath : path.join(workspaceRoot, nextPath);
}

function getWorkspaceRoot(startDir: string): string {
  let currentDir = path.resolve(startDir);

  while (true) {
    if (existsSync(path.join(currentDir, 'pnpm-workspace.yaml'))) {
      return currentDir;
    }

    const parentDir = path.dirname(currentDir);

    if (parentDir === currentDir) {
      throw new Error('Unable to locate workspace root.');
    }

    currentDir = parentDir;
  }
}
