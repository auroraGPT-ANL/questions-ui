import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig((configEnv) => { return {
  base: '/ui/',
  build: {
      sourcemap: configEnv.mode === 'development',
  },
  plugins: [react()],
};})
