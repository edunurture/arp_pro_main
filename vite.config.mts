import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import autoprefixer from 'autoprefixer'
import type { DeprecationOrId } from 'sass'

// https://vitejs.dev/config/
export default defineConfig(() => {
  return {
    base: './',

    build: {
      outDir: 'build',
    },

    css: {
      postcss: {
        plugins: [autoprefixer({})],
      },
    },

    plugins: [react()],

    resolve: {
      alias: [
        {
          find: 'src/',
          replacement: `${path.resolve(__dirname, 'src')}/`,
        },
      ],
      extensions: ['.mjs', '.mts', '.js', '.ts', '.jsx', '.tsx', '.json', '.scss'],
    },

    server: {
      port: 3000,

      // ✅ ARP Backend Proxy
      proxy: {
        '/api': {
          target: 'http://localhost:4000',
          changeOrigin: true,
          secure: false,
        },
      },
    },
  }
})
