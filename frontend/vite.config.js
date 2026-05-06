import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'generateSW',   // Workbox genera el SW automáticamente
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        name: 'ApoloFoodOS',
        short_name: 'ApoloFood',
        description: 'Gestión de pedidos para restaurantes en Apolo',
        theme_color: '#c0392b',
        background_color: '#1a1a2e',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            // Menú del restaurante: network-first, caché 1 hora (CDN Cloudflare)
            urlPattern: ({ url }) => url.pathname.startsWith('/api/menu'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-menu',
              networkTimeoutSeconds: 5,
              expiration: { maxAgeSeconds: 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Otros endpoints API: network-only (pedidos, estados)
            urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
            handler: 'NetworkOnly',
          },
        ],
      },
    }),
  ],

  server: {
    // Desarrollo local: proxy hacia backend en :8000
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },

  build: {
    // Producción: las llamadas /api/ van al backend Railway
    // La URL base se define en VITE_API_URL (ver .env.example del frontend)
    outDir: 'dist',
    sourcemap: false,
  },
})
