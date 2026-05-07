export class InstanceLock {
  private readonly lockedInstanceIds = new Set<string>();

  async withLock<T>(botInstanceId: string, task: () => Promise<T>): Promise<T | null> {
    if (this.lockedInstanceIds.has(botInstanceId)) {
      return null;
    }

    this.lockedInstanceIds.add(botInstanceId);

    try {
      return await task();
    } finally {
      this.lockedInstanceIds.delete(botInstanceId);
    }
  }
}
