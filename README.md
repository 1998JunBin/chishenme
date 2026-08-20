# 吃什么

帮你决定「这一餐吃什么」的菜谱推荐应用。系统推荐，用户决定。

## 技术栈

- React 19 + TypeScript + Vite
- Zustand（状态管理）+ idb（IndexedDB 本地持久化，本地优先 MVP，无后端）
- 设计语言：奶油白 / 暖橙 / 鼠尾草绿 + Liquid Glass + 扁平线性图标（已在高保真原型真机验收）
- PWA：可添加到主屏（manifest + Service Worker 预缓存），离线可用

## 开发

```bash
npm install
npm run dev     # 本地开发
npm run build   # 生产构建
npm run lint
npm test      # 运行测试（数据集 + 推荐引擎）
```

## 发布

```bash
GITHUB_TOKEN=你的令牌 npm run deploy
```

构建并把 dist 推送到 `gh-pages` 分支，站点地址：

https://1998junbin.github.io/chishenme/

> 说明：GitHub Actions 自动部署（`.github/workflows/deploy.yml`）已备好，待发布令牌补充 `workflow` 权限后即可切换为推送即自动发布。

## 文档

- 产品需求：`吃什么——产品 prd v2.docx`（PRD V1.1）
- 设计基准：`吃什么-高保真.html`（v0.6，已真机验收）
