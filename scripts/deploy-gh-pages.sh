#!/bin/bash
# 本地部署脚本：构建并把 dist 推送到 gh-pages 分支（GitHub Pages）
# 用法: GITHUB_TOKEN=xxx npm run deploy
set -e
cd "$(dirname "$0")/.."

OWNER="1998JunBin"
REPO="chishenme"

if [ -z "$GITHUB_TOKEN" ]; then
  echo "❌ 请先设置 GITHUB_TOKEN 环境变量: GITHUB_TOKEN=xxx npm run deploy"
  exit 1
fi

echo "构建中..."
npm run build

TMP=$(mktemp -d)
cp -r dist/. "$TMP/"
cd "$TMP"
git init -q -b gh-pages
git config user.email "1998JunBin@users.noreply.github.com"
git config user.name "1998JunBin"
git add -A
git commit -q -m "deploy $(date -u +%Y-%m-%dT%H:%M:%SZ)" || true
git push -q -f "https://${OWNER}:${GITHUB_TOKEN}@github.com/${OWNER}/${REPO}.git" gh-pages
rm -rf "$TMP"
echo "✅ 已部署: https://${OWNER}.github.io/${REPO}/"
