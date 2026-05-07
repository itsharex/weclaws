import { createHash } from 'node:crypto';
import { mkdir, readFile, realpath, rename, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const SANDBOX_WORKSPACE_MAP_VERSION = 1;

interface SandboxWorkspaceMapEntry {
  updatedAt: string;
  workspacePath: string;
}

interface SandboxWorkspaceMapDocument {
  updatedAt: string;
  version: number;
  workspaces: Record<string, SandboxWorkspaceMapEntry>;
}

interface RegisterSandboxWorkspaceInput {
  workspaceMapFile: string;
  workspacePath: string;
}

export async function createFastAgentWorkspaceId(workspacePath: string): Promise<string> {
  const canonicalWorkspacePath = await resolveWorkspacePath(workspacePath);
  return `ws_${createHash('sha1').update(canonicalWorkspacePath).digest('hex').slice(0, 16)}`;
}

export async function registerSandboxWorkspace(input: RegisterSandboxWorkspaceInput): Promise<string> {
  const canonicalWorkspacePath = await resolveWorkspacePath(input.workspacePath);
  const workspaceId = await createFastAgentWorkspaceId(canonicalWorkspacePath);
  const document = await readSandboxWorkspaceMap(input.workspaceMapFile);
  const updatedAt = new Date().toISOString();

  document.version = SANDBOX_WORKSPACE_MAP_VERSION;
  document.updatedAt = updatedAt;
  document.workspaces[workspaceId] = {
    workspacePath: canonicalWorkspacePath,
    updatedAt,
  };

  await writeSandboxWorkspaceMap(input.workspaceMapFile, document);

  return workspaceId;
}

async function readSandboxWorkspaceMap(workspaceMapFile: string): Promise<SandboxWorkspaceMapDocument> {
  try {
    const rawDocument = await readFile(workspaceMapFile, 'utf8');
    return parseSandboxWorkspaceMap(rawDocument);
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;

    if (nodeError.code === 'ENOENT') {
      return createEmptyWorkspaceMapDocument();
    }

    throw error;
  }
}

function parseSandboxWorkspaceMap(rawDocument: string): SandboxWorkspaceMapDocument {
  const fallbackDocument = createEmptyWorkspaceMapDocument();
  const parsedDocument = JSON.parse(rawDocument) as unknown;

  if (!isRecord(parsedDocument)) {
    return fallbackDocument;
  }

  const workspaces = isRecord(parsedDocument.workspaces)
    ? Object.fromEntries(
      Object.entries(parsedDocument.workspaces)
        .filter(([, entry]) => isRecord(entry) && typeof entry.workspacePath === 'string')
        .map(([workspaceId, entry]) => {
          const workspaceEntry = entry as {
            updatedAt?: unknown;
            workspacePath: string;
          };

          return [
            workspaceId,
            {
              workspacePath: resolve(workspaceEntry.workspacePath),
              updatedAt: typeof workspaceEntry.updatedAt === 'string'
                ? workspaceEntry.updatedAt
                : fallbackDocument.updatedAt,
            } satisfies SandboxWorkspaceMapEntry,
          ];
        }),
    )
    : {};

  return {
    version: SANDBOX_WORKSPACE_MAP_VERSION,
    updatedAt: typeof parsedDocument.updatedAt === 'string'
      ? parsedDocument.updatedAt
      : fallbackDocument.updatedAt,
    workspaces,
  };
}

async function writeSandboxWorkspaceMap(
  workspaceMapFile: string,
  document: SandboxWorkspaceMapDocument,
) {
  await mkdir(dirname(workspaceMapFile), { recursive: true });

  const tempFile = `${workspaceMapFile}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(tempFile, `${JSON.stringify(document, null, 2)}\n`, 'utf8');
  await rename(tempFile, workspaceMapFile);
}

function createEmptyWorkspaceMapDocument(): SandboxWorkspaceMapDocument {
  return {
    version: SANDBOX_WORKSPACE_MAP_VERSION,
    updatedAt: new Date(0).toISOString(),
    workspaces: {},
  };
}

async function resolveWorkspacePath(workspacePath: string): Promise<string> {
  try {
    return await realpath(workspacePath);
  } catch {
    return resolve(workspacePath);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
