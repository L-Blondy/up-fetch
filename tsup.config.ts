import { defineConfig } from 'tsup'

export default defineConfig({
   entry: { index: 'src/index.ts' },
   sourcemap: true,
   clean: true,
   // fix pnpm workspaces module resolution issues
   dts: { resolve: ['@standard-schema/spec'] },
   format: ['esm', 'cjs'],
   outDir: 'dist',
   minify: true,
})
