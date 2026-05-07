import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

describe('next-env.d.ts', () => {
  it('references the stable Next routes types output instead of the dev-only path', async () => {
    const nextEnvPath = fileURLToPath(new URL('../../../next-env.d.ts', import.meta.url));
    const source = await readFile(nextEnvPath, 'utf8');

    expect(source).toContain('import "./.next/types/routes.d.ts";');
    expect(source).not.toContain('.next/dev/types/routes.d.ts');
  });
});
