/**
 * 从下厨房(xiachufang)为内置菜谱抓取「真实匹配的菜品图」。
 * 用法: node scripts/fetch-dish-images.mjs
 * 产出: src/data/images.override.ts（dish id → 图 URL）
 * 说明: 逐个按菜名搜索，取搜索结果第一张图（最相关），
 *       请求间隔 0.4s 保持礼貌；失败的菜跳过（保留原图/兜底）。
 */
import fs from 'node:fs'
import path from 'node:path'

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36'

function parseRows(block) {
  // 只匹配菜名行：['菜名', 数字, [...标签]
  return [...block.matchAll(/\['([^']+)',\s*\d+,/g)].map((m) => m[1])
}

const src = fs.readFileSync(path.resolve(process.cwd(), 'src/data/dishes.ts'), 'utf8')
const meatBlock = src.match(/const MEAT_ROWS: Row\[\] = \[([\s\S]*?)\n\]/)?.[1] ?? ''
const vegBlock = src.match(/const VEG_ROWS: Row\[\] = \[([\s\S]*?)\n\]/)?.[1] ?? ''
const soupBlock = src.match(/const SOUP_ROWS: Row\[\] = \[([\s\S]*?)\n\]/)?.[1] ?? ''

const dishes = [
  ...parseRows(meatBlock).map((name, i) => ({ id: `m${String(i + 1).padStart(2, '0')}`, name })),
  ...parseRows(vegBlock).map((name, i) => ({ id: `v${String(i + 1).padStart(2, '0')}`, name })),
  ...parseRows(soupBlock).map((name, i) => ({ id: `s${String(i + 1).padStart(2, '0')}`, name })),
]

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

function rewrite(url) {
  // 截掉原尺寸参数，按展示尺寸重新取图（1=裁剪填充）
  const base = url.split('?')[0]
  return `${base}?imageView2/1/w/900/h/675/interlace/1/q/85`
}

async function fetchImage(name) {
  const url = `https://www.xiachufang.com/search/?keyword=${encodeURIComponent(name)}`
  const res = await fetch(url, { headers: { 'User-Agent': UA } })
  if (!res.ok) return null
  const html = await res.text()
  const m = html.match(/https:\/\/i[12]\.chuimg\.com\/[^"']+/)
  return m ? rewrite(m[0]) : null
}

const map = {}
const failed = []
for (const d of dishes) {
  try {
    const img = await fetchImage(d.name)
    if (img) map[d.id] = img
    else failed.push(d.name)
  } catch {
    failed.push(d.name)
  }
  process.stdout.write(`\r进度 ${Object.keys(map).length}/${dishes.length} 失败${failed.length}`)
  await sleep(400)
}
process.stdout.write('\n')

const out = `/** 自动生成：下厨房真实菜品图映射（dish id → URL） */
export const IMAGE_OVERRIDE: Record<string, string> = ${JSON.stringify(map, null, 2)}
`
fs.writeFileSync(path.resolve(process.cwd(), 'src/data/images.override.ts'), out)
console.log(`✅ 完成：成功 ${Object.keys(map).length}/${dishes.length}`)
if (failed.length) console.log('未匹配:', failed.join('、'))
