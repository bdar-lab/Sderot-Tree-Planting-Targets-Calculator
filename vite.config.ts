import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// `base` is the path the app is served from. The bdar-lab GitHub Pages
// project site is expected to live at /Sderot-Tree-Planting-Targets-Calculator/.
// `npm run dev` overrides this to '/' via mode so local dev works from root.
// Override with the VITE_BASE env var for any other host.
const GH_PAGES_BASE = '/Sderot-Tree-Planting-Targets-Calculator/'

export default defineConfig(({ command }) => ({
  base: process.env.VITE_BASE || (command === 'serve' ? '/' : GH_PAGES_BASE),
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    // @arcgis/core is large; raise the warning ceiling rather than chunk it
    // aggressively (the SDK does not split cleanly).
    chunkSizeWarningLimit: 4000
  },
  server: {
    port: 5173,
    open: true
  }
}))
