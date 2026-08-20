// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { useApp } from './store/app'
import { useLibrary } from './store/library'
import { useSession } from './store/session'
import { DEFAULT_PREFS } from './types'

vi.mock('./db/db', () => ({
  loadPrefs: async () => ({
    id: 'main',
    spec: { meat: 2, veg: 2, soup: 1, people: 3 },
    tags: ['快手', '辣'],
    likes: [],
    dislikes: [],
    avoid: ['香菜', '苦瓜'],
    taste: '微辣',
    novelty: 0.64,
    customTags: [],
    hintSeen: false,
  }),
  savePrefs: async () => {},
  listCustomDishes: async () => [],
  addCustomDish: async () => {},
  updateCustomDish: async () => {},
  deleteCustomDish: async () => {},
  listCombos: async () => [],
  addCombo: async () => {},
  deleteCombo: async () => {},
  listRecent: async () => [],
  recordRecent: async () => {},
  newId: () => 'id_test',
}))

beforeEach(() => {
  // 重置模块级 store，避免用例间状态泄漏
  useApp.setState({
    tab: 'home',
    screen: 'tab',
    prefs: { ...DEFAULT_PREFS },
    ready: true,
  })
  useSession.getState().clear()
  useLibrary.setState({ customDishes: [], combos: [], recent: [], ready: true })
  window.location.hash = ''
})

afterEach(() => {
  document.body.innerHTML = ''
})

describe('应用骨架与首页', () => {
  it('渲染首页：标题、规格大卡与主按钮', async () => {
    render(<App />)
    expect(await screen.findByText('吃什么？')).toBeTruthy()
    expect(screen.getByText('规格都设好了，直接开选，或者点进去再调调。')).toBeTruthy()
    expect(screen.getByText('今天的这一餐')).toBeTruthy()
    expect(screen.getByText('2荤 2素 1汤 · 3人')).toBeTruthy()
    expect(screen.getByText('开始选今天吃什么')).toBeTruthy()
  })

  it('底部三个 tab 可切换', async () => {
    render(<App />)
    await screen.findByText('吃什么？')
    fireEvent.click(screen.getByText('菜谱'))
    expect(await screen.findByText('添加')).toBeTruthy()
    expect(screen.getAllByText('全部').length).toBeGreaterThanOrEqual(2)
    fireEvent.click(screen.getByText('我的'))
    expect(await screen.findByText('我的喜欢')).toBeTruthy()
  })

  it('点击规格大卡进入设置页', async () => {
    render(<App />)
    await screen.findByText('吃什么？')
    fireEvent.click(screen.getByText('今天的这一餐'))
    expect(await screen.findByText('设置这一餐')).toBeTruthy()
    expect(screen.getByText('今天吃几道菜？')).toBeTruthy()
  })

  it('点击主按钮进入滑卡推荐页', async () => {
    render(<App />)
    await screen.findByText('吃什么？')
    fireEvent.click(screen.getByText('开始选今天吃什么'))
    expect(await screen.findByText('就它了')).toBeTruthy()
    expect(screen.getByText('上一道')).toBeTruthy()
    expect(screen.getByText('下一道')).toBeTruthy()
  })
})

describe('设置页交互', () => {
  it('步进器加减有效', async () => {
    render(<App />)
    await screen.findByText('吃什么？')
    fireEvent.click(screen.getByText('今天的这一餐'))
    await screen.findByText('设置这一餐')

    const meatStepper = screen.getByText('荤菜').closest('.stepper') as HTMLElement
    fireEvent.click(meatStepper.querySelector('.stepper-btn:last-child') as Element)
    expect(meatStepper.querySelector('.stepper-val')?.textContent).toBe('3')

    fireEvent.click(meatStepper.querySelector('.stepper-btn:first-child') as Element)
    fireEvent.click(meatStepper.querySelector('.stepper-btn:first-child') as Element)
    expect(meatStepper.querySelector('.stepper-val')?.textContent).toBe('1')
  })

  it('标签多选切换', async () => {
    render(<App />)
    await screen.findByText('吃什么？')
    fireEvent.click(screen.getByText('今天的这一餐'))
    await screen.findByText('设置这一餐')

    const chip = screen.getByText('清淡')
    fireEvent.click(chip)
    expect(chip.className).toContain('on')
    fireEvent.click(chip)
    expect(chip.className).not.toContain('on')
  })

  it('返回按钮回到首页', async () => {
    render(<App />)
    await screen.findByText('吃什么？')
    fireEvent.click(screen.getByText('今天的这一餐'))
    await screen.findByText('设置这一餐')
    fireEvent.click(document.querySelector('.topbar .back') as Element)
    expect(await screen.findByText('开始选今天吃什么')).toBeTruthy()
  })
})

describe('菜谱与我的模块', () => {
  it('添加自定义菜谱后出现在列表中', async () => {
    render(<App />)
    await screen.findByText('吃什么？')
    fireEvent.click(screen.getByText('菜谱'))
    await screen.findByText('添加')
    fireEvent.click(screen.getByText('添加'))
    await screen.findByText('添加我的菜谱')
    const input = screen.getByPlaceholderText('例如：家常炒鸡') as HTMLInputElement
    fireEvent.change(input, { target: { value: '我的拿手菜' } })
    fireEvent.click(screen.getByText('保存菜谱'))
    // 回到菜谱列表，新菜出现
    expect(await screen.findByText('我的拿手菜')).toBeTruthy()
  })

  it('编辑内置菜：改名后列表生效', async () => {
    render(<App />)
    await screen.findByText('吃什么？')
    fireEvent.click(screen.getByText('菜谱'))
    await screen.findByText('添加')
    // 点第一道菜进详情 → 编辑 → 改名 → 保存
    const firstDish = (await screen.findAllByText(/分钟$/))[0]
    fireEvent.click(firstDish)
    const editBtn = await screen.findByText('编辑')
    fireEvent.click(editBtn)
    await screen.findByText('编辑菜谱')
    const input = screen.getByPlaceholderText('例如：家常炒鸡') as HTMLInputElement
    fireEvent.change(input, { target: { value: '改名后的菜' } })
    fireEvent.click(screen.getByText('保存菜谱'))
    expect(await screen.findByText('改名后的菜')).toBeTruthy()
  })

  it('不吃的食材可新增', async () => {
    render(<App />)
    await screen.findByText('吃什么？')
    fireEvent.click(screen.getByText('我的'))
    await screen.findByText('我的喜欢')
    fireEvent.click(screen.getByText('不吃的食材'))
    await screen.findByText('推荐时会过滤这些食材')
    const input = screen.getByPlaceholderText('添加食材，如：香菜') as HTMLInputElement
    fireEvent.change(input, { target: { value: '洋葱' } })
    fireEvent.click(screen.getByText('添加'))
    expect(await screen.findByText('洋葱')).toBeTruthy()
  })

  it('口味偏好可切换', async () => {
    render(<App />)
    await screen.findByText('吃什么？')
    fireEvent.click(screen.getByText('我的'))
    await screen.findByText('我的喜欢')
    fireEvent.click(screen.getByText('口味偏好'))
    const spicy = await screen.findByText('中辣')
    fireEvent.click(spicy)
    expect(spicy.className).toContain('on')
  })
})
