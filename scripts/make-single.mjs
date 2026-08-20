/**
 * 把 dist 内联成单文件 HTML（dist/single.html）。
 * 用途：本地 file:// 预览/截图（ES 模块在 file:// 下被 CORS 拦截，
 * 内联后即可直接双击打开）。
 */
import fs from 'node:fs'
import path from 'node:path'

const dist = path.resolve(process.cwd(), 'dist')
let html = fs.readFileSync(path.join(dist, 'index.html'), 'utf8')

html = html.replace(
  /<script type="module"[^>]*src="([^"]+)"><\/script>/,
  (_, src) => {
    const js = fs.readFileSync(path.join(dist, src.replace(/^\.\//, '')), 'utf8')
    return `<script type="module">\n${js}\n</script>`
  },
)
html = html.replace(
  /<link rel="stylesheet"[^>]*href="([^"]+)">/,
  (_, href) => {
    const css = fs.readFileSync(path.join(dist, href.replace(/^\.\//, '')), 'utf8')
    return `<style>\n${css}\n</style>`
  },
)

fs.writeFileSync(path.join(dist, 'single.html'), html)
console.log('✅ 已生成 dist/single.html（单文件，可本地直接打开）')
