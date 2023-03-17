import { defineOptions } from 'tsup'

export default defineOptions({
   entry: ['src/index.ts'],
   sourcemap: true,
   clean: true,
   dts: true,
   format: ['cjs', 'esm'],
   minify: 'terser',
   outDir: 'dist',
})
