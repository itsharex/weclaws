import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  UserRepository,
  UserSandboxRuntimePoolRepository,
  createDatabaseClient,
  migrateDatabase,
} from '@weclaws/db';
import { parseSandboxRuntimePoolDefaults } from '@weclaws/shared';
import { afterEach, describe, expect, it } from 'vitest';
import {
  ensureUserSandboxRuntimePool,
  renderAllSandboxRuntimePools,
} from '../srt-pool-provisioning';

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe('srt-pool-provisioning', () => {
  it('ensures a pool and renders all DB rows to the private config file', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'weixin-claws-srt-provisioning-'));
    tempDirs.push(dir);

    const client = createDatabaseClient({
      url: `file:${join(dir, 'test.sqlite')}`,
    });
    migrateDatabase(client);

    const users = new UserRepository(client.db);
    const pools = new UserSandboxRuntimePoolRepository(client.db);
    await users.create({
      email: 'owner@example.com',
      id: 'user_1',
      name: 'owner',
    });

    await ensureUserSandboxRuntimePool({
      defaults: parseSandboxRuntimePoolDefaults({}),
      ownerUserId: 'user_1',
      repository: pools,
    });
    await renderAllSandboxRuntimePools({
      filePath: join(dir, 'private', 'srt-pools.json'),
      now: new Date('2026-05-02T00:00:00.000Z'),
      repository: pools,
      serviceHost: 'sandbox-runtime',
      workspaceMapDir: join(dir, 'private', 'workspace-map'),
    });

    const document = JSON.parse(await readFile(join(dir, 'private', 'srt-pools.json'), 'utf8')) as {
      pools: Array<{ ownerUserId: string; url: string }>;
    };

    expect(document.pools).toHaveLength(1);
    expect(document.pools[0]).toMatchObject({
      ownerUserId: 'user_1',
      url: 'http://sandbox-runtime:31000',
    });
  });
});
