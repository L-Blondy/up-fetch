import { defineConfig } from 'tsup'

export default defineConfig({
   entry: ['lib/index.ts'],
   sourcemap: true,
   clean: true,
   dts: true,
   format: ['esm'],
   outDir: 'dist',
   // minify: true,
})
