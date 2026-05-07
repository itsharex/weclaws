import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';
import { getWorkspaceRoot } from './env';

const supervisorPackageSchema = z.object({
  dependencies: z.object({
    '@fastagent/cli': z.string().trim().min(1).optional(),
  }).optional(),
});

let fastAgentCliVersionPromise: Promise<string | null> | null = null;

export function getFastAgentCliVersion(): Promise<string | null> {
  if (!fastAgentCliVersionPromise) {
    fastAgentCliVersionPromise = readFastAgentCliVersion();
  }

  return fastAgentCliVersionPromise;
}

async function readFastAgentCliVersion(): Promise<string | null> {
  try {
    const supervisorPackagePath = path.join(getWorkspaceRoot(), 'apps', 'supervisor', 'package.json');
    const source = await readFile(supervisorPackagePath, 'utf8');
    const parsed = supervisorPackageSchema.parse(JSON.parse(source));
    return parsed.dependencies?.['@fastagent/cli'] ?? null;
  } catch {
    return null;
  }
}
