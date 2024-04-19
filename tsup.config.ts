import { defineConfig } from 'tsup'

export default defineConfig({
   entry: ['src/index.ts', 'src/parsers/zod.ts', 'src/parsers/valibot.ts'],
   sourcemap: true,
   clean: true,
   dts: true,
   format: ['esm'],
   outDir: 'dist',
   minify: true,
})
