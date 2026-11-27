# Python 3 知识体系

这是新建的 Python 3 文档站，构建方式、主题、Markdown 扩展和提交检查都沿用原前端文档站的配置，文档内容从零开始编写。

## 目录约定

所有页面放在 `apps/docs` 下，一个主题一个目录：

```text
apps/docs
├── index.md            # 首页（layout: home）
├── intro.md            # 本页
├── basic/              # 语言基础
├── dataStructures/     # 数据结构
├── advanced/           # 进阶主题
└── practice/           # 工程实践
```

## 新增一篇文档

1. 在对应目录下新建 `.md` 文件，例如 `apps/docs/basic/variables.md`。
2. 在 `apps/docs/.vitepress/config.mts` 的 `sidebar` 中登记标题和链接 `/basic/variables`。
3. 运行 `pnpm docs:dev` 预览，`pnpm docs:build` 检查构建。

## 可用的 Markdown 能力

| 能力           | 写法                                   |
| -------------- | -------------------------------------- |
| 代码组标签页   | `:::code-group`                        |
| 提示容器       | `::: tip`、`::: warning`、`::: danger` |
| Mermaid 流程图 | ` ```mermaid `                         |
| 任务列表       | `- [ ]`、`- [x]`                       |
| 脚注           | `[^1]`                                 |
| 表格列宽       | AnyBlock 的 `[width(30,70)]`           |

表格列宽会在提交时由 `table-width` 脚本自动测量并回写；文档链接、代码块语法和中文引号由 `docs-check` 在提交前检查。
