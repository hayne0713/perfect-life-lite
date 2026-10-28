import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => ({
  base: loadEnv(mode, '.', '').VITE_BASE_PATH || '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Perfect Life Lite',
        short_name: 'Perfect Life',
        description: '記錄活動、睡眠、飲食與每日提醒。',
        lang: 'zh-TW',
        start_url: './',
        scope: './',
        display: 'standalone',
        background_color: '#f5f6f1',
        theme_color: '#f5f6f1',
        icons: [
          { src: 'pwa-192.svg', sizes: '192x192', type: 'image/svg+xml', purpose: 'any maskable' },
          { src: 'pwa-512.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        navigateFallback: 'index.html',
      },
    }),
  ],
}))
