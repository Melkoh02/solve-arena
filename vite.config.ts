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

        // Wrap the entire preload helper: if document doesn't exist (worker),
        // export a no-op that just executes the import callback.
        chunk.code =
          `const __workerSafe = typeof document === "undefined";\n` +
          chunk.code.replace(
            /export\{(\w+) as _\}/,
            'export{__workerSafe ? (i)=>i() : $1 as _}',
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
