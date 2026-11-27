/*
 * 文档内 Python 编辑器的执行线程。
 *
 * - 运行在 Web Worker 里，死循环不会卡住页面，主线程可以随时 terminate。
 * - Pyodide 从 CDN 懒加载；首次运行需要下载约 10 MB 运行时，之后浏览器会缓存。
 * - 每次运行都使用全新的 globals，代码块之间不会互相污染。
 */

/* global importScripts, loadPyodide */

// 优先用站点自己托管的运行时（scripts/copy-pyodide.mjs 在 dev/build 前复制到
// public/pyodide/），避免 CDN 在部分网络环境下的大文件下载失败；CDN 仅作兜底。
const PYODIDE_BASES = [
  new URL('./pyodide/', self.location.href).href,
  'https://cdn.jsdelivr.net/pyodide/v0.29.5/full/',
]

let pyodidePromise = null
let queue = Promise.resolve()

const post = payload => {
  self.postMessage(payload)
}

const formatError = error => {
  if (error && typeof error.message === 'string') return error.message
  return String(error)
}

/**
 * 首次调用时加载 Pyodide；多个代码块共享同一个运行时。
 * 第一个 CDN 失败（网络、CSP 等）时自动尝试备用地址。
 */
const loadRuntime = id => {
  if (pyodidePromise) return pyodidePromise

  pyodidePromise = (async () => {
    let lastError = null

    for (const base of PYODIDE_BASES) {
      try {
        post({
          id,
          type: 'status',
          text: '正在加载 Python 运行时（首次约 12 MB，请稍候）…',
        })
        importScripts(`${base}pyodide.js`)
        const pyodide = await loadPyodide({ indexURL: base })
        // input() 在文档示例里没有真实输入源，返回空串，避免执行卡住。
        pyodide.setStdin({ stdin: () => '' })
        return pyodide
      } catch (error) {
        lastError = error
      }
    }

    pyodidePromise = null
    throw lastError || new Error('无法加载 Python 运行时')
  })()

  return pyodidePromise
}

const handleRun = async ({ id, code }) => {
  try {
    const pyodide = await loadRuntime(id)
    post({ id, type: 'status', text: '运行中…' })

    // 每次输出都带上本次运行的 id，页面里同时存在多个编辑器时不会串台。
    pyodide.setStdout({
      batched: text => post({ id, type: 'stdout', text }),
    })
    pyodide.setStderr({
      batched: text => post({ id, type: 'stderr', text }),
    })

    // 独立的 globals：每个代码块都从干净环境开始。
    const globals = pyodide.toPy({ __name__: '__main__' })
    try {
      await pyodide.runPythonAsync(code, { globals })
    } finally {
      globals.destroy()
    }
  } catch (error) {
    post({ id, type: 'error', text: formatError(error) })
  } finally {
    post({ id, type: 'done' })
  }
}

// Pyodide 同一时刻只能执行一段代码，用 Promise 链把并发请求排队。
self.onmessage = event => {
  const data = event.data
  if (!data || data.type !== 'run') return
  queue = queue.then(() => handleRun(data)).catch(() => {})
}
