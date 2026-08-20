import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// GitHub Pages 项目站点部署在 /chishenme/ 子路径
export default defineConfig({
  base: '/chishenme/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/icon-192.png', 'icons/icon-512.png'],
      manifest: {
        name: '吃什么 · 帮你决定这一餐',
        short_name: '吃什么',
        description: '帮你决定这一餐吃什么的菜谱推荐应用：设定规格，滑卡选菜，一桌好菜马上有。',
        lang: 'zh-CN',
        theme_color: '#FAF5EE',
        background_color: '#FAF5EE',
        display: 'standalone',
        start_url: '/chishenme/',
        scope: '/chishenme/',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
      },
    }),
  ],
})
