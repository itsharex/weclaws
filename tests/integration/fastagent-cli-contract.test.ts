import { execFile } from 'node:child_process';
import type { ChildProcess } from 'node:child_process';
import { chmod, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { promisify } from 'node:util';
import { afterEach, describe, expect, it } from 'vitest';
import {
  buildBareJsonlInvocation,
  buildRuntimeJsonlInvocation,
  parseFastAgentJsonlOutput,
  shouldRunFastAgentContractSmoke,
} from '../../apps/supervisor/src/runtime/fastagent-cli-contract';

const tempDirs: string[] = [];
const execFileAsync = promisify(execFile);
const CONTRACT_TIMEOUT_MS = 5_000;
const MINIMAL_RUNTIME_ARGS = ['--channel', 'weixin', '--output', 'jsonl'] as const;
const UNREACHABLE_SANDBOX_URL = 'http://127.0.0.1:1';

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { force: true, recursive: true })));
});

describe('fastagent cli contract helpers', () => {
  it('parses stdout jsonl into validated FastAgent events', () => {
    const stdout = [
      '{"type":"process_started","timestamp":"2026-03-30T00:00:00.000Z","pid":120,"message":"started","data":{"channel":"weixin"},"agentId":"bot_1"}',
      '{"type":"qr_code","timestamp":"2026-03-30T00:00:02.000Z","pid":120,"message":"qr ready","data":{"qrCodeUrl":"https://example.com/qrcode/1"},"agentId":"bot_1"}',
    ].join('\n');

    const events = parseFastAgentJsonlOutput(stdout);

    expect(events).toHaveLength(2);
    expect(events[0]).toMatchObject({
      agentId: 'bot_1',
      type: 'process_started',
    });
    expect(events[1]).toMatchObject({
      type: 'qr_code',
    });
  });

  it('builds the runtime and bare-root commands defined by the external contract', () => {
    expect(buildRuntimeJsonlInvocation('/opt/fastagent', 'http://sandbox-runtime:8788')).toEqual({
      args: [
        '--channel',
        'weixin',
        '--sandbox',
        'remote',
        '--sandbox-url',
        'http://sandbox-runtime:8788',
        '--output',
        'jsonl',
      ],
      command: '/opt/fastagent',
    });

    expect(buildBareJsonlInvocation('/opt/fastagent')).toEqual({
      args: ['--output', 'jsonl'],
      command: '/opt/fastagent',
    });
  });

  it('reports whether real contract smoke can run from the current env', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'weixin-claws-fastagent-contract-'));
    tempDirs.push(dir);
    const repoLocalBinaryPath = join(dir, 'node_modules', '.bin', 'fastagent');

    expect(shouldRunFastAgentContractSmoke({}, { packageRoot: dir })).toEqual({
      enabled: false,
      reason: 'Unable to locate FastAgent CLI binary. Install @fastagent/cli in apps/supervisor or set FASTAGENT_BINARY_PATH.',
    });

    expect(shouldRunFastAgentContractSmoke({
      FASTAGENT_BINARY_PATH: join(dir, 'missing-fastagent'),
    }, {
      packageRoot: dir,
    })).toEqual({
      enabled: false,
      reason: `FASTAGENT_BINARY_PATH does not exist: ${join(dir, 'missing-fastagent')}`,
    });

    await mkdir(join(dir, 'node_modules', '.bin'), { recursive: true });
    await writeFile(repoLocalBinaryPath, '#!/bin/sh\nexit 0\n');
    await chmod(repoLocalBinaryPath, 0o755);

    expect(shouldRunFastAgentContractSmoke({
      FASTAGENT_API_KEY: 'test-fastagent-key',
      FASTAGENT_DEFAULT_MODEL: 'gpt-5.4',
      FASTAGENT_DEFAULT_PROVIDER: 'openai',
    }, {
      packageRoot: dir,
    })).toEqual({
      binaryPath: repoLocalBinaryPath,
      enabled: true,
    });
  });

  it('keeps real contract smoke disabled when runtime-required env is missing even if the binary exists', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'weixin-claws-fastagent-contract-missing-env-'));
    tempDirs.push(dir);
    const repoLocalBinaryPath = join(dir, 'node_modules', '.bin', 'fastagent');

    await mkdir(join(dir, 'node_modules', '.bin'), { recursive: true });
    await writeFile(repoLocalBinaryPath, '#!/bin/sh\nexit 0\n');
    await chmod(repoLocalBinaryPath, 0o755);

    expect(shouldRunFastAgentContractSmoke({
      FASTAGENT_DEFAULT_MODEL: 'gpt-5.4',
      FASTAGENT_DEFAULT_PROVIDER: 'openai',
    }, {
      packageRoot: dir,
    })).toEqual({
      enabled: false,
      reason: 'FASTAGENT_API_KEY, FASTAGENT_MODEL or FASTAGENT_DEFAULT_MODEL, and FASTAGENT_PROVIDER or FASTAGENT_DEFAULT_PROVIDER are required for FastAgent contract smoke.',
    });
  });
});

const contractSmoke = shouldRunFastAgentContractSmoke(process.env);

describe('fastagent cli contract smoke', () => {
  it.skipIf(!contractSmoke.enabled)('rejects the undocumented bare-root jsonl invocation', async () => {
    if (!contractSmoke.enabled) {
      throw new Error(contractSmoke.reason);
    }

    const invocation = buildBareJsonlInvocation(contractSmoke.binaryPath);
    const result = await runCommand(invocation.command, invocation.args, {
      env: process.env,
    });

    expect(result.exitCode).not.toBe(0);
  }, CONTRACT_TIMEOUT_MS);

  it.skipIf(!contractSmoke.enabled)(
    'captures valid runtime JSONL events and preserves the injected agent id',
    async () => {
      if (!contractSmoke.enabled) {
        throw new Error(contractSmoke.reason);
      }

      const dir = await mkdtemp(join(tmpdir(), 'weixin-claws-fastagent-runtime-'));
      tempDirs.push(dir);

      const dataDir = join(dir, 'data');
      const workspaceDir = join(dir, 'workspace');
      await Promise.all([mkdir(dataDir, { recursive: true }), mkdir(workspaceDir, { recursive: true })]);

      const agentId = 'bot_contract_smoke';
      const result = await runCommand(contractSmoke.binaryPath, [...MINIMAL_RUNTIME_ARGS], {
        env: {
          ...createRuntimeEnv(agentId),
          IM_GATEWAY_AGENT_ID: agentId,
          IM_GATEWAY_ALLOW_ALL_PERMISSIONS: 'true',
          IM_GATEWAY_DATA_DIR: dataDir,
          IM_GATEWAY_WORKSPACE_DIR: workspaceDir,
        },
        timeout: CONTRACT_TIMEOUT_MS,
      });

      const events = parseFastAgentJsonlOutput(result.stdout);

      expect(events.length).toBeGreaterThan(0);
      expect(events[0]).toMatchObject({
        agentId,
        data: expect.any(Object),
        message: expect.any(String),
        pid: expect.any(Number),
        timestamp: expect.any(String),
        type: expect.any(String),
      });
      expect(events.every((event) => event.agentId === agentId)).toBe(true);
    },
    CONTRACT_TIMEOUT_MS + 1_000,
  );

  it.skipIf(!contractSmoke.enabled)(
    'keeps remote sandbox startup lazy and still reaches qr_code before any sandbox session is created',
    async () => {
      if (!contractSmoke.enabled) {
        throw new Error(contractSmoke.reason);
      }

      const dir = await mkdtemp(join(tmpdir(), 'weixin-claws-fastagent-sandbox-lazy-'));
      tempDirs.push(dir);

      const dataDir = join(dir, 'data');
      const workspaceDir = join(dir, 'workspace');
      await Promise.all([mkdir(dataDir, { recursive: true }), mkdir(workspaceDir, { recursive: true })]);

      const invocation = buildRuntimeJsonlInvocation(contractSmoke.binaryPath, UNREACHABLE_SANDBOX_URL);
      const result = await runCommand(invocation.command, invocation.args, {
        env: {
          ...createRuntimeEnv('bot_sandbox_lazy'),
          IM_GATEWAY_AGENT_ID: 'bot_sandbox_lazy',
          IM_GATEWAY_ALLOW_ALL_PERMISSIONS: 'true',
          IM_GATEWAY_DATA_DIR: dataDir,
          IM_GATEWAY_WORKSPACE_DIR: workspaceDir,
          SANDBOX_API_KEY: 'test-sandbox-key',
          SANDBOX_URL: UNREACHABLE_SANDBOX_URL,
        },
        timeout: CONTRACT_TIMEOUT_MS,
      });

      const events = parseFastAgentJsonlOutput(result.stdout);

      expect(events.map((event) => event.type)).toEqual(
        expect.arrayContaining(['process_started', 'qr_code']),
      );
      expect(events.map((event) => event.type)).not.toContain('runtime_error');
    },
    CONTRACT_TIMEOUT_MS + 1_000,
  );
});

interface CommandResult {
  exitCode: ChildProcess['exitCode'] | number;
  signal: ChildProcess['signalCode'] | null;
  stderr: string;
  stdout: string;
}

interface ExecFileFailure extends Error {
  code?: number | string;
  killed?: boolean;
  signal?: NodeJS.Signals;
  stderr?: string;
  stdout?: string;
}

async function runCommand(
  command: string,
  args: readonly string[],
  input: {
    env: NodeJS.ProcessEnv;
    timeout?: number;
  },
): Promise<CommandResult> {
  try {
    const result = await execFileAsync(command, [...args], {
      env: input.env,
      maxBuffer: 1024 * 1024,
      timeout: input.timeout,
    });

    return {
      exitCode: 0,
      signal: null,
      stderr: result.stderr,
      stdout: result.stdout,
    };
  } catch (error) {
    if (!isExecFileFailure(error)) {
      throw error;
    }

    return {
      exitCode: error.code ?? null,
      signal: error.signal ?? null,
      stderr: error.stderr ?? '',
      stdout: error.stdout ?? '',
    };
  }
}

function isExecFileFailure(error: unknown): error is ExecFileFailure {
  return error instanceof Error && (
    'code' in error ||
    'killed' in error ||
    'signal' in error ||
    'stdout' in error ||
    'stderr' in error
  );
}

function createRuntimeEnv(agentId: string): NodeJS.ProcessEnv {
  return {
    ...process.env,
    FASTAGENT_API_KEY: getRequiredEnv('FASTAGENT_API_KEY'),
    FASTAGENT_MODEL: process.env.FASTAGENT_MODEL ?? getRequiredEnv('FASTAGENT_DEFAULT_MODEL'),
    FASTAGENT_PROVIDER: process.env.FASTAGENT_PROVIDER ?? getRequiredEnv('FASTAGENT_DEFAULT_PROVIDER'),
    IM_GATEWAY_AGENT_ID: agentId,
  };
}

function getRequiredEnv(key: string): string {
  const value = process.env[key];

  if (!value) {
    throw new Error(`Missing required environment variable ${key} for FastAgent contract smoke.`);
  }

  return value;
}
