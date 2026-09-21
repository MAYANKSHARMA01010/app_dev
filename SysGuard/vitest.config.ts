import { defineConfig, type Plugin } from 'vitest/config';
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Vite plugin: When a .js file is imported and doesn't exist on disk,
 * try resolving it as .ts (needed for NodeNext TypeScript projects).
 */
function nodeNextJsToTs(): Plugin {
  return {
    name: 'node-next-js-to-ts',
    enforce: 'pre',
    resolveId(source, importer) {
      if (!source.endsWith('.js') || !importer) return null;
      const importerDir = dirname(importer);
      const jsPath = resolve(importerDir, source);
      if (existsSync(jsPath)) return null; // real .js file exists, leave it
      const tsPath = jsPath.slice(0, -3) + '.ts';
      if (existsSync(tsPath)) return tsPath;
      return null;
    },
  };
}

export default defineConfig({
  plugins: [nodeNextJsToTs()],
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/cli/**', 'src/types/**'],
    },
  },
});
