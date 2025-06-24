import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),  tailwindcss(),
    
    VitePWA({ 
      "name": "CCS ROOM MANAGEMENT",
    "short_name": "CSS ROOM",
    "description": "A CSS Room Management App",
    "start_url": "/",
    "display": "standalone",
    "background_color": "#ffffff",
    "theme_color": "#ffffff",
    "lang": "en",
    "scope": "/",
    "icons": [
    {
      "src": "/icon/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon/icon-512.png",
      "type": "image/png",
      "sizes": "512x512"
    },
    {
      "src": "/icon/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
    })],
})
