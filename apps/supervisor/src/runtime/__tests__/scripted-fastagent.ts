import { chmod, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

export const RESTORED_ACCOUNT_ID = 'restored_acc_1';

export type ScriptedFastAgentScenario =
  | 'invalid_json'
  | 'missing_qr_url'
  | 'restored_crash'
  | 'restored_happy'
  | 'startup_crash';

export async function createScriptedFastAgentBinary(
  dir: string,
  scenario: ScriptedFastAgentScenario,
) {
  const binaryPath = join(dir, `fastagent-${scenario}.mjs`);

  const source = `#!/usr/bin/env node
const agentId = process.env.IM_GATEWAY_AGENT_ID ?? 'bot_unknown';
const pid = process.pid;
const scenario = ${JSON.stringify(scenario)};
const STEP_DELAY_MS = 10;
let stopping = false;
let keepAliveTimer = null;

function emit(type, message, data) {
  process.stdout.write(JSON.stringify({
    agentId,
    data,
    message,
    pid,
    timestamp: new Date().toISOString(),
    type,
  }) + '\\n');
}

function delay(durationMs) {
  return new Promise((resolve) => setTimeout(resolve, durationMs));
}

async function stopGracefully(reason) {
  if (stopping) {
    return;
  }

  stopping = true;
  emit('stopping', 'IM runtime stopping', { reason });
  await delay(STEP_DELAY_MS);
  emit('stopped', 'IM runtime stopped', {
    exitCode: reason === 'runtime_error' ? 1 : 0,
    reason,
  });

  if (keepAliveTimer) {
    clearInterval(keepAliveTimer);
  }

  process.exit(reason === 'runtime_error' ? 1 : 0);
}

process.on('SIGINT', () => {
  void stopGracefully('signal');
});

process.on('SIGTERM', () => {
  void stopGracefully('signal');
});

async function main() {
  emit('process_started', 'IM runtime process started', {
    channel: 'weixin',
  });
  await delay(STEP_DELAY_MS);

  if (scenario === 'startup_crash') {
    await delay(STEP_DELAY_MS);
    emit('runtime_error', 'IM runtime failed', {
      error: 'Sandbox session crashed before steady state',
    });
    await delay(STEP_DELAY_MS);
    await stopGracefully('runtime_error');
    return;
  }

  if (scenario === 'invalid_json') {
    await delay(STEP_DELAY_MS);
    process.stdout.write('this is not valid jsonl\\n');
    keepAliveTimer = setInterval(() => {
      // Wait for the supervisor to terminate the runtime after invalid output.
    }, 60_000);
    return;
  }

  if (scenario === 'missing_qr_url') {
    await delay(STEP_DELAY_MS);
    emit('qr_code', 'IM runtime emitted an incomplete QR payload', {});
    keepAliveTimer = setInterval(() => {
      // Wait for the supervisor to terminate the runtime after the malformed event.
    }, 60_000);
    return;
  }

  emit('running', 'IM runtime entered steady state', {
    accountId: ${JSON.stringify(RESTORED_ACCOUNT_ID)},
    source: 'restored',
  });

  if (scenario === 'restored_crash') {
    await delay(STEP_DELAY_MS);
    emit('runtime_error', 'IM runtime failed', {
      error: 'Sandbox session crashed unexpectedly',
    });
    await delay(STEP_DELAY_MS);
    await stopGracefully('runtime_error');
    return;
  }

  keepAliveTimer = setInterval(() => {
    // Keep the scripted runtime alive until it receives a stop signal.
  }, 60_000);
}

void main().catch(async (error) => {
  emit('runtime_error', 'IM runtime failed', {
    error: error instanceof Error ? error.message : String(error),
  });
  await stopGracefully('runtime_error');
});
`;

  await writeFile(binaryPath, source);
  await chmod(binaryPath, 0o755);

  return binaryPath;
}
