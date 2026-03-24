import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Vite plugin that patches the preload helper to be safe inside Web Workers.
 * The default preload helper references `document` which doesn't exist in
 * worker scopes. This patches the helper file itself so that when `document`
 * is unavailable, it falls back to just executing the dynamic import directly.
 */
function workerPreloadFix(): Plugin {
  return {
    name: 'worker-preload-fix',
    enforce: 'post',
    generateBundle(_, bundle) {
      for (const [fileName, chunk] of Object.entries(bundle)) {
        if (chunk.type !== 'chunk') continue;
        if (!fileName.includes('preload-helper')) continue;

        // The preload helper uses `document` which crashes in Web Workers.
        // Replace the export so it wraps the original function with a guard:
        // in worker scope (no document), just execute the import directly.
        chunk.code = chunk.code.replace(
          /export\{(\w+) as _\}/,
          'const __viteWorkerSafe = typeof document === "undefined" ? (i)=>i() : $1; export{__viteWorkerSafe as _}',
        );
      }
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), workerPreloadFix()],
  base: '/',
  optimizeDeps: {
    exclude: ['cubing'],
  },
});
