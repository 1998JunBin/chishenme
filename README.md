# 吃什么

帮你决定「这一餐吃什么」的菜谱推荐应用。系统推荐，用户决定。

## 技术栈

- React 19 + TypeScript + Vite
- Zustand（状态管理）+ idb（IndexedDB 本地持久化，本地优先 MVP，无后端）
- 设计语言：奶油白 / 暖橙 / 鼠尾草绿 + Liquid Glass + 扁平线性图标（已在高保真原型验收）

## 开发

```bash
npm install
npm run dev     # 本地开发
npm run build   # 生产构建
npm run lint
```

## 发布

推送 `main` 分支后，GitHub Actions 自动构建并部署到 GitHub Pages：

https://1998JunBin.github.io/chishenme/

## 文档

- 产品需求：`吃什么——产品 prd v2.docx`（PRD V1.1）
- 设计基准：`吃什么-高保真.html`（v0.6，已真机验收）
