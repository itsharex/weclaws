import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import BetterSqlite3 from 'better-sqlite3';
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from './schema/index';

const DEFAULT_DATABASE_URL = 'file:./storage/sqlite/db.sqlite';
const CURRENT_FILE_PATH = fileURLToPath(import.meta.url);
const CURRENT_DIRECTORY = path.dirname(CURRENT_FILE_PATH);
const DEFAULT_MIGRATIONS_FOLDER = path.join(CURRENT_DIRECTORY, 'migrations');

export interface DatabaseClientOptions {
  baseDir?: string;
  url?: string;
}

export interface DatabaseClient {
  connection: BetterSqlite3.Database;
  db: BetterSQLite3Database<typeof schema>;
  url: string;
  close(): void;
}

export function createDatabaseClient(options: DatabaseClientOptions = {}): DatabaseClient {
  const resolvedUrl = resolveSqliteUrl(options.url ?? DEFAULT_DATABASE_URL, options.baseDir);

  if (resolvedUrl !== ':memory:') {
    mkdirSync(path.dirname(resolvedUrl), { recursive: true });
  }

  const connection = new BetterSqlite3(resolvedUrl);
  connection.pragma('foreign_keys = ON');

  const db = drizzle(connection, { schema });

  return {
    connection,
    db,
    url: resolvedUrl,
    close: () => {
      connection.close();
    },
  };
}

export function migrateDatabase(
  client: Pick<DatabaseClient, 'db'>,
  migrationsFolder: string = DEFAULT_MIGRATIONS_FOLDER,
): void {
  migrate(client.db, { migrationsFolder });
}

export function resolveSqliteUrl(input: string, baseDir: string = process.cwd()): string {
  const normalized = input.startsWith('file:') ? input.slice(5) : input;

  if (normalized === ':memory:') {
    return normalized;
  }

  if (path.isAbsolute(normalized)) {
    return normalized;
  }

  return path.resolve(baseDir, normalized);
}
