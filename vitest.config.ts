import path from 'path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
   test: {
      environment: 'jsdom',
   },
   base: '.',
   resolve: {
      alias: {
         lib: path.resolve(__dirname, './lib'),
      },
   },
})
