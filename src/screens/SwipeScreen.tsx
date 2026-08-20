import { Icon } from '../components/Icon'
import { useApp } from '../store/app'

/** 滑卡推荐页：本轮先占位接通流程，下一轮完整实现 */
export function SwipeScreen() {
  const prefs = useApp((s) => s.prefs)
  const setScreen = useApp((s) => s.setScreen)
  const spec = prefs.spec

  return (
    <div className="placeholder-screen">
      <div className="topbar">
        <div className="back glass" onClick={() => setScreen('tab')}>
          <Icon name="chevronLeft" size={22} />
        </div>
        <div className="topbar-title">今晚吃什么？</div>
        <div className="topbar-spacer" />
      </div>
      <div className="placeholder-body">
        <Icon name="bowl" size={56} />
        <h2>滑卡推荐开发中</h2>
        <p>
          本餐规格：{spec.meat}荤 {spec.veg}素 {spec.soup}汤 · {spec.people}人
          <br />
          卡片滑动、层叠、吸附动效将在下一阶段接入
        </p>
      </div>
    </div>
  )
}
