import path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
   test: {
      environment: 'node',
   },
   base: './',
   resolve: {
      alias: {
         src: path.resolve(__dirname, './src'),
      },
   },
})
