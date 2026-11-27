import type { DefaultTheme, UserConfigFn } from 'vitepress'
import lightbox from 'vitepress-plugin-lightbox'
import { withMermaid } from 'vitepress-mermaid-viewer'
import footnote from 'markdown-it-footnote'
import taskLists from 'markdown-it-task-lists'
import { ab_mdit, jsdom_init } from 'markdown-it-any-block/node'
import { createRequire } from 'node:module'
import path from 'path'

const require = createRequire(import.meta.url)

// markdown-it-any-block 的 exports 没有暴露 ./styles.css，
// 通过包入口反推包根目录，避免写死 node_modules 的相对路径
// （hoisted 与 isolated 两种安装布局下 node_modules 结构不同）
const anyBlockStyles = path.resolve(
  path.dirname(require.resolve('markdown-it-any-block')),
  '../styles.css',
)

// https://vitepress.dev/reference/site-config
const config: UserConfigFn<DefaultTheme.Config> = async () => {
  // AnyBlock 需要在任何 markdown 渲染之前建好 jsdom 环境（内部分支里有 await import('jsdom')，
  // 上游 demo 那种不 await 的写法存在竞态）
  await jsdom_init()

  // jsdom_init() 会把 window/document 等挂到全局，只有真正处理 AnyBlock 代码块时才
  // enable/disable。空站点一开始没有任何 AnyBlock 块，这些全局对象就会一直存在，
  // 而 VitePress 用 `typeof document !== 'undefined'` 判断是否在浏览器里，
  // 于是 SSR 阶段误访问 location 直接崩溃。初始化完成立刻还原；
  // 后续每个 AnyBlock 块渲染时插件仍会自行 enable/disable。
  for (const key of [
    'Storage',
    'window',
    'history',
    'document',
    'Node',
    'NodeList',
    'HTMLElement',
    'HTMLDivElement',
    'HTMLPreElement',
    'HTMLQuoteElement',
    'HTMLTableElement',
    'HTMLUListElement',
    'HTMLScriptElement',
    'MutationObserver',
  ]) {
    delete (globalThis as Record<string, unknown>)[key]
  }

  // 部署到 GitHub Pages 项目页时，base 必须与仓库名一致（形如 '/仓库名/'）；
  // 当前仓库为 github.com/sentibeitaokong/Python-Docs，因此 base 为 '/Python-Docs/'。
  // 如果只在本机看文档，可以改成 '/'。
  const base = '/Python-Docs/'

  return withMermaid({
    lang: 'zh-CN',
    vite: {
      optimizeDeps: {
        include: ['viewerjs', 'mermaid'],
      },
      resolve: {
        alias: {
          // AnyBlock 的 exports 只声明了 "." 和 "./node"，裸导入子路径会被拒绝，
          // 这里显式映射到包内实际文件
          'markdown-it-any-block/styles.css': anyBlockStyles,
        },
      },
    },
    mermaid: {
      startOnLoad: false,
      securityLevel: 'loose',
    },
    mermaidPlugin: {
      class: 'mermaid',
    },
    base,
    title: 'Python 3 知识体系',
    description: 'Python 3 学习笔记与知识体系',
    // 首屏优化：withMermaid 把 <Mermaid> 静态挂进了 app 入口，VitePress 会把
    // app chunk 的 dynamicImports 一并写成 modulepreload，于是每个页面（含首页）都以
    // 高优先级预取 ~600KB 的 mermaid.core，真正带图表的页面只有少数。
    // transformHead 删不掉 VitePress 预生成的 link（只会被 mergeHead 合并回来），
    // 这里直接从 HTML 里删掉。
    transformHtml(html) {
      return html.replace(
        /\s*<link rel="modulepreload" href="[^"]*(?:mermaid\.core|virtual_mermaid-config)[^"]*\.js">/g,
        '',
      )
    },
    cleanUrls: true, //生成简洁的url
    // 🚨 2. 必须配置 markdown 字段
    markdown: {
      theme: {
        light: 'github-dark',
        dark: 'github-dark',
      },
      // 首屏优化：正文图片大多在首屏之外，默认 eager 会让一篇文章的所有 PNG
      // 跟首屏资源抢带宽。浏览器对 loading="lazy" 的图片在进入视口时仍会立即加载，
      // 首屏内的图不受影响。
      image: {
        lazyLoading: true,
      },
      // Shiki 内置的 plaintext 语法不产出任何 token，text 代码块会退化成单一前景色。
      // 给目录树、忽略清单注册别名并借用 yaml 的着色规则，让它们也有颜色；
      // 别名不能覆盖内置语言（text / txt 本身就是 plaintext 的别名），所以要使用新名字。
      languageAlias: {
        tree: 'yaml',
        gitignore: 'yaml',
      },
      config(md: any) {
        md.use(lightbox, {}) //图片放大
        md.use(taskLists, { enabled: true }) //任务列表
        md.use(footnote) //论文索引
        md.use(ab_mdit) //AnyBlock：表格列宽 [width(30,70)]、列表转表格等

        // 所有 ```python 代码块都渲染成可编辑、可运行的 Python 编辑器。
        // 代码用 base64 塞进 props，避免换行、引号和 HTML 特殊字符破坏标签；
        // 组件在客户端挂载后懒加载 CodeMirror，点击「运行」时才加载 Pyodide。
        // bash / text 等非 Python 代码块保持原样。
        const renderFence = md.renderer.rules.fence
        md.renderer.rules.fence = (tokens, idx, options, env, self) => {
          const token = tokens[idx]
          const lang = token.info.trim().split(/\s+/)[0]
          if (lang === 'python') {
            const code = Buffer.from(token.content, 'utf8').toString('base64')
            return `<PythonPlayground code="${code}"></PythonPlayground>\n`
          }
          return renderFence
            ? renderFence(tokens, idx, options, env, self)
            : self.renderToken(tokens, idx, options)
        }
      },
    },
    themeConfig: {
      lastUpdated: {
        text: '最后更新于', //自定义名称
        formatOptions: {
          dateStyle: 'full',
          timeStyle: 'medium',
        },
      }, //显示最后更新时间
      // 在导航栏右侧显示 GitHub 图标，点击跳转到仓库首页
      socialLinks: [
        {
          icon: 'github',
          link: 'https://github.com/sentibeitaokong/Python-Docs',
          ariaLabel: 'GitHub 仓库',
        },
      ],
      editLink: {
        pattern:
          'https://github.com/sentibeitaokong/Python-Docs/edit/main/apps/docs/:path',
        text: '为此页提供修改建议',
      },
      search: {
        provider: 'local',
        options: {
          translations: {
            button: {
              buttonText: '搜索文档',
              buttonAriaLabel: '搜索文档',
            },
            modal: {
              noResultsText: '无法找到相关结果',
              resetButtonTitle: '清除查询条件',
              resetButtonAriaLabel: '清除查询条件',
              cancelButtonText: '取消',
              cancelButtonAriaLabel: '取消',
              footer: {
                selectText: '选择',
                navigateText: '切换',
                closeText: '关闭',
              },
            },
          },
        },
      }, //内置本地搜索，无需额外的 Algolia 索引
      lightModeSwitchTitle: '切换到白天主题', //用于自定义悬停时显示的浅色模式开关标题。
      darkModeSwitchTitle: '切换到黑夜主题', //用于自定义悬停时显示的深色模式开关标题。
      langMenuLabel: '切换语言',
      outline: {
        level: [2, 4],
        label: '页面导航',
      },
      // 修改页面底部导航链接的文本
      docFooter: {
        prev: '上一页：', // 修改“上一篇”按钮的引导文本
        next: '下一页：', // 修改“下一篇”按钮的引导文本
      },
      nav: [
        { text: '简介', link: '/intro' },
        { text: '基础语法', link: '/pythonBasics/basic/syntaxAndVariables' },
        {
          text: '相关链接',
          items: [
            {
              text: 'Python 官方文档（中文）',
              link: 'https://docs.python.org/zh-cn/3/',
            },
            {
              text: 'Python 官方教程',
              link: 'https://docs.python.org/zh-cn/3/tutorial/',
            },
            {
              text: 'PEP 索引',
              link: 'https://peps.python.org/',
            },
          ],
        },
      ],

      // 新增文档后，在这里登记目录和链接即可出现在侧边栏。
      // 数组顺序就是显示顺序；link 带前导斜杠、不带 .md。
      sidebar: [
        {
          text: '开始',
          collapsed: false,
          items: [{ text: 'Python 3 知识体系', link: '/intro' }],
        },
        {
          text: 'Python 基础语法',
          collapsed: false,
          items: [
            {
              text: '语言基础',
              collapsed: false,
              items: [
                {
                  text: '语法与变量',
                  link: '/pythonBasics/basic/syntaxAndVariables',
                },
                { text: '数据类型', link: '/pythonBasics/basic/dataTypes' },
                {
                  text: '运算符与流程控制',
                  link: '/pythonBasics/basic/operatorsAndControlFlow',
                },
                { text: '字符串', link: '/pythonBasics/basic/strings' },
                { text: '异常处理', link: '/pythonBasics/basic/exceptions' },
                {
                  text: '模块与包',
                  link: '/pythonBasics/basic/modulesAndPackages',
                },
              ],
            },
            {
              text: '数据结构',
              collapsed: false,
              items: [
                { text: '列表', link: '/pythonBasics/dataStructures/list' },
                { text: '元组', link: '/pythonBasics/dataStructures/tuple' },
                { text: '字典', link: '/pythonBasics/dataStructures/dict' },
                { text: '集合', link: '/pythonBasics/dataStructures/set' },
                {
                  text: '推导式',
                  link: '/pythonBasics/dataStructures/comprehensions',
                },
              ],
            },
            {
              text: '面向对象',
              collapsed: false,
              items: [
                {
                  text: '类与实例',
                  link: '/pythonBasics/oop/classesAndInstances',
                },
                { text: '继承与多态', link: '/pythonBasics/oop/inheritance' },
                { text: '魔术方法', link: '/pythonBasics/oop/magicMethods' },
                {
                  text: '属性管理与描述符',
                  link: '/pythonBasics/oop/propertiesAndDescriptors',
                },
                {
                  text: '抽象基类与协议',
                  link: '/pythonBasics/oop/abcAndProtocols',
                },
              ],
            },
            {
              text: '函数与迭代',
              collapsed: false,
              items: [
                {
                  text: '函数基础与参数模型',
                  link: '/pythonBasics/functions/functionBasics',
                },
                {
                  text: '作用域与闭包',
                  link: '/pythonBasics/functions/closures',
                },
                { text: '装饰器', link: '/pythonBasics/functions/decorators' },
                {
                  text: '迭代器与可迭代对象',
                  link: '/pythonBasics/functions/iterators',
                },
                { text: '生成器', link: '/pythonBasics/functions/generators' },
                {
                  text: '上下文管理器',
                  link: '/pythonBasics/functions/contextManagers',
                },
              ],
            },
          ],
        },
      ],
    },
  })
}

export default config
