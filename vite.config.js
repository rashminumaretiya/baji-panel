import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // Modern browsers only; matches React 19 + Vite 8 baseline assumptions.
    target: 'esnext',
    // Casino registry chunk legitimately exceeds 500kB (~3MB) until per-provider
    // splitting lands — raise the warning floor so noise doesn't drown signal.
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        // Split heavy third-party libs out of the main bundle so route navigation
        // and bet placement don't re-parse them. Each chunk is cacheable across
        // sessions; the user only re-downloads what actually changed.
        // Rolldown (Vite 8) requires the function form of manualChunks.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          if (
            /node_modules\/(react|react-dom|scheduler|react-router|react-router-dom)\//.test(
              id
            )
          ) {
            return 'vendor-react'
          }
          if (
            /node_modules\/(@reduxjs\/toolkit|react-redux|redux|immer|reselect)\//.test(
              id
            )
          ) {
            return 'vendor-redux'
          }
          if (
            /node_modules\/(i18next|react-i18next|i18next-http-backend)\//.test(
              id
            )
          ) {
            return 'vendor-i18n'
          }
          if (
            /node_modules\/(socket\.io-client|engine\.io-client|socket\.io-parser)\//.test(
              id
            )
          ) {
            return 'vendor-socket'
          }
          if (/node_modules\/crypto-js\//.test(id)) return 'vendor-crypto'
          if (/node_modules\/sweetalert2\//.test(id)) return 'vendor-swal'
          if (/node_modules\/axios\//.test(id)) return 'vendor-axios'
          return undefined
        },
      },
    },
  },
})
