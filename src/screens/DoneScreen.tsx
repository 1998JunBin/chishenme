import { useEffect, useMemo, useState } from 'react'
import { CAT_ICON, CAT_NAME } from '../components/categories'
import { Icon } from '../components/Icon'
import { SheetOverlay } from '../components/Sheet'
import { newId } from '../db/db'
import { useApp } from '../store/app'
import { useLibrary } from '../store/library'
import { CATEGORY_ORDER, useSession } from '../store/session'
import type { Category, Dish } from '../types'

export function DoneScreen() {
  const session = useSession()
  const setScreen = useApp((s) => s.setScreen)
  const setTab = useApp((s) => s.setTab)
  const addCombo = useLibrary((s) => s.addCombo)
  const [toast, setToast] = useState<string | null>(null)
  const [exportOpen, setExportOpen] = useState(false)
  const [exportBlob, setExportBlob] = useState<Blob | null>(null)
  const [exportUrl, setExportUrl] = useState<string | null>(null)

  const dishById = useMemo(() => {
    const m = new Map<string, Dish>()
    for (const c of CATEGORY_ORDER) for (const d of session.ranked[c]) m.set(d.id, d)
    return m
  }, [session.ranked])

  function showToast(msg: string) {
    setToast(msg)
    window.setTimeout(() => setToast(null), 1800)
  }

  /* 进入确认页：礼炮 + 纸屑庆祝 */
  useEffect(() => {
    confettiBurst()
    fireworksBurst()
    // 深链调试/演示：#done-export 自动打开导出浮层
    if (location.hash.includes('export')) {
      const t = window.setTimeout(() => exportImage(), 500)
      return () => window.clearTimeout(t)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function swapDish(cat: Category, id: string) {
    session.remove(cat, id)
    session.switchCat(cat)
    setScreen('swipe')
    showToast('已移除，重新选一道')
  }

  function saveCombo() {
    const dishes: { id: string; name: string; category: Category; time: number }[] = []
    for (const c of CATEGORY_ORDER) {
      for (const id of session.selected[c]) {
        const d = dishById.get(id)
        if (d) dishes.push({ id, name: d.name, category: c, time: d.time })
      }
    }
    if (!dishes.length) {
      showToast('还没有菜品可保存')
      return
    }
    void addCombo({ id: newId('combo'), createdAt: Date.now(), spec: session.spec, dishes })
    showToast('已保存到我的搭配')
  }

  function newMeal() {
    session.clear()
    setTab('home')
  }

  function exportImage() {
    const canvas = buildPoster()
    canvas.toBlob((blob) => {
      if (!blob) {
        showToast('导出失败')
        return
      }
      if (exportUrl) URL.revokeObjectURL(exportUrl)
      setExportBlob(blob)
      setExportUrl(URL.createObjectURL(blob))
      setExportOpen(true)
    }, 'image/png')
  }

  function saveExport() {
    if (!exportBlob) return
    const a = document.createElement('a')
    a.href = URL.createObjectURL(exportBlob)
    a.download = '今晚菜单.png'
    document.body.appendChild(a)
    a.click()
    a.remove()
    setExportOpen(false)
    showToast('图片已保存到本地')
  }

  function shareExport() {
    if (!exportBlob) return
    const file = new File([exportBlob], '今晚菜单.png', { type: 'image/png' })
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      navigator.share({ files: [file], title: '今晚吃这些', text: '今晚就吃这几道' }).catch(() => {})
    } else {
      saveExport()
      showToast('当前环境不支持分享，已保存到本地')
    }
    setExportOpen(false)
  }

  const spec = session.spec

  return (
    <div className="done-screen">
      <div className="done-hero">
        <div className="done-big">🎉</div>
        <h1 className="done-h1">搞定了</h1>
        <p className="done-sub">这一餐就吃这几道</p>
      </div>

      <div className="menu-card glass">
        <div className="mc-head">
          <div className="mc-title">今晚吃这些</div>
          <div className="mc-meta">{`${spec.people} 人 · ${spec.meat}荤 ${spec.veg}素 ${spec.soup}汤`}</div>
        </div>
        {CATEGORY_ORDER.map((c) =>
          session.selected[c].length ? (
            <div key={c} className="mc-group">
              <div className="mc-ghead">
                <Icon name={CAT_ICON[c]} size={16} /> {CAT_NAME[c]}
              </div>
              {session.selected[c].map((id) => {
                const d = dishById.get(id)
                if (!d) return null
                return (
                  <div key={id} className="mc-item">
                    <DishImageThumb dish={d} />
                    <span className="mc-nm">{d.name}</span>
                    <span className="mc-tm">{d.time}分钟</span>
                    <button className="swap-inline" onClick={() => swapDish(c, id)}>
                      <Icon name="swap" size={13} /> 换一道
                    </button>
                  </div>
                )
              })}
            </div>
          ) : null,
        )}
        <div className="mc-foot">共 {session.countPicked()} 道 · 慢慢享用</div>
      </div>

      <div className="done-cta">
        <div className="done-subrow">
          <button className="btn btn-primary" onClick={exportImage}>
            <Icon name="download" size={18} /> 导出图片
          </button>
          <button className="btn btn-ghost" onClick={saveCombo}>
            <Icon name="heart" size={18} /> 保存到我的搭配
          </button>
        </div>
        <button className="btn btn-ghost" onClick={newMeal}>
          <Icon name="swap" size={18} /> 重新来一餐
        </button>
      </div>

      <div className="confetti" id="confetti" />
      <div className="celebrate" id="celebrate">
        <svg id="celebrateSVG" viewBox="0 0 390 320" width="100%" height="100%" />
      </div>

      {/* 导出动作条（Portal 到手机壳层，固定底部弹出） */}
      <SheetOverlay open={exportOpen} onClose={() => setExportOpen(false)}>
        <div className="grab" />
        <h3>导出图片</h3>
        <p className="sheet-sub">把这张菜单保存或分享</p>
        <div className="export-preview">
          {exportUrl && <img src={exportUrl} alt="预览" />}
        </div>
        <div className="export-actions">
          <button className="btn btn-primary" onClick={saveExport}>
            <Icon name="download" size={18} /> 保存到本地
          </button>
          <button className="btn btn-ghost" onClick={shareExport}>
            <Icon name="share" size={18} /> 分享
          </button>
        </div>
      </SheetOverlay>

      {toast && <div className="toast show">{toast}</div>}
    </div>
  )

  function buildPoster(): HTMLCanvasElement {
    const W = 1080
    const P = 84
    const F = '-apple-system,BlinkMacSystemFont,"PingFang SC",sans-serif'
    const cats = CATEGORY_ORDER.filter((c) => session.selected[c].length)
    const rows = session.countPicked()
    const H = P + 88 + 42 + 30 + 20 + cats.length * 70 + rows * 88 + 76 + P
    const cv = document.createElement('canvas')
    cv.width = W
    cv.height = H
    const ctx = cv.getContext('2d')!
    ctx.fillStyle = '#FAF5EE'
    ctx.fillRect(0, 0, W, H)
    let y = P
    ctx.fillStyle = '#2A241E'
    ctx.font = `800 68px ${F}`
    ctx.textAlign = 'left'
    ctx.textBaseline = 'alphabetic'
    ctx.fillText('今晚吃这些', P, y + 68)
    y += 88
    ctx.fillStyle = '#8A7F74'
    ctx.font = `400 32px ${F}`
    ctx.fillText(`${spec.people} 人 · ${spec.meat}荤 ${spec.veg}素 ${spec.soup}汤 · ${today()}`, P, y + 30)
    y += 56
    ctx.fillStyle = '#FF7A3C'
    ctx.fillRect(P, y, 84, 7)
    y += 38
    for (const c of cats) {
      ctx.fillStyle = '#7E8F6E'
      ctx.beginPath()
      ctx.arc(P + 14, y + 22, 9, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#7E8F6E'
      ctx.font = `700 36px ${F}`
      ctx.fillText(CAT_NAME[c], P + 36, y + 38)
      y += 56
      for (const id of session.selected[c]) {
        const d = dishById.get(id)
        if (!d) continue
        ctx.fillStyle = '#2A241E'
        ctx.font = `600 44px ${F}`
        ctx.fillText(d.name, P + 10, y + 42)
        ctx.fillStyle = '#8A7F74'
        ctx.font = `400 30px ${F}`
        ctx.textAlign = 'right'
        ctx.fillText(`${d.time}分钟`, W - P, y + 38)
        ctx.textAlign = 'left'
        y += 88
      }
      y += 12
    }
    ctx.fillStyle = '#7E8F6E'
    ctx.font = `600 34px ${F}`
    ctx.textAlign = 'center'
    ctx.fillText(`共 ${rows} 道 · 慢慢享用`, W / 2, y + 18)
    return cv
  }
}

function DishImageThumb({ dish }: { dish: Dish }) {
  const [failed, setFailed] = useState(false)
  if (failed || !dish.image) {
    return (
      <span className="ic">
        <Icon name={CAT_ICON[dish.category]} size={20} />
      </span>
    )
  }
  return (
    <span className="ic">
      <img
        src={dish.image}
        alt={dish.name}
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
    </span>
  )
}

function today() {
  const d = new Date()
  const wd = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()]
  return `${d.getMonth() + 1}月${d.getDate()}日 周${wd}`
}

function confettiBurst() {
  const box = document.getElementById('confetti')
  if (!box) return
  box.innerHTML = ''
  const colors = ['#FF7A3C', '#7E8F6E', '#FFB088', '#F3C14B', '#ffffff', '#E98B5E']
  for (let i = 0; i < 70; i++) {
    const p = document.createElement('i')
    const size = 6 + Math.random() * 8
    const dur = 1.6 + Math.random() * 1.6
    const delay = Math.random() * 0.5
    p.style.cssText = `left:${Math.random() * 100}%;width:${size}px;height:${size * 1.4}px;background:${colors[Math.floor(Math.random() * colors.length)]};animation-duration:${dur}s;animation-delay:${delay}s;`
    box.appendChild(p)
  }
  window.setTimeout(() => {
    box.innerHTML = ''
  }, 3800)
}

function fireworksBurst() {
  const box = document.getElementById('celebrate')
  const svg = document.getElementById('celebrateSVG')
  if (!box || !svg) return
  const colors = ['#FF7A3C', '#7E8F6E', '#F3C14B', '#FFB088']
  let inner = ''
  for (let b = 0; b < 5; b++) {
    const cx = 40 + Math.random() * 310
    const cy = 30 + Math.random() * 160
    const R = 34 + Math.random() * 30
    const color = colors[b % colors.length]
    let parts = ''
    for (let i = 0; i < 12; i++) {
      const ang = (i / 12) * Math.PI * 2
      const x2 = cx + Math.cos(ang) * R
      const y2 = cy + Math.sin(ang) * R
      parts += `<line x1="${cx}" y1="${cy}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="2.6" stroke-linecap="round"/>`
      parts += `<circle cx="${x2}" cy="${y2}" r="2.6" fill="${color}"/>`
    }
    parts += `<circle cx="${cx}" cy="${cy}" r="4.5" fill="#fff"/>`
    inner += `<g class="fw" style="transform-origin:${cx}px ${cy}px;animation-delay:${b * 0.22}s">${parts}</g>`
  }
  svg.innerHTML = inner
  box.classList.remove('play')
  void box.offsetWidth
  box.classList.add('play')
  window.setTimeout(() => box.classList.remove('play'), 3000)
}
