import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SUPERVISOR_PACKAGE_ROOT = findSupervisorPackageRoot(
  path.dirname(fileURLToPath(import.meta.url)),
);
const REPO_LOCAL_FASTAGENT_BINARY_RELATIVE_PATH = path.join('node_modules', '.bin', 'fastagent');

export interface FastAgentBinaryResolutionOptions {
  packageRoot?: string;
}

export function resolveFastAgentBinaryPath(
  env: NodeJS.ProcessEnv = process.env,
  options: FastAgentBinaryResolutionOptions = {},
) {
  const configuredBinaryPath = env.FASTAGENT_BINARY_PATH;

  if (configuredBinaryPath) {
    return configuredBinaryPath;
  }

  const repoLocalBinaryPath = path.join(
    options.packageRoot ?? SUPERVISOR_PACKAGE_ROOT,
    REPO_LOCAL_FASTAGENT_BINARY_RELATIVE_PATH,
  );

  if (existsSync(repoLocalBinaryPath)) {
    return repoLocalBinaryPath;
  }

  return null;
}

export function getFastAgentBinaryPathOrThrow(
  env: NodeJS.ProcessEnv = process.env,
  options: FastAgentBinaryResolutionOptions = {},
) {
  const binaryPath = resolveFastAgentBinaryPath(env, options);

  if (binaryPath) {
    return binaryPath;
  }

  throw new Error(
    'Unable to locate FastAgent CLI binary. Install @fastagent/cli in apps/supervisor or set FASTAGENT_BINARY_PATH.',
  );
}

function findSupervisorPackageRoot(startDirectory: string): string {
  let currentDirectory = path.resolve(startDirectory);

  while (true) {
    if (
      path.basename(currentDirectory) === 'supervisor'
      && existsSync(path.join(currentDirectory, 'package.json'))
    ) {
      return currentDirectory;
    }

    const parentDirectory = path.dirname(currentDirectory);

    if (parentDirectory === currentDirectory) {
      throw new Error('Unable to locate supervisor package root.');
    }

    currentDirectory = parentDirectory;
  }
}
