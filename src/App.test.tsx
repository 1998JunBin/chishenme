// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import App from './App'
import { useApp } from './store/app'
import { DEFAULT_PREFS } from './types'

beforeEach(() => {
  // 重置模块级 store，避免用例间状态泄漏
  useApp.setState({
    tab: 'home',
    screen: 'tab',
    prefs: { ...DEFAULT_PREFS },
    ready: true,
  })
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
    expect(await screen.findByText('菜谱模块开发中')).toBeTruthy()
    fireEvent.click(screen.getByText('我的'))
    expect(await screen.findByText('我的模块开发中')).toBeTruthy()
  })

  it('点击规格大卡进入设置页', async () => {
    render(<App />)
    await screen.findByText('吃什么？')
    fireEvent.click(screen.getByText('今天的这一餐'))
    expect(await screen.findByText('设置这一餐')).toBeTruthy()
    expect(screen.getByText('今天吃几道菜？')).toBeTruthy()
  })

  it('点击主按钮进入滑卡页（占位）', async () => {
    render(<App />)
    await screen.findByText('吃什么？')
    fireEvent.click(screen.getByText('开始选今天吃什么'))
    expect(await screen.findByText('滑卡推荐开发中')).toBeTruthy()
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
