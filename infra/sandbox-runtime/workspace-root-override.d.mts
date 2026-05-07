export function installWorkspacePathOverride(input: {
  WorkspaceManager: {
    prototype: {
      getWorkspacePath(workspaceId: string, userId: string): string;
    };
  };
  workspaceMapFile: string | null;
}): boolean;

export function resolveWorkspacePathOverride(input: {
  workspaceId: string;
  workspaceMapFile: string | null;
}): Promise<string | null>;

export const VIRTUAL_STATE_ROOT: '/state';
export const VIRTUAL_WORKSPACE_ROOT: '/workspace';

export function installSessionSecurityOverrides(input: {
  ConfigValidationError: new (message: string, errors?: string[]) => Error;
  SandboxProcessPool: {
    prototype: {
      createSession(...args: unknown[]): Promise<unknown>;
      getWorkspaceFilesystemRestrictions(executionContext: unknown): unknown;
      resolveCommandCwd(session: unknown, requestedCwd?: string): Promise<string>;
    };
  };
  workspaceMapFile: string | null;
}): boolean;
