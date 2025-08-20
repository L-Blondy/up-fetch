import { defineConfig, type Options } from 'tsup'

const options: Options = {
   entry: { index: 'src/index.ts' },
   sourcemap: true,
   clean: true,
   // fix pnpm workspaces module resolution issues
   dts: { resolve: ['@standard-schema/spec'] },
   format: ['esm', 'cjs'],
   outDir: 'dist',
   minify: false,
}

export default defineConfig([
   options,
   {
      ...options,
      dts: false,
      sourcemap: false,
      format: ['esm'],
      minify: true,
      outExtension: () => ({ 'js': '.min.js' }),
   },
])
