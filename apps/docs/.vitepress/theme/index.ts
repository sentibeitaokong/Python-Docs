// https://vitepress.dev/guide/custom-theme
import { onMounted, onUnmounted } from 'vue'
import type { Theme } from 'vitepress'
import { onContentUpdated } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
// 引入 Viewer.js 做正文图片放大
import type Viewer from 'viewerjs'
import 'viewerjs/dist/viewer.css'
import './style.css'
import './custom.css'
// AnyBlock 的样式：包的 exports 没有声明 "./styles.css" 子路径，
// 由 .vitepress/config.mts 里的 alias 映射到包内实际文件，
// 不要写死 node_modules 相对路径（安装布局变化时会解析失败）
import 'markdown-it-any-block/styles.css'

export default {
  extends: DefaultTheme,
  setup() {
    // 同一时刻只保留一个实例；只有容器本身被替换（例如首页 ↔ 文档页）时才重建
    let viewer: Viewer | null = null
    let boundContainer: HTMLElement | null = null
    let ViewerConstructor: typeof Viewer | null = null
    // 每次同步自增：动态 import 返回时如果已经被更新的同步取代，就丢弃这次结果，
    // 避免两次初始化并发时把旧实例/旧容器绑上去
    let syncId = 0

    // 选项只能在浏览器里求值：VitePress 构建时会在 SSR 里执行 setup()，
    // 而 markdown-it-any-block 每处理完一个 ```anyblock 代码块就把 global.window 置空，
    // 在 setup 顶层读 window 会让每个页面在构建时抛错并静默渲染成空壳
    // （vitepress build 仍以 0 退出，站点对爬虫来说就是一篇空白）。
    const getViewerOptions = () => ({
      inline: false, // 模态框模式
      button: true, // 显示右上角关闭按钮
      navbar: false, // 隐藏底部的图库缩略图导航 (如果你只需单图放大)
      title: false, // 隐藏图片标题
      toolbar: true, // 显示底部工具栏 (包含放大/缩小/旋转等)
      tooltip: true, // 缩放时显示百分比提示
      movable: true, // 允许拖拽平移
      zoomable: true, // 允许滚轮缩放
      // VitePress 在系统开启「减弱动态效果」时会把所有 transition-duration 归零，
      // Viewer.js 收不到 transitionend 就会永远停在 hiding 状态：遮罩留在页面上
      // 吞掉点击，直到刷新页面。关闭过渡让它走同步隐藏。
      transition: !window.matchMedia('(prefers-reduced-motion: reduce)')
        .matches,
    })

    // Viewer.js 只在构造时记录一次容器里的 <img>，之后不会自动更新。
    // 路由切换、HMR、异步组件渲染都会换掉这些节点；不刷新 images 的话，
    // 点击新节点时 images.indexOf(target) === -1，Viewer 会静默地什么都不做。
    const syncViewer = async () => {
      const id = ++syncId
      const docContainer = document.querySelector<HTMLElement>('.vp-doc')
      if (!docContainer) return

      ViewerConstructor ??= (await import('viewerjs')).default
      if (id !== syncId) return

      // 同一个容器只需要刷新图片列表，重建会白白丢掉已绑定的监听
      if (viewer && boundContainer === docContainer) {
        viewer.update()
        return
      }

      viewer?.destroy()
      // Viewer.js 会自动寻找容器内的所有 img 标签并绑定事件
      viewer = new ViewerConstructor(docContainer, getViewerOptions())
      boundContainer = docContainer
    }

    // 内容更新晚于 onContentUpdated 时（例如组件异步渲染出来的 img）兜底：
    // capture 阶段先刷新一次列表，保证早于 Viewer 绑在容器上的 click 处理
    const handleClick = (event: MouseEvent) => {
      const target = event.target
      if (!boundContainer || !(target instanceof HTMLImageElement)) return
      if (!boundContainer.contains(target)) return
      // Viewer 的 d.ts 没有暴露 images，运行时确实存在
      const boundImages = (
        viewer as (Viewer & { images: HTMLImageElement[] }) | null
      )?.images
      if (!boundImages?.includes(target)) {
        void syncViewer()
      }
    }

    onMounted(() => {
      document.addEventListener('click', handleClick, true)
      const lazySyncViewer = () => void syncViewer()

      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(lazySyncViewer, { timeout: 2000 })
      } else {
        setTimeout(lazySyncViewer, 1000)
      }
    })

    onUnmounted(() => {
      document.removeEventListener('click', handleClick, true)
      viewer?.destroy()
      viewer = null
      boundContainer = null
    })

    // 路由切换 / HMR 后页面内容更新完成（vnode 挂载或更新）时重新同步
    onContentUpdated(() => void syncViewer())
  },
} satisfies Theme
