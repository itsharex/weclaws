import { integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { users } from './users';

export const userSandboxRuntimePools = sqliteTable(
  'user_sandbox_runtime_pools',
  {
    id: text('id').primaryKey(),
    ownerUserId: text('owner_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    enabled: integer('enabled', { mode: 'boolean' }).notNull().default(true),
    port: integer('port').notNull(),
    apiKey: text('api_key').notNull(),
    workspaceBasePath: text('workspace_base_path').notNull(),
    poolSize: integer('pool_size').notNull(),
    minReadyProcesses: integer('min_ready_processes').notNull(),
    sessionTimeoutMs: integer('session_timeout_ms').notNull(),
    maxConcurrentInit: integer('max_concurrent_init').notNull(),
    healthCheckIntervalMs: integer('health_check_interval_ms').notNull(),
    portRangeStart: integer('port_range_start').notNull(),
    portRangeEnd: integer('port_range_end').notNull(),
    defaultDeniedDomainsJson: text('default_denied_domains_json').notNull(),
    defaultAllowReadJson: text('default_allow_read_json').notNull(),
    defaultAllowWriteJson: text('default_allow_write_json').notNull(),
    defaultDenyReadJson: text('default_deny_read_json').notNull(),
    defaultDenyWriteJson: text('default_deny_write_json').notNull(),
    restartRequestedAt: integer('restart_requested_at', { mode: 'timestamp_ms' }),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => ({
    apiKeyIndex: uniqueIndex('user_srt_pools_api_key_idx').on(table.apiKey),
    ownerUserIndex: uniqueIndex('user_srt_pools_owner_user_idx').on(table.ownerUserId),
    portIndex: uniqueIndex('user_srt_pools_port_idx').on(table.port),
  }),
);
