import { defineConfig } from 'tsup'

export default defineConfig({
   sourcemap: true,
   clean: true,
   dts: true,
   format: ['esm'],
   outDir: 'dist',
   minify: true,
})
