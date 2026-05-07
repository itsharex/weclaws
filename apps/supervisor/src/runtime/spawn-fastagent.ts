import { constants as fsConstants } from 'node:fs';
import { access, mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import type { ChildProcess } from 'node:child_process';
import { resolveBotInstancePaths } from '@weclaws/shared';
import type { SupervisorConfig } from '../config';
import { registerSandboxWorkspace } from './sandbox-workspace-map';

const require = createRequire(import.meta.url);
const TSX_IMPORT_PATH = require.resolve('tsx');
const SAFE_INHERITED_ENV_KEYS = [
  'ALL_PROXY',
  'HOME',
  'HTTPS_PROXY',
  'HTTP_PROXY',
  'LANG',
  'LC_ALL',
  'LC_CTYPE',
  'LOGNAME',
  'NODE_EXTRA_CA_CERTS',
  'NO_PROXY',
  'PATH',
  'SSL_CERT_DIR',
  'SSL_CERT_FILE',
  'TEMP',
  'TERM',
  'TMP',
  'TMPDIR',
  'TZ',
  'USER',
  'all_proxy',
  'http_proxy',
  'https_proxy',
  'no_proxy',
] as const;

export type MockFastAgentScenario = 'crash_after_running' | 'happy';

export interface SpawnableBotInstance {
  id: string;
  llmConfigId?: string | null;
  ownerUserId: string;
  model: string;
  provider: string;
}

export interface ResolvedFastAgentRuntimeConfig {
  apiKey: string;
  apiType: string | null;
  baseUrl: string | null;
  model: string;
  provider: string;
}

export interface SpawnFastAgentInput {
  botInstance: SpawnableBotInstance;
  config: SupervisorConfig;
  mockScenario?: MockFastAgentScenario;
  runtimeConfig: ResolvedFastAgentRuntimeConfig;
  sandboxRuntimePool?: ResolvedSandboxRuntimePool;
  stepDelayMs?: number;
}

export interface ResolvedSandboxRuntimePool {
  apiKey: string;
  url: string;
  workspaceMapFile: string;
}

export interface FastAgentSpawnSpec {
  args: string[];
  command: string;
  cwd: string;
  env: NodeJS.ProcessEnv;
}

export async function createFastAgentSpawnSpec(input: SpawnFastAgentInput): Promise<FastAgentSpawnSpec> {
  const instancePaths = resolveBotInstancePaths(input.config.instancesRoot, input.botInstance.id);
  await Promise.all([
    mkdir(instancePaths.dataDir, { recursive: true }),
    mkdir(instancePaths.workspaceDir, { recursive: true }),
    mkdir(instancePaths.logDir, { recursive: true }),
  ]);

  if (input.config.sandboxMode === 'remote') {
    if (!input.sandboxRuntimePool) {
      throw new Error('Remote sandbox mode requires a resolved user sandbox runtime pool.');
    }

    await registerSandboxWorkspace({
      workspaceMapFile: input.sandboxRuntimePool.workspaceMapFile,
      workspacePath: instancePaths.workspaceDir,
    });
  }

  const env: NodeJS.ProcessEnv = {
    ...pickSafeInheritedEnv(process.env),
    FASTAGENT_API_KEY: input.runtimeConfig.apiKey,
    FASTAGENT_MODEL: input.runtimeConfig.model,
    FASTAGENT_PROVIDER: input.runtimeConfig.provider,
    IM_GATEWAY_AGENT_ID: input.botInstance.id,
    IM_GATEWAY_ALLOW_ALL_PERMISSIONS: 'true',
    IM_GATEWAY_DATA_DIR: instancePaths.dataDir,
    IM_GATEWAY_WORKSPACE_DIR: instancePaths.workspaceDir,
  };

  if (input.runtimeConfig.baseUrl) {
    env.FASTAGENT_BASE_URL = input.runtimeConfig.baseUrl;
  }

  if (input.runtimeConfig.apiType) {
    env.FASTAGENT_API_TYPE = input.runtimeConfig.apiType;
  }

  const args = [
    '--channel',
    'weixin',
  ];

  if (input.config.sandboxMode === 'remote') {
    if (!input.sandboxRuntimePool) {
      throw new Error('Remote sandbox mode requires a resolved user sandbox runtime pool.');
    }

    env.SANDBOX_API_KEY = input.sandboxRuntimePool.apiKey;
    env.SANDBOX_URL = input.sandboxRuntimePool.url;
    args.push(
      '--sandbox',
      'remote',
      '--sandbox-url',
      input.sandboxRuntimePool.url,
    );
  }

  args.push('--output', 'jsonl');

  if (input.mockScenario) {
    return {
      args: ['--import', TSX_IMPORT_PATH, input.config.mockFastAgentFixturePath],
      command: process.execPath,
      cwd: instancePaths.workspaceDir,
      env: {
        ...env,
        MOCK_FASTAGENT_SCENARIO: input.mockScenario,
        MOCK_FASTAGENT_STEP_DELAY_MS: String(input.stepDelayMs ?? 50),
      },
    };
  }

  await assertExecutableBinary(input.config.fastagentBinaryPath);

  return {
    args,
    command: input.config.fastagentBinaryPath,
    cwd: instancePaths.workspaceDir,
    env,
  };
}

export async function spawnFastAgentProcess(input: SpawnFastAgentInput): Promise<ChildProcess> {
  const spec = await createFastAgentSpawnSpec(input);

  return spawn(spec.command, spec.args, {
    cwd: spec.cwd,
    env: spec.env,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

async function assertExecutableBinary(binaryPath: string) {
  try {
    await access(binaryPath, fsConstants.F_OK);
  } catch {
    throw new Error(`FastAgent binary not found: ${binaryPath}`);
  }

  try {
    await access(binaryPath, fsConstants.X_OK);
  } catch {
    throw new Error(`FastAgent binary is not executable: ${binaryPath}`);
  }
}

function pickSafeInheritedEnv(env: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  const nextEnv: NodeJS.ProcessEnv = {};

  for (const [key, value] of Object.entries(env)) {
    if (!value) {
      continue;
    }

    if (
      SAFE_INHERITED_ENV_KEYS.includes(key as typeof SAFE_INHERITED_ENV_KEYS[number])
    ) {
      nextEnv[key] = value;
    }
  }

  return nextEnv;
}
