import { realpath } from 'node:fs/promises';
import path from 'node:path';

export async function resolveManagedSkillSourceDir(
  bundleRoot: string,
  skillPath: string,
  skillName: string,
) {
  if (path.isAbsolute(skillPath)) {
    throw new Error(`Managed skill "${skillName}" must use a relative path inside the bundle.`);
  }

  const canonicalBundleRoot = await realpath(bundleRoot);
  const resolvedSkillPath = path.resolve(canonicalBundleRoot, skillPath);

  assertPathInsideRoot(
    canonicalBundleRoot,
    resolvedSkillPath,
    `Managed skill "${skillName}" must stay inside the bundle root.`,
  );

  const canonicalSkillPath = await realpath(resolvedSkillPath);

  assertPathInsideRoot(
    canonicalBundleRoot,
    canonicalSkillPath,
    `Managed skill "${skillName}" must stay inside the bundle root.`,
  );

  return canonicalSkillPath;
}

export function resolveManagedSkillTargetPath(skillsDir: string, skillName: string) {
  assertManagedSkillName(skillName);

  const normalizedSkillsDir = path.resolve(skillsDir);
  const targetPath = path.resolve(normalizedSkillsDir, skillName);
  const relativeTargetPath = path.relative(normalizedSkillsDir, targetPath);

  if (!isPathInsideRoot(relativeTargetPath) || hasPathSeparator(relativeTargetPath)) {
    throw new Error(`Managed skill "${skillName}" must map to a direct child directory inside data/skills.`);
  }

  return targetPath;
}

export function assertManagedSkillName(skillName: string) {
  if (skillName === '.' || skillName === '..' || hasPathSeparator(skillName)) {
    throw new Error(`Managed skill name must be a single directory name: ${skillName}.`);
  }
}

function assertPathInsideRoot(rootPath: string, targetPath: string, message: string) {
  const relativeTargetPath = path.relative(rootPath, targetPath);

  if (!isPathInsideRoot(relativeTargetPath)) {
    throw new Error(message);
  }
}

function hasPathSeparator(value: string) {
  return value.includes(path.posix.sep) || value.includes(path.win32.sep);
}

function isPathInsideRoot(relativePath: string) {
  if (relativePath === '' || relativePath === '.' || relativePath === '..') {
    return false;
  }

  return !relativePath.startsWith(`..${path.posix.sep}`)
    && !relativePath.startsWith(`..${path.win32.sep}`)
    && !path.isAbsolute(relativePath);
}
