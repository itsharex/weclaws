import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'drizzle-kit';

const REPO_ROOT = fileURLToPath(new URL('../..', import.meta.url));
const DEFAULT_DATABASE_URL = 'file:./storage/sqlite/db.sqlite';

function resolveSqliteUrl(url: string): string {
  const normalized = url.startsWith('file:') ? url.slice(5) : url;

  if (normalized === ':memory:') {
    return normalized;
  }

  if (path.isAbsolute(normalized)) {
    return normalized;
  }

  return path.resolve(REPO_ROOT, normalized);
}

export default defineConfig({
  dialect: 'sqlite',
  schema: './src/schema/index.ts',
  out: './src/migrations',
  dbCredentials: {
    url: resolveSqliteUrl(process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL),
  },
});
