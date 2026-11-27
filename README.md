# Python3Docs

基于 VitePress 的 Python 3 知识体系文档站。文档中的 Python 代码块会渲染成可编辑、可运行的编辑器（CodeMirror + Pyodide），其余工具链包括 pnpm workspace、husky、commitlint、Prettier、Markdown lint、AnyBlock 表格列宽和 docs-check。

## 目录结构

```text
Python3Docs
├── apps/docs                 # VitePress 文档应用
│   ├── .vitepress            # 站点配置与主题
│   ├── index.md              # 首页
│   ├── intro.md              # 学习路线与分类导航
│   ├── pythonBasics/         # 模块：Python 基础语法
│   │   ├── basic/            # 语言基础（6 篇）
│   │   ├── dataStructures/   # 数据结构（5 篇）
│   │   ├── oop/              # 面向对象（5 篇）
│   │   └── functions/        # 函数与迭代（6 篇）
│   └── ...                   # 后续模块，如 frameworks/、advanced/
├── .claude/skills            # 表格列宽 / 文档检查脚本
├── .husky                    # 提交钩子
└── package.json              # 根命令与工具链
```

## 模块与分类

站点按「模块 → 分类 → 页面」组织，后续框架、异步、工程实践等作为独立模块加入。

当前模块 **Python 基础语法**（`apps/docs/pythonBasics/`）：

- **语言基础**：语法与变量、数据类型、运算符与流程控制、字符串、异常处理、模块与包。
- **数据结构**：列表、元组、字典、集合、推导式。
- **面向对象**：类与实例、继承与多态、魔术方法、属性管理与描述符、抽象基类与协议。
- **函数与迭代**：函数基础与参数模型、作用域与闭包、装饰器、迭代器与可迭代对象、生成器、上下文管理器。

## 可运行代码块

- `apps/docs/.vitepress/config.mts` 会把每个 ` ```python ` 代码块渲染成 `<PythonPlayground>` 组件：构建阶段用 Shiki 生成静态高亮 HTML，首屏不加载编辑器；点击代码区（或「编辑」按钮）才动态加载 CodeMirror 6。
- 「运行」由整站单例的 Web Worker 里的 Pyodide 执行，死循环可以用「停止」终止（停止会重启 Worker）。
- 首次运行需要加载约 12 MB 的 Pyodide 运行时，之后使用浏览器缓存。运行时由 `scripts/copy-pyodide.mjs` 从 `node_modules/pyodide` 复制到 `apps/docs/public/pyodide/`，该目录已加入 `.gitignore`。
- `pnpm docs:dev` / `pnpm docs:build` 会自动执行 `pnpm prepare:pyodide`；如果绕过 pnpm 直接运行 `vitepress`，需要先手动执行一次。
- `bash`、`text`、`toml` 等非 Python 代码块保持普通静态展示。

## 常用命令

```bash
pnpm install          # 安装依赖
pnpm docs:dev         # 本地开发
pnpm docs:build       # 构建到 apps/docs/.vitepress/dist
pnpm docs:preview     # 预览构建产物
pnpm docs:lint        # Markdown 规范检查
```

## 编写文档

1. 在 `apps/docs/<模块>/<分类>/` 下新增 `.md`，文件名用 camelCase。
2. 在 `apps/docs/.vitepress/config.mts` 的 `sidebar` 中登记链接。
3. 正常写 ` ```python ` 代码块即可，渲染层会自动把它变成可运行编辑器。
4. 提交前 husky 会自动执行 Prettier、表格列宽回写和文档检查。

## 部署

- 仓库：<https://github.com/sentibeitaokong/Python-Docs>
- 站点：<https://sentibeitaokong.github.io/Python-Docs/>
- `base` 为 `/Python-Docs/`，与仓库名保持一致；仓库改名后需同步修改 `apps/docs/.vitepress/config.mts`。

推送 `main` 分支会自动触发 `.github/workflows/deploy.yml` 构建并发布到 GitHub Pages。首次部署前，需要在仓库 **Settings → Pages → Build and deployment → Source** 中选择 **GitHub Actions**（默认的 `GITHUB_TOKEN` 没有创建 Pages 站点的管理员权限，无法由工作流自动开启）。
