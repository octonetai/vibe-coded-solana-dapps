import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      // To add only specific polyfills, add them here. If no option is passed, adds all polyfills
      include: ['buffer', 'process'],
      // To exclude specific polyfills, add them to this list. Note: if include is provided, this has no effect
      exclude: [],
      // Whether to polyfill `node:` protocol imports.
      protocolImports: true,
    }),
  ],
})
