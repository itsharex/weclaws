import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createDatabaseClient, migrateDatabase } from '../../client.js';

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

function getColumnNames(
  connection: ReturnType<typeof createDatabaseClient>['connection'],
  tableName: string,
): string[] {
  return connection
    .prepare(`PRAGMA table_info(${tableName})`)
    .all()
    .map((row) => {
      const typedRow = row as { name: string };
      return typedRow.name;
    });
}

async function getCurrentMigrationHashes(): Promise<string[]> {
  const migrationsDirectory = fileURLToPath(new URL('../../migrations/', import.meta.url));
  const journalPath = fileURLToPath(new URL('../../migrations/meta/_journal.json', import.meta.url));
  const journal = JSON.parse(await readFile(journalPath, 'utf8')) as {
    entries: Array<{ tag: string }>;
  };

  return Promise.all(
    journal.entries.map(async (entry) => {
      const sqlPath = join(migrationsDirectory, `${entry.tag}.sql`);
      const sql = await readFile(sqlPath, 'utf8');
      return createHash('sha256').update(sql).digest('hex');
    }),
  );
}

function getAppliedMigrationHashes(
  connection: ReturnType<typeof createDatabaseClient>['connection'],
): string[] {
  return connection
    .prepare('SELECT hash FROM __drizzle_migrations ORDER BY created_at ASC')
    .all()
    .map((row) => {
      const typedRow = row as { hash: string };
      return typedRow.hash;
    });
}

describe('database schema contract', () => {
  it('exports the llm profile schema and repository without exposing the legacy single-config repository', async () => {
    const dbExports = await import('../../index.js');

    expect(dbExports).toHaveProperty('UserLlmProfileRepository');
    expect(dbExports).toHaveProperty('userLlmProfiles');
    expect(dbExports).toHaveProperty('UserSandboxRuntimePoolRepository');
    expect(dbExports).toHaveProperty('userSandboxRuntimePools');
    expect(dbExports).not.toHaveProperty('UserLlmConfigRepository');
  });

  it('contains auth tables, invite tables, llm profile binding columns, srt pools, and restart marker columns after migration', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'weixin-claws-db-schema-'));
    tempDirs.push(dir);

    const client = createDatabaseClient({
      url: `file:${join(dir, 'test.sqlite')}`,
    });

    migrateDatabase(client);

    const tables = client.connection
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table'")
      .all()
      .map((row) => {
        const typedRow = row as { name: string };
        return typedRow.name;
      });

    const userColumns = getColumnNames(client.connection, 'users');
    const botInstanceColumns = getColumnNames(client.connection, 'bot_instances');
    const workspaceColumns = getColumnNames(client.connection, 'workspaces');
    const registrationBootstrapClaimColumns = getColumnNames(client.connection, 'registration_bootstrap_claims');
    const registrationInviteColumns = getColumnNames(client.connection, 'registration_invites');
    const userLlmProfileColumns = getColumnNames(client.connection, 'user_llm_profiles');
    const userSandboxRuntimePoolColumns = getColumnNames(client.connection, 'user_sandbox_runtime_pools');

    expect(tables).toEqual(
      expect.arrayContaining(['users', 'workspaces', 'bot_instances', 'bot_events']),
    );
    expect(tables).toEqual(
      expect.arrayContaining([
        'sessions',
        'accounts',
        'verifications',
        'registration_bootstrap_claims',
        'registration_invites',
        'user_llm_profiles',
        'user_sandbox_runtime_pools',
      ]),
    );
    expect(tables).not.toContain('user_llm_configs');
    expect(userColumns).toEqual(
      expect.arrayContaining(['id', 'email', 'name', 'email_verified', 'image']),
    );
    expect(userColumns).not.toContain('password_hash');
    expect(botInstanceColumns).toContain('restart_requested_at');
    expect(botInstanceColumns).toContain('llm_config_id');
    expect(botInstanceColumns).not.toEqual(
      expect.arrayContaining([
        'fastagent_binary_path',
        'data_dir',
        'workspace_dir',
        'log_dir',
      ]),
    );
    expect(workspaceColumns).not.toContain('filesystem_path');
    expect(registrationBootstrapClaimColumns).toEqual(
      expect.arrayContaining(['claim_token', 'claimed_at', 'claimed_by_email']),
    );
    expect(registrationInviteColumns).toEqual(
      expect.arrayContaining(['reservation_token', 'reserved_at', 'reserved_by_email']),
    );
    expect(userLlmProfileColumns).toEqual(
      expect.arrayContaining(['id', 'user_id', 'name', 'provider', 'model', 'api_key', 'base_url', 'api_type']),
    );
    expect(userSandboxRuntimePoolColumns).toEqual(
      expect.arrayContaining([
        'id',
        'owner_user_id',
        'enabled',
        'port',
        'api_key',
        'workspace_base_path',
        'pool_size',
        'min_ready_processes',
        'session_timeout_ms',
        'max_concurrent_init',
        'health_check_interval_ms',
        'port_range_start',
        'port_range_end',
        'restart_requested_at',
      ]),
    );
  });

  it('creates a fresh SQLite database inside a missing storage/sqlite directory and applies the full migration baseline', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'weixin-claws-db-default-sqlite-'));
    tempDirs.push(dir);

    const createdSqlitePath = join(dir, 'storage', 'sqlite', 'db.sqlite');

    const client = createDatabaseClient({
      url: `file:${createdSqlitePath}`,
    });

    const expectedHashes = await getCurrentMigrationHashes();
    expect(() => migrateDatabase(client)).not.toThrow();
    expect(getAppliedMigrationHashes(client.connection)).toEqual(expectedHashes);
  });
});
