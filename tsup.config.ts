import { defineConfig } from 'tsup'

export default defineConfig({
   // entry: ['src/index.ts'],
   entry: {
      index: 'src/index.ts',
      'with-valibot': 'src/parsers/valibot.ts',
      'with-zod': 'src/parsers/zod.ts',
      'with-transform': 'src/parsers/transform.ts',
   },
   sourcemap: true,
   clean: true,
   dts: true,
   format: ['esm', 'cjs'],
   outDir: 'dist',
   minify: true,
})
