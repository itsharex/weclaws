import { eq } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { workspaces } from '../schema/workspaces';
import type * as schema from '../schema/index';

type Db = BetterSQLite3Database<typeof schema>;

export interface CreateWorkspaceInput {
  id: string;
  ownerUserId: string;
  name: string;
}

export class WorkspaceRepository {
  constructor(private readonly db: Db) {}

  async create(input: CreateWorkspaceInput) {
    const now = new Date();

    this.db.insert(workspaces).values({
      ...input,
      createdAt: now,
      updatedAt: now,
    }).run();

    return this.findById(input.id);
  }

  async findById(id: string) {
    const row = this.db.select().from(workspaces).where(eq(workspaces.id, id)).get();
    return row ?? null;
  }

  async deleteById(id: string) {
    const result = this.db.delete(workspaces).where(eq(workspaces.id, id)).run();
    return result.changes > 0;
  }
}
