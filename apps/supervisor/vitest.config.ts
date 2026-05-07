import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@weclaws/db': fileURLToPath(
        new URL('../../packages/db/src/index.ts', import.meta.url),
      ),
      '@weclaws/shared/managed-skills': fileURLToPath(
        new URL('../../packages/shared/src/managed-skills/index.ts', import.meta.url),
      ),
      '@weclaws/shared': fileURLToPath(
        new URL('../../packages/shared/src/index.ts', import.meta.url),
      ),
    },
  },
});
