import path from 'node:path';

export const DEFAULT_INSTANCES_ROOT_RELATIVE_PATH = './storage/instances';

export interface BotInstancePaths {
  botRoot: string;
  dataDir: string;
  workspaceDir: string;
  logDir: string;
}

export function resolveInstancesRootPath(
  workspaceRoot: string,
  instancesRoot: string = DEFAULT_INSTANCES_ROOT_RELATIVE_PATH,
) {
  return path.resolve(workspaceRoot, instancesRoot);
}

export function resolveBotInstancePaths(instancesRoot: string, botInstanceId: string): BotInstancePaths {
  const botRoot = path.join(instancesRoot, botInstanceId);

  return {
    botRoot,
    dataDir: path.join(botRoot, 'data'),
    workspaceDir: path.join(botRoot, 'workspace'),
    logDir: path.join(botRoot, 'logs'),
  };
}
