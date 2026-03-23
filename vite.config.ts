import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Vite plugin that patches the preload helper inside Web Worker bundles.
 * The default preload helper references `document` which doesn't exist
 * in worker scopes, causing "document is not defined" errors at runtime.
 * This replaces it with a no-op that just executes the dynamic import.
 */
function workerPreloadFix(): Plugin {
  return {
    name: 'worker-preload-fix',
    enforce: 'post',
    generateBundle(_, bundle) {
      for (const [fileName, chunk] of Object.entries(bundle)) {
        if (chunk.type !== 'chunk') continue;
        // Patch any worker entry that imports the preload helper
        if (!fileName.includes('search-worker-entry')) continue;

        chunk.code = chunk.code.replace(
          /import\{_ as (\w+)\}from"\.\/preload-helper[^"]*\.js";/,
          'const $1=(i)=>i();',
        );
      }
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), workerPreloadFix()],
  base: '/solve-arena/',
  optimizeDeps: {
    exclude: ['cubing'],
  },
});
