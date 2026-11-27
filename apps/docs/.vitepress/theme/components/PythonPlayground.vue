<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref } from 'vue'
import { runPython, stopPython } from './pyodideClient'

// config.mts 里的 fence 渲染器负责两件事：
// 1. 把源码转成 base64 传进 props（避免换行、引号和 HTML 特殊字符破坏标签）；
// 2. 把 Shiki 生成的高亮 HTML 作为默认插槽传进来。
// 于是首屏只是一段静态高亮代码（可被爬虫和搜索读到），
// 用户点击代码区后才动态加载 CodeMirror，覆盖成可编辑的编辑器。
const props = defineProps<{ code: string }>()

const initialCode = decodeBase64(props.code)
const code = ref(initialCode)
const mode = ref<'static' | 'editor'>('static')
const loadingEditor = ref(false)
const running = ref(false)
const status = ref('')
const stdout = ref('')
const stderr = ref('')
const error = ref('')

const editorHost = ref<HTMLElement | null>(null)
let view: import('codemirror').EditorView | null = null
let stopped = false
let runStartedAt = 0

function decodeBase64(value: string): string {
  try {
    const binary = atob(value)
    const bytes = Uint8Array.from(binary, char => char.charCodeAt(0))
    return new TextDecoder().decode(bytes)
  } catch {
    return ''
  }
}

function appendOutput(target: typeof stdout, text: string) {
  target.value += text.endsWith('\n') ? text : `${text}\n`
}

function clearOutput() {
  stdout.value = ''
  stderr.value = ''
  error.value = ''
  status.value = ''
}

function reset() {
  if (view) {
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: initialCode },
    })
  }
  code.value = initialCode
  clearOutput()
}

async function copy() {
  try {
    await navigator.clipboard.writeText(code.value)
    status.value = '已复制到剪贴板'
  } catch {
    status.value = '复制失败，请手动选择代码'
  }
}

/**
 * 按需把静态代码块替换成 CodeMirror 编辑器。
 * 动态 import 的 chunk 只会加载一次，之后同一页面的其它代码块点击时直接复用。
 */
async function activateEditor() {
  if (mode.value === 'editor') {
    view?.focus()
    return
  }
  if (loadingEditor.value) return

  loadingEditor.value = true
  try {
    const [{ EditorView, basicSetup }, { python }, { oneDark }] =
      await Promise.all([
        import('codemirror'),
        import('@codemirror/lang-python'),
        import('@codemirror/theme-one-dark'),
      ])

    mode.value = 'editor'
    // 等 v-if 把编辑器的挂载点渲染出来再创建 EditorView
    await nextTick()
    if (!editorHost.value) return

    view = new EditorView({
      doc: code.value,
      extensions: [
        basicSetup,
        python(),
        oneDark,
        // 代码块整体是深色的，编辑器沿用 #0d1117，和站点代码块一致。
        EditorView.theme(
          {
            '&': {
              backgroundColor: '#0d1117',
              color: '#c9d1d9',
              fontSize: '13px',
            },
            '.cm-scroller': {
              fontFamily: 'var(--vp-font-family-mono)',
              lineHeight: '1.65',
            },
            '.cm-gutters': {
              backgroundColor: '#0d1117',
              color: 'rgba(255, 255, 255, 0.35)',
              border: 'none',
            },
            '.cm-activeLine': {
              backgroundColor: 'rgba(110, 118, 129, 0.2)',
            },
            '.cm-activeLineGutter': {
              backgroundColor: 'transparent',
            },
            '&.cm-focused': { outline: 'none' },
          },
          { dark: true },
        ),
        EditorView.updateListener.of(update => {
          if (update.docChanged) code.value = update.state.doc.toString()
        }),
      ],
      parent: editorHost.value,
    })
    view.focus()
  } catch {
    status.value = '编辑器加载失败，代码仍可查看和复制'
  } finally {
    loadingEditor.value = false
  }
}

/** 点击静态代码区进入编辑；用户正在框选文字（想复制）时不打断。 */
function handleStaticClick() {
  const selection = window.getSelection()
  if (selection && !selection.isCollapsed) return
  void activateEditor()
}

async function run() {
  if (running.value) return
  stopped = false
  running.value = true
  clearOutput()
  status.value = '正在连接 Python 运行时…'
  runStartedAt = performance.now()

  try {
    await runPython(code.value, {
      onStatus: text => {
        if (!stopped) status.value = text
      },
      onStdout: text => appendOutput(stdout, text),
      onStderr: text => appendOutput(stderr, text),
    })

    if (!stopped) {
      status.value = `运行完成 · ${Math.round(performance.now() - runStartedAt)} ms`
    }
  } catch (reason) {
    if (!stopped) {
      error.value = reason instanceof Error ? reason.message : String(reason)
      status.value = '运行失败'
    }
  } finally {
    running.value = false
  }
}

function stop() {
  stopped = true
  stopPython()
  running.value = false
  status.value = '已停止'
}

onBeforeUnmount(() => {
  view?.destroy()
  view = null
})
</script>

<template>
  <div class="py-playground">
    <div class="py-playground__toolbar">
      <span class="py-playground__label">Python · 可运行</span>
      <div class="py-playground__actions">
        <button
          type="button"
          class="py-playground__button"
          title="复制代码"
          @click="copy"
        >
          复制
        </button>
        <button
          v-if="mode === 'static'"
          type="button"
          class="py-playground__button"
          title="加载编辑器（也可以直接点击代码区）"
          :disabled="loadingEditor"
          @click="activateEditor"
        >
          {{ loadingEditor ? '加载中…' : '编辑' }}
        </button>
        <button
          type="button"
          class="py-playground__button"
          title="恢复为示例代码"
          :disabled="running"
          @click="reset"
        >
          重置
        </button>
        <button
          v-if="running"
          type="button"
          class="py-playground__button py-playground__button--stop"
          title="终止运行"
          @click="stop"
        >
          停止
        </button>
        <button
          v-else
          type="button"
          class="py-playground__button py-playground__button--run"
          title="运行这段 Python 代码"
          @click="run"
        >
          运行
        </button>
      </div>
    </div>

    <!--
      静态模式：直接用构建阶段 Shiki 产出的高亮 HTML（默认插槽），
      首屏不加载任何编辑器；点击后切换到下方的 CodeMirror。
    -->
    <div
      v-if="mode === 'static'"
      class="py-playground__static"
      @click="handleStaticClick"
      @keydown.enter.prevent="activateEditor"
    >
      <slot />
      <span class="py-playground__hint" aria-hidden="true">点击编辑</span>
    </div>
    <div v-else ref="editorHost" class="py-playground__editor"></div>

    <div
      v-if="status || stdout || stderr || error"
      class="py-playground__result"
      aria-live="polite"
    >
      <div class="py-playground__result-head">
        <span>{{ status || '输出' }}</span>
        <button
          v-if="stdout || stderr || error"
          type="button"
          class="py-playground__clear"
          @click="clearOutput"
        >
          清空
        </button>
      </div>
      <pre v-if="stdout" class="py-playground__stdout">{{ stdout }}</pre>
      <pre v-if="stderr" class="py-playground__stderr">{{ stderr }}</pre>
      <pre v-if="error" class="py-playground__error">{{ error }}</pre>
    </div>
  </div>
</template>

<style scoped>
.py-playground {
  margin: 16px 0;
  overflow: hidden;
  background: #0d1117;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
}

.py-playground__toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  justify-content: space-between;
  padding: 7px 12px;
  background: #161b22;
  border-bottom: 1px solid #30363d;
}

.py-playground__label {
  font-family: var(--vp-font-family-mono);
  font-size: 12px;
  color: #a78bfa;
  letter-spacing: 0.02em;
}

.py-playground__actions {
  display: flex;
  gap: 6px;
  align-items: center;
}

.py-playground__button {
  padding: 3px 10px;
  font-size: 12px;
  line-height: 1.6;
  color: #c9d1d9;
  cursor: pointer;
  background: transparent;
  border: 1px solid #30363d;
  border-radius: 6px;
  transition:
    color 0.2s,
    border-color 0.2s,
    background 0.2s;
}

.py-playground__button:hover:not(:disabled) {
  color: #f5f3ff;
  background: #21262d;
  border-color: #8b5cf6;
}

.py-playground__button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.py-playground__button--run {
  color: #0d1117;
  background: #a78bfa;
  border-color: #a78bfa;
}

.py-playground__button--run:hover:not(:disabled) {
  color: #0d1117;
  background: #c4b5fd;
  border-color: #c4b5fd;
}

.py-playground__button--stop {
  color: #ff7b72;
  border-color: #ff7b72;
}

/* ── 静态高亮代码（构建阶段 Shiki 产物）───────────────── */

.py-playground__static {
  position: relative;
  cursor: text;
}

.py-playground__static :deep(pre) {
  margin: 0;
  padding: 14px 16px;
  overflow-x: auto;
  font-family: var(--vp-font-family-mono);
  font-size: 13px;
  line-height: 1.65;
  background: transparent;
  tab-size: 4;
}

.py-playground__static :deep(code) {
  display: block;
  width: fit-content;
  min-width: 100%;
  font-family: inherit;
  font-size: inherit;
  line-height: inherit;
  white-space: pre;
}

.py-playground__static :deep(.line) {
  display: inline;
}

.py-playground__hint {
  position: absolute;
  top: 8px;
  right: 10px;
  padding: 1px 8px;
  font-size: 11px;
  line-height: 1.6;
  color: #c4b5fd;
  pointer-events: none;
  background: rgba(139, 92, 246, 0.16);
  border: 1px solid rgba(139, 92, 246, 0.42);
  border-radius: 999px;
  opacity: 0;
  transition: opacity 0.2s;
}

.py-playground__static:hover .py-playground__hint {
  opacity: 1;
}

/* ── CodeMirror 编辑器 ─────────────────────────────── */

.py-playground__editor :deep(.cm-editor) {
  background: #0d1117;
}

.py-playground__editor :deep(.cm-scroller) {
  max-height: 480px;
  overflow: auto;
  font-family: var(--vp-font-family-mono);
  font-size: 13px;
  line-height: 1.65;
}

.py-playground__editor :deep(.cm-content) {
  padding: 10px 0;
}

.py-playground__editor :deep(.cm-gutters) {
  background: #0d1117;
  border-right: 1px solid #30363d;
}

.py-playground__editor :deep(.cm-gutters::-webkit-scrollbar),
.py-playground__editor :deep(.cm-scroller::-webkit-scrollbar) {
  width: 4px;
  height: 4px;
}

.py-playground__editor :deep(.cm-scroller::-webkit-scrollbar-thumb) {
  background: #8b5cf6;
  border-radius: 2px;
}

/* ── 运行结果 ─────────────────────────────────────── */

.py-playground__result {
  background: #0d1117;
  border-top: 1px solid #30363d;
}

.py-playground__result-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 12px;
  font-family: var(--vp-font-family-mono);
  font-size: 12px;
  color: rgba(255, 255, 255, 0.56);
  border-bottom: 1px solid #21262d;
}

.py-playground__clear {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.56);
  cursor: pointer;
  background: transparent;
  border: 0;
}

.py-playground__clear:hover {
  color: #f5f3ff;
}

.py-playground__stdout,
.py-playground__stderr,
.py-playground__error {
  padding: 10px 12px;
  margin: 0;
  overflow: auto;
  font-family: var(--vp-font-family-mono);
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.py-playground__stdout {
  color: #c9d1d9;
}

.py-playground__stderr,
.py-playground__error {
  color: #ff7b72;
  border-top: 1px dashed #30363d;
}
</style>
