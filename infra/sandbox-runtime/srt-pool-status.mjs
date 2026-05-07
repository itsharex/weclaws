import { mkdir, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

export const SRT_POOL_STATUS_FILE_VERSION = 1;

export async function writeStatusFile(statusFilePath, status) {
  await mkdir(dirname(statusFilePath), { recursive: true });
  const tempFile = `${statusFilePath}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(tempFile, `${JSON.stringify(status, null, 2)}\n`, 'utf8');
  await rename(tempFile, statusFilePath);
}

export function createStatusDocument({ children, lastErrorMessage, now, pools }) {
  const poolStatuses = pools.map((pool) => {
    const child = children.get(pool.ownerUserId);
    const running = child && child.child.exitCode === null && !child.child.killed;

    return {
      activeSessions: null,
      busyProcesses: null,
      cpuPercent: child?.resourceUsage?.cpuPercent ?? null,
      lastErrorMessage: child?.lastErrorMessage ?? null,
      lastExitCode: child?.lastExitCode ?? null,
      lastHealthAt: child?.lastHealthAt ?? null,
      lastRestartAt: child?.lastRestartAt ?? null,
      ownerUserId: pool.ownerUserId,
      pid: running ? child.child.pid ?? null : null,
      poolSize: pool.poolSize,
      portRangeEnd: pool.portRangeEnd,
      portRangeStart: pool.portRangeStart,
      readyProcesses: null,
      rssBytes: child?.resourceUsage?.rssBytes ?? null,
      startedAt: running ? child.startedAt : null,
      state: running ? 'running' : pool.enabled ? 'stopped' : 'stopped',
      url: pool.url,
    };
  });
  const runningPoolCount = poolStatuses.filter((pool) => pool.state === 'running').length;

  return {
    manager: {
      cpuPercent: null,
      degradedPoolCount: 0,
      failedPoolCount: 0,
      lastErrorMessage,
      lastReconcileAt: now,
      managedPoolCount: pools.length,
      pid: process.pid,
      rssBytes: process.memoryUsage().rss,
      runningPoolCount,
      state: 'running',
      totalActiveSessions: null,
      totalPoolSize: pools.reduce((sum, pool) => sum + pool.poolSize, 0),
      uptimeMs: Math.round(process.uptime() * 1000),
    },
    pools: poolStatuses,
    updatedAt: now,
    version: SRT_POOL_STATUS_FILE_VERSION,
  };
}
