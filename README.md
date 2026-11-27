# Python3Docs

基于 VitePress 的 Python 3 知识体系文档站。只保留文档站本身以及提交相关的配置：pnpm workspace、husky、commitlint、Prettier、Markdown lint、AnyBlock 表格列宽、docs-check。

## 目录结构

```text
Python3Docs
├── apps/docs                 # VitePress 文档应用
│   ├── .vitepress            # 站点配置与主题
│   ├── index.md              # 首页
│   ├── intro.md              # 简介
│   └── ...                   # 在此编写 Python 文档
├── .claude/skills            # 表格列宽 / 文档检查脚本
├── .husky                    # 提交钩子
├── scripts/deploy.sh         # 本地部署脚本
└── package.json              # 根命令与工具链
```

## 常用命令

```bash
pnpm install          # 安装依赖
pnpm docs:dev         # 本地开发
pnpm docs:build       # 构建到 apps/docs/.vitepress/dist
pnpm docs:preview     # 预览构建产物
pnpm docs:lint        # Markdown 规范检查
pnpm deploy           # 检查 + 构建 + 推送，触发 GitHub Actions 部署
```

## 编写文档

1. 在 `apps/docs` 下按主题建目录并新增 `.md`。
2. 在 `apps/docs/.vitepress/config.mts` 的 `sidebar` 中登记链接。
3. 提交前 husky 会自动执行 Prettier、表格列宽回写和文档检查。

## 部署

- 仓库：<https://github.com/sentibeitaokong/Python-Docs>
- 站点：<https://sentibeitaokong.github.io/Python-Docs/>
- `base` 为 `/Python-Docs/`，与仓库名保持一致；仓库改名后需同步修改 `apps/docs/.vitepress/config.mts`。

推送 `main` 分支会自动触发 `.github/workflows/deploy.yml` 构建并发布到 GitHub Pages。首次部署前，需要在仓库 **Settings → Pages → Build and deployment → Source** 中选择 **GitHub Actions**（默认的 `GITHUB_TOKEN` 没有创建 Pages 站点的管理员权限，无法由工作流自动开启）。本地也可执行 `pnpm deploy`（会先跑文档检查与构建，再推送当前分支）。
