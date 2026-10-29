 import { defineConfig } from 'vite'
import { productionCspPlugin } from './scripts/securityCsp.mjs'

export default defineConfig({
  base: '/fant/',
  plugins: [productionCspPlugin()],
})
