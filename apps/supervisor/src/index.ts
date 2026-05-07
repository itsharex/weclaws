import {
  BotEventRepository,
  BotInstanceRepository,
  UserLlmProfileRepository,
  UserSandboxRuntimePoolRepository,
  createDatabaseClient,
  migrateDatabase,
} from '@weclaws/db';
import type { SupervisorConfig } from './config';
import { getSupervisorConfig } from './config';
import { InstanceLock } from './runtime/instance-lock';
import { InstanceReconciler } from './runtime/instance-reconciler';
import { ProcessManager } from './runtime/process-manager';
import { renderAllSandboxRuntimePools } from './runtime/srt-pool-provisioning';
import {
  resolveSupervisorSingletonLockPath,
  SupervisorSingletonLock,
} from './runtime/supervisor-singleton-lock';

export interface SupervisorRuntime {
  close(): Promise<void>;
}

type ShutdownSignal = 'SIGINT' | 'SIGTERM';

export interface RunSupervisorProcessOptions {
  exit?: (exitCode: number) => void;
  logError?: (error: unknown) => void;
  registerSignal?: (signal: ShutdownSignal, handler: () => void) => void;
  start?: () => Promise<SupervisorRuntime>;
}

export function scheduleReconcilePass(
  reconciler: Pick<InstanceReconciler, 'runOnce'>,
  onError: (error: unknown) => void = console.error,
) {
  void reconciler.runOnce().catch(onError);
}

export async function startSupervisor(): Promise<SupervisorRuntime> {
  const config = getSupervisorConfig();
  const singletonLock = new SupervisorSingletonLock(
    resolveSupervisorSingletonLockPath(config.workspaceRoot),
  );
  await singletonLock.acquire();

  let interval: ReturnType<typeof setInterval> | null = null;
  let client: ReturnType<typeof createDatabaseClient> | null = null;

  try {
    client = createDatabaseClient({
      baseDir: config.workspaceRoot,
      url: config.databaseUrl,
    });

    migrateDatabase(client);

    const botInstances = new BotInstanceRepository(client.db);
    const botEvents = new BotEventRepository(client.db);
    const userLlmProfiles = new UserLlmProfileRepository(client.db);
    const userSandboxRuntimePools = new UserSandboxRuntimePoolRepository(client.db);
    const processManager = new ProcessManager({
      botEvents,
      botInstances,
      config,
      userLlmProfiles,
      userSandboxRuntimePools,
    });
    const reconciler = new InstanceReconciler({
      botInstances,
      lock: new InstanceLock(),
      processManager,
    });
    const logReconcileError = (error: unknown) => {
      console.error('Supervisor reconcile pass failed.');
      console.error(error);
    };

    await renderSandboxRuntimePoolsIfEnabled(config, userSandboxRuntimePools);
    await reconciler.runOnce();

    interval = setInterval(() => {
      void renderSandboxRuntimePoolsIfEnabled(config, userSandboxRuntimePools)
        .then(() => {
          scheduleReconcilePass(reconciler, logReconcileError);
        })
        .catch(logReconcileError);
    }, config.reconcileIntervalMs);

    let closed = false;

    return {
      close: async () => {
        if (closed) {
          return;
        }

        closed = true;

        if (interval) {
          clearInterval(interval);
          interval = null;
        }

        try {
          await processManager.dispose();
        } finally {
          try {
            client?.close();
          } finally {
            await singletonLock.release();
          }
        }
      },
    };
  } catch (error) {
    if (interval) {
      clearInterval(interval);
    }

    try {
      client?.close();
    } finally {
      await singletonLock.release();
    }
    throw error;
  }
}

async function renderSandboxRuntimePoolsIfEnabled(
  config: SupervisorConfig,
  repository: UserSandboxRuntimePoolRepository,
): Promise<void> {
  if (
    config.sandboxMode !== 'remote'
    || !config.srtPoolConfigFile
    || !config.srtServiceHost
    || !config.srtWorkspaceMapDir
  ) {
    return;
  }

  await renderAllSandboxRuntimePools({
    filePath: config.srtPoolConfigFile,
    repository,
    serviceHost: config.srtServiceHost,
    workspaceMapDir: config.srtWorkspaceMapDir,
  });
}

export function runSupervisorProcess(options: RunSupervisorProcessOptions = {}) {
  const start = options.start ?? startSupervisor;
  const exit = options.exit ?? ((exitCode) => {
    process.exit(exitCode);
  });
  const logError = options.logError ?? console.error;
  const registerSignal = options.registerSignal ?? ((signal, handler) => {
    process.on(signal, handler);
  });

  let runtime: SupervisorRuntime | null = null;
  let resolveStartupSettled!: () => void;
  const startupSettled = new Promise<void>((resolve) => {
    resolveStartupSettled = resolve;
  });
  let shutdownPromise: Promise<void> | null = null;

  const shutdown = async (exitCode: number) => {
    if (shutdownPromise) {
      return shutdownPromise;
    }

    shutdownPromise = (async () => {
      try {
        await startupSettled;

        if (runtime) {
          await runtime.close();
        }
      } finally {
        exit(exitCode);
      }
    })();

    return shutdownPromise;
  };

  registerSignal('SIGINT', () => {
    void shutdown(0);
  });
  registerSignal('SIGTERM', () => {
    void shutdown(0);
  });

  void Promise.resolve()
    .then(() => start())
    .then((nextRuntime) => {
      runtime = nextRuntime;
    })
    .catch((error: unknown) => {
      logError(error);
      void shutdown(1);
    })
    .finally(() => {
      resolveStartupSettled();
    });
}

if (import.meta.url === new URL(process.argv[1], 'file:').href) {
  runSupervisorProcess();
}
