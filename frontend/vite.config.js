import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),  tailwindcss(),
    
    VitePWA({ 

      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'CCS ROOM MANAGEMENT',
        short_name: 'CCS ROOM',
        description: 'General Community Reporting App',
        theme_color: '#ffffff',
        icons: [
          {
            src: '/icon/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icon/icon-512.png',
            type: 'image/png',
            sizes: '512x512'
          },
        ]
      },
})],
})
