import type { ChildProcess } from 'node:child_process';

export interface ManagedProcessEntry {
  applyChain: Promise<void>;
  botInstanceId: string;
  child: ChildProcess;
}

export class ProcessRegistry {
  private readonly entries = new Map<string, ManagedProcessEntry>();

  add(entry: ManagedProcessEntry) {
    this.entries.set(entry.botInstanceId, entry);
  }

  delete(botInstanceId: string) {
    this.entries.delete(botInstanceId);
  }

  get(botInstanceId: string) {
    return this.entries.get(botInstanceId) ?? null;
  }

  has(botInstanceId: string) {
    return this.entries.has(botInstanceId);
  }

  values() {
    return [...this.entries.values()];
  }
}
