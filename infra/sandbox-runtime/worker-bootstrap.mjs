import { resolve, sep } from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const WORKER_BOOTSTRAP_PATCH_MARKER = Symbol.for(
  'weclaws.sandbox-runtime.worker-bootstrap.writable-rebind',
);
const LINUX_MTAB_DENY_TARGET = '/etc/mtab';

await installLinuxWritableRebindBootstrap();

export function collectWritablePathsNeedingRebind(filesystem = {}) {
  const allowWrite = Array.isArray(filesystem.allowWrite) ? filesystem.allowWrite : [];
  const denyRead = Array.isArray(filesystem.denyRead) ? filesystem.denyRead : [];
  const denyReadRoots = uniquePaths(
    denyRead
      .map(stripRecursiveGlobSuffix)
      .filter((pattern) => pattern.length > 0 && !containsGlobChars(pattern))
      .map((pattern) => resolve(pattern)),
  );

  return uniquePaths(
    allowWrite
      .map((path) => resolve(path))
      .filter((path) => denyReadRoots.some((denyRoot) => isSameOrDescendant(path, denyRoot))),
  );
}

export function injectWritableRebindArgs(args, writablePaths) {
  if (!Array.isArray(args) || args.length === 0 || writablePaths.length === 0) {
    return Array.isArray(args) ? [...args] : [];
  }

  const sanitizedArgs = stripFatalLinuxReadDenyArgs(args);
  const separatorIndex = sanitizedArgs.indexOf('--');

  if (separatorIndex === -1) {
    return sanitizedArgs;
  }

  const insertionIndex = findWritableRebindInsertionIndex(sanitizedArgs, separatorIndex);

  return [
    ...sanitizedArgs.slice(0, insertionIndex),
    ...writablePaths.flatMap((path) => ['--bind', path, path]),
    ...sanitizedArgs.slice(insertionIndex),
  ];
}

export function stripFatalLinuxReadDenyArgs(args) {
  if (!Array.isArray(args) || args.length === 0) {
    return [];
  }

  const sanitizedArgs = [];

  for (let index = 0; index < args.length; index += 1) {
    const token = args[index];
    const nextToken = args[index + 1];
    const thirdToken = args[index + 2];

    if ((token === '--ro-bind' || token === '--bind') && nextToken === '/dev/null' && thirdToken === LINUX_MTAB_DENY_TARGET) {
      index += 2;
      continue;
    }

    sanitizedArgs.push(token);
  }

  return sanitizedArgs;
}

export async function installLinuxWritableRebindBootstrap({
  runtimePackageRoot = process.env.WECLAWS_SANDBOX_RUNTIME_PACKAGE_ROOT
    ?? process.env.FASTAGENT_SANDBOX_RUNTIME_PACKAGE_ROOT
    ?? null,
} = {}) {
  if (process.platform !== 'linux' || !runtimePackageRoot) {
    return false;
  }

  const runtimeRequire = createRequire(pathToFileURL(resolve(runtimePackageRoot, 'package.json')));
  const sandboxManagerModulePath = runtimeRequire.resolve(
    '@anthropic-ai/sandbox-runtime/dist/sandbox/sandbox-manager.js',
  );
  const shellQuoteModulePath = runtimeRequire.resolve('shell-quote');
  const [
    { SandboxManager },
    { default: shellquote },
  ] = await Promise.all([
    import(pathToFileURL(sandboxManagerModulePath).href),
    import(pathToFileURL(shellQuoteModulePath).href),
  ]);

  if (!SandboxManager || SandboxManager[WORKER_BOOTSTRAP_PATCH_MARKER]) {
    return false;
  }

  const originalWrapWithSandbox = SandboxManager.wrapWithSandbox.bind(SandboxManager);

  SandboxManager.wrapWithSandbox = async function patchedWrapWithSandbox(
    command,
    binShell,
    customConfig,
    abortSignal,
  ) {
    const wrappedCommand = await originalWrapWithSandbox(command, binShell, customConfig, abortSignal);
    const filesystem = customConfig?.filesystem ?? SandboxManager.getConfig?.()?.filesystem ?? {};
    const writablePaths = collectWritablePathsNeedingRebind(filesystem);

    if (writablePaths.length === 0) {
      return wrappedCommand;
    }

    const parsedArgs = shellquote.parse(wrappedCommand).map((token) => String(token));
    const rewrittenArgs = injectWritableRebindArgs(parsedArgs, writablePaths);

    if (rewrittenArgs.length === parsedArgs.length) {
      return wrappedCommand;
    }

    return shellquote.quote(rewrittenArgs);
  };

  Object.defineProperty(SandboxManager, WORKER_BOOTSTRAP_PATCH_MARKER, {
    configurable: false,
    enumerable: false,
    value: true,
    writable: false,
  });

  return true;
}

function containsGlobChars(pathPattern) {
  return /[*?[\]]/.test(pathPattern);
}

function stripRecursiveGlobSuffix(pathPattern) {
  return pathPattern.replace(/\/\*\*$/, '');
}

function isSameOrDescendant(candidatePath, ancestorPath) {
  return candidatePath === ancestorPath || candidatePath.startsWith(`${ancestorPath}${sep}`);
}

function findWritableRebindInsertionIndex(args, separatorIndex) {
  for (const flag of ['--unshare-pid', '--proc']) {
    const flagIndex = args.indexOf(flag);

    if (flagIndex !== -1 && flagIndex < separatorIndex) {
      return flagIndex;
    }
  }

  return separatorIndex;
}

function uniquePaths(paths) {
  const nextPaths = [];
  const seenPaths = new Set();

  for (const path of paths) {
    if (!path || seenPaths.has(path)) {
      continue;
    }

    seenPaths.add(path);
    nextPaths.push(path);
  }

  return nextPaths;
}
