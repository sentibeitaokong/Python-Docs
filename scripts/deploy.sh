#!/usr/bin/env bash
# 本地部署脚本：先做一次文档检查与构建，再把当前分支推送到 GitHub。
# 推送到 main 后会触发 .github/workflows/deploy.yml，由 GitHub Actions 发布到 Pages。
set -euo pipefail

cd "$(dirname "$0")/.."

REMOTE="${REMOTE:-origin}"
BRANCH="${BRANCH:-main}"
REPO_URL="https://github.com/sentibeitaokong/Python-Docs"

current_branch="$(git rev-parse --abbrev-ref HEAD)"
if [[ "$current_branch" != "$BRANCH" ]]; then
  echo "❌ 当前分支是 $current_branch，请在 $BRANCH 分支上部署。" >&2
  exit 1
fi

if [[ -n "$(git status --porcelain)" ]]; then
  echo "❌ 工作区有未提交的改动，请先提交再部署。" >&2
  exit 1
fi

echo "==> 文档规范检查"
pnpm docs:lint

echo "==> 构建站点"
pnpm docs:build

echo "==> 推送到 $REMOTE/$BRANCH"
git push "$REMOTE" "$BRANCH"

echo "✅ 已推送，GitHub Actions 正在部署："
echo "   $REPO_URL/actions"
echo "   站点地址：https://sentibeitaokong.github.io/Python-Docs/"
