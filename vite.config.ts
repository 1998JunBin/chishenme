import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages 项目站点部署在 /chishenme/ 子路径
export default defineConfig({
  base: '/chishenme/',
  plugins: [react()],
})
