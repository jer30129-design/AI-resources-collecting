import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => ({
  // GitHub Pages hosts this repository below /<repository-name>/.
  // Dev mode stays at / so the existing localhost URL remains unchanged.
  base: mode === 'production' ? '/AI-resources-collecting/' : '/',
  plugins: [react()],
}))
