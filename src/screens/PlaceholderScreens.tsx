import { Icon } from '../components/Icon'

export function RecipesScreen() {
  return (
    <div className="placeholder-screen">
      <div className="placeholder-body">
        <Icon name="book" size={56} />
        <h2>菜谱模块开发中</h2>
        <p>内置菜谱 + 自定义菜谱（含图片上传、自定义标签）将在后续阶段接入</p>
      </div>
    </div>
  )
}

export function ProfileScreen() {
  return (
    <div className="placeholder-screen">
      <div className="placeholder-body">
        <Icon name="user" size={56} />
        <h2>我的模块开发中</h2>
        <p>喜欢/不喜欢、忌口、口味偏好、我的搭配将在后续阶段接入</p>
      </div>
    </div>
  )
}
