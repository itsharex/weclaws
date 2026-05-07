import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { UserSandboxRuntimePoolRecord } from '@weclaws/db';
import { ApiError } from '../api-error';
import {
  listAdminSandboxRuntimePools,
  requestAdminSandboxRuntimePoolRestart,
  updateAdminSandboxRuntimePool,
} from '../sandbox-runtime-admin';

const tempDirs: string[] = [];

const userSandboxRuntimePools = {
  findByOwnerUserId: vi.fn(),
  listAll: vi.fn(),
  requestRestart: vi.fn(),
  updateByOwnerUserId: vi.fn(),
};
const users = {
  findById: vi.fn(),
};
const repositories = {
  userSandboxRuntimePools,
  users,
};

beforeEach(() => {
  vi.clearAllMocks();
  userSandboxRuntimePools.findByOwnerUserId.mockReset();
  userSandboxRuntimePools.listAll.mockReset();
  userSandboxRuntimePools.requestRestart.mockReset();
  userSandboxRuntimePools.updateByOwnerUserId.mockReset();
  users.findById.mockReset();
});

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { force: true, recursive: true })));
});

describe('sandbox-runtime admin service', () => {
  it('lists configured pools with owner emails, runtime status, and no API key material', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'weclaws-srt-admin-status-'));
    tempDirs.push(dir);
    const statusFilePath = join(dir, 'srt-pool-status.json');
    await writeFile(statusFilePath, JSON.stringify({
      manager: {
        cpuPercent: 2.5,
        managedPoolCount: 1,
        pid: 123,
        rssBytes: 128_000_000,
        runningPoolCount: 1,
        state: 'running',
        totalPoolSize: 3,
        uptimeMs: 25_000,
      },
      pools: [
        {
          cpuPercent: 12.5,
          ownerUserId: 'user_1',
          pid: 456,
          readyProcesses: null,
          rssBytes: 256_000_000,
          state: 'running',
          url: 'http://sandbox-runtime:31000',
        },
      ],
      updatedAt: '2026-05-02T02:00:00.000Z',
      version: 1,
    }));

    userSandboxRuntimePools.listAll.mockResolvedValue([createPoolRecord()]);
    users.findById.mockResolvedValue({
      email: 'owner@example.com',
      id: 'user_1',
    });

    const result = await listAdminSandboxRuntimePools({
      repositories,
      statusFilePath,
    });

    expect(result.manager?.state).toBe('running');
    expect(result.pools).toEqual([
      expect.objectContaining({
        apiKeyConfigured: true,
        ownerEmail: 'owner@example.com',
        ownerUserId: 'user_1',
        runtime: expect.objectContaining({
          cpuPercent: 12.5,
          pid: 456,
          rssBytes: 256_000_000,
          state: 'running',
        }),
      }),
    ]);
    expect(result.pools[0]).not.toHaveProperty('apiKey');
  });

  it('tolerates a missing runtime status file while still returning configured pools', async () => {
    userSandboxRuntimePools.listAll.mockResolvedValue([createPoolRecord()]);
    users.findById.mockResolvedValue(null);

    const result = await listAdminSandboxRuntimePools({
      repositories,
      statusFilePath: join(tmpdir(), 'missing-weclaws-srt-status.json'),
    });

    expect(result.manager).toBeNull();
    expect(result.pools[0]).toEqual(expect.objectContaining({
      ownerEmail: null,
      runtime: null,
    }));
  });

  it('rejects patch payloads that try to write API key material', async () => {
    await expect(updateAdminSandboxRuntimePool({
      ownerUserId: 'user_1',
      payload: {
        apiKey: 'secret',
      },
      repositories,
    })).rejects.toMatchObject({
      code: 'SRT_POOL_INVALID_CONFIG',
      status: 400,
    });
    expect(userSandboxRuntimePools.updateByOwnerUserId).not.toHaveBeenCalled();
  });

  it('sanitizes fatal linux deny paths before returning or persisting pool config', async () => {
    userSandboxRuntimePools.listAll.mockResolvedValue([createPoolRecord({
      defaultDenyRead: ['/etc/passwd', '/etc/mtab', '/proc/mounts'],
    })]);
    users.findById.mockResolvedValue(null);
    userSandboxRuntimePools.updateByOwnerUserId.mockResolvedValue(createPoolRecord({
      defaultDenyRead: ['/etc/passwd', '/proc/mounts'],
    }));

    const listResult = await listAdminSandboxRuntimePools({
      repositories,
      statusFilePath: join(tmpdir(), 'missing-weclaws-srt-status.json'),
    });
    expect(listResult.pools[0].defaultDenyRead).toEqual([
      '/etc/passwd',
      '/proc/mounts',
    ]);

    await updateAdminSandboxRuntimePool({
      ownerUserId: 'user_1',
      payload: {
        defaultDenyRead: ['/etc/passwd', '/etc/mtab', '/proc/mounts'],
      },
      repositories,
    });

    expect(userSandboxRuntimePools.updateByOwnerUserId).toHaveBeenCalledWith('user_1', {
      defaultDenyRead: ['/etc/passwd', '/proc/mounts'],
    });
  });

  it('maps repository validation failures to stable SRT admin error codes', async () => {
    userSandboxRuntimePools.updateByOwnerUserId.mockRejectedValue(
      new Error('SRT pool proxy port range overlaps another pool.'),
    );

    await expect(updateAdminSandboxRuntimePool({
      ownerUserId: 'user_1',
      payload: {
        portRangeEnd: 9_199,
        portRangeStart: 9_100,
      },
      repositories,
    })).rejects.toMatchObject({
      code: 'SRT_POOL_PORT_RANGE_CONFLICT',
      status: 409,
    });
  });

  it('rejects updates that try to change workspaceBasePath directly', async () => {
    await expect(updateAdminSandboxRuntimePool({
      ownerUserId: 'user_1',
      payload: {
        workspaceBasePath: '/tmp/other-user',
      },
      repositories,
    })).rejects.toMatchObject({
      code: 'SRT_POOL_INVALID_CONFIG',
      status: 400,
    });

    expect(userSandboxRuntimePools.updateByOwnerUserId).not.toHaveBeenCalled();
  });

  it('rejects updates when minReadyProcesses exceeds poolSize', async () => {
    await expect(updateAdminSandboxRuntimePool({
      ownerUserId: 'user_1',
      payload: {
        minReadyProcesses: 4,
        poolSize: 3,
      },
      repositories,
    })).rejects.toMatchObject({
      code: 'SRT_POOL_INVALID_CONFIG',
      status: 400,
    });

    expect(userSandboxRuntimePools.updateByOwnerUserId).not.toHaveBeenCalled();
  });

  it('rejects updates when portRangeStart is greater than portRangeEnd', async () => {
    await expect(updateAdminSandboxRuntimePool({
      ownerUserId: 'user_1',
      payload: {
        portRangeEnd: 9_100,
        portRangeStart: 9_199,
      },
      repositories,
    })).rejects.toMatchObject({
      code: 'SRT_POOL_INVALID_CONFIG',
      status: 400,
    });

    expect(userSandboxRuntimePools.updateByOwnerUserId).not.toHaveBeenCalled();
  });

  it('maps child port collisions to stable SRT admin error codes', async () => {
    userSandboxRuntimePools.updateByOwnerUserId.mockRejectedValue(
      new Error('SRT pool port is already used by another pool.'),
    );

    await expect(updateAdminSandboxRuntimePool({
      ownerUserId: 'user_1',
      payload: {
        port: 31_001,
      },
      repositories,
    })).rejects.toMatchObject({
      code: 'SRT_POOL_PORT_CONFLICT',
      status: 409,
    });
  });

  it('requests a pool restart through the repository', async () => {
    userSandboxRuntimePools.requestRestart.mockResolvedValue(createPoolRecord({
      restartRequestedAt: new Date('2026-05-02T03:00:00.000Z'),
    }));

    const result = await requestAdminSandboxRuntimePoolRestart({
      ownerUserId: 'user_1',
      repositories,
    });

    expect(userSandboxRuntimePools.requestRestart).toHaveBeenCalledWith('user_1', expect.any(Date));
    expect(result.restartRequestedAt).toBe('2026-05-02T03:00:00.000Z');
  });

  it('returns not found when a restart targets an unknown pool', async () => {
    userSandboxRuntimePools.requestRestart.mockResolvedValue(null);

    await expect(requestAdminSandboxRuntimePoolRestart({
      ownerUserId: 'missing_user',
      repositories,
    })).rejects.toEqual(new ApiError({
      code: 'SRT_POOL_NOT_FOUND',
      message: 'Sandbox runtime pool not found.',
      status: 404,
    }));
  });
});

function createPoolRecord(overrides: Partial<UserSandboxRuntimePoolRecord> = {}): UserSandboxRuntimePoolRecord {
  return {
    ...createBasePoolRecord(),
    ...overrides,
  };
}

function createBasePoolRecord(): UserSandboxRuntimePoolRecord {
  return {
    apiKey: 'secret',
    createdAt: new Date('2026-05-02T01:00:00.000Z'),
    defaultAllowRead: [],
    defaultAllowWrite: ['/tmp'],
    defaultDeniedDomains: [],
    defaultDenyRead: ['/etc/passwd'],
    defaultDenyWrite: ['.env'],
    enabled: true,
    healthCheckIntervalMs: 60_000,
    id: 'pool_1',
    maxConcurrentInit: 1,
    minReadyProcesses: 1,
    ownerUserId: 'user_1',
    poolSize: 3,
    port: 31_000,
    portRangeEnd: 9_199,
    portRangeStart: 9_100,
    restartRequestedAt: null,
    sessionTimeoutMs: 600_000,
    updatedAt: new Date('2026-05-02T01:10:00.000Z'),
    workspaceBasePath: '/app/apps/sandbox-runtime/user-workspaces/user_1',
  };
}
