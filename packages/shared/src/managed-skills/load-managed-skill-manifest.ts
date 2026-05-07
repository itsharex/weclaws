import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';
import { assertManagedSkillName, resolveManagedSkillSourceDir } from './managed-skills-paths';

export const MANAGED_SKILLS_BUNDLE_RELATIVE_PATH = path.join('resources', 'skills', 'managed');

const ManagedSkillManifestEntrySchema = z.object({
  name: z.string().min(1),
  path: z.string().min(1),
});

const ManagedSkillManifestSchema = z.object({
  version: z.string().min(1),
  skills: z.array(ManagedSkillManifestEntrySchema),
});

export type ManagedSkillManifestEntry = z.infer<typeof ManagedSkillManifestEntrySchema>;
export type ManagedSkillManifest = z.infer<typeof ManagedSkillManifestSchema>;

interface LoadManagedSkillManifestInput {
  bundleRoot: string;
}

export function resolveManagedSkillsBundleRoot(workspaceRoot: string) {
  return path.join(workspaceRoot, MANAGED_SKILLS_BUNDLE_RELATIVE_PATH);
}

export async function loadManagedSkillManifest(
  input: LoadManagedSkillManifestInput,
): Promise<ManagedSkillManifest> {
  const manifestPath = path.join(input.bundleRoot, 'manifest.json');
  const raw = await readFile(manifestPath, 'utf8');
  const manifest = ManagedSkillManifestSchema.parse(JSON.parse(raw));
  const seenNames = new Set<string>();

  await Promise.all(manifest.skills.map(async (skill) => {
    if (seenNames.has(skill.name)) {
      throw new Error(`Managed skill manifest contains a duplicate skill name: ${skill.name}.`);
    }

    seenNames.add(skill.name);
    assertManagedSkillName(skill.name);

    const skillPath = await resolveManagedSkillSourceDir(input.bundleRoot, skill.path, skill.name);
    const skillStats = await stat(skillPath);

    if (!skillStats.isDirectory()) {
      throw new Error(`Managed skill "${skill.name}" must point to a directory: ${skillPath}.`);
    }
  }));

  return manifest;
}
