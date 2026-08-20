/**
 * 生成 PWA 应用图标（纯 Node，无外部依赖）。
 * 图标：暖橙圆角底 + 白色碗（带热气）。
 * 用法: node scripts/gen-icons.mjs
 */
import { deflateSync } from 'node:zlib'
import fs from 'node:fs'
import path from 'node:path'

/* ---------- 最小 PNG 编码 ---------- */
const CRC_TABLE = new Int32Array(256)
for (let n = 0; n < 256; n++) {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  CRC_TABLE[n] = c
}
function crc32(buf) {
  let c = -1
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ -1) >>> 0
}
function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const t = Buffer.from(type, 'ascii')
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])))
  return Buffer.concat([len, t, data, crc])
}
function encodePNG(size, rgba) {
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // RGBA
  const stride = size * 4 + 1
  const raw = Buffer.alloc(stride * size)
  for (let y = 0; y < size; y++) {
    raw[y * stride] = 0
    rgba.copy(raw, y * stride + 1, y * size * 4, (y + 1) * size * 4)
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

/* ---------- 绘制 ---------- */
const ORANGE = [255, 122, 60, 255]
const WHITE = [255, 255, 255, 255]

function draw(size) {
  const buf = Buffer.alloc(size * size * 4) // 透明
  const R = Math.round(size * 0.226)
  const set = (x, y, [r, g, b, a]) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return
    const i = (y * size + x) * 4
    buf[i] = r
    buf[i + 1] = g
    buf[i + 2] = b
    buf[i + 3] = a
  }
  const inRoundRect = (x, y) => {
    const x0 = R
    const x1 = size - R
    const y0 = R
    const y1 = size - R
    if (x >= x0 && x < x1 && y >= y0 && y < y1) return true
    const cx = x < x0 ? x0 : x1 - 1
    const cy = y < y0 ? y0 : y1 - 1
    const dx = x - cx
    const dy = y - cy
    return dx * dx + dy * dy <= R * R
  }
  // 圆角橙色底
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (inRoundRect(x, y)) set(x, y, ORANGE)
    }
  }
  // 碗：以 (0.5, 0.615) 为圆心、半径 0.25，取下半圆（碗口平顶）
  const cx = size * 0.5
  const cy = size * 0.615
  const r = size * 0.25
  const rimY = cy - r * 0.08
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - cx
      const dy = y - cy
      if (dx * dx + dy * dy <= r * r && y >= rimY) set(x, y, WHITE)
    }
  }
  // 热气：两条竖向圆头短线
  const steamW = Math.max(3, Math.round(size * 0.028))
  const steamH = Math.round(size * 0.075)
  const steamTop = Math.round(size * 0.3)
  for (const sx of [size * 0.39, size * 0.535]) {
    const x0 = Math.round(sx)
    for (let y = steamTop; y < steamTop + steamH; y++) {
      for (let x = x0; x < x0 + steamW; x++) {
        const t = (y - steamTop) / steamH
        const half = steamW / 2
        const edge = Math.abs(x - (x0 + half))
        if (edge <= half && (t < 0.12 || t > 0.88 || edge <= half - 1)) set(x, y, WHITE)
      }
    }
  }
  return buf
}

const outDir = path.resolve(process.cwd(), 'public/icons')
fs.mkdirSync(outDir, { recursive: true })
for (const size of [192, 512]) {
  const png = encodePNG(size, draw(size))
  fs.writeFileSync(path.join(outDir, `icon-${size}.png`), png)
}
console.log('✅ 已生成 public/icons/icon-192.png 与 icon-512.png')
