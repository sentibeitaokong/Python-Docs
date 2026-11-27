// 与 public/pyodide-worker.js 通信的极薄客户端。
// 整个站点共用一个 Worker，运行时只加载一次；多个编辑器同时运行时由 Worker 排队。

type RunHandlers = {
  onStatus?: (text: string) => void
  onStdout?: (text: string) => void
  onStderr?: (text: string) => void
}

type PendingRun = RunHandlers & {
  error?: string
  resolve: () => void
  reject: (error: Error) => void
}

let worker: Worker | null = null
let workerPromise: Promise<Worker> | null = null
let nextId = 1
const pending = new Map<number, PendingRun>()

function createWorker(): Worker {
  // public/ 下的文件不参与打包，路径必须带上站点 base。
  const base = import.meta.env.BASE_URL || '/'
  const instance = new Worker(`${base}pyodide-worker.js`)

  instance.onmessage = (event: MessageEvent) => {
    const data = event.data
    if (!data || typeof data !== 'object') return
    const run = pending.get(data.id)
    if (!run) return

    if (data.type === 'status') {
      run.onStatus?.(data.text)
      return
    }
    if (data.type === 'stdout') {
      run.onStdout?.(data.text)
      return
    }
    if (data.type === 'stderr') {
      run.onStderr?.(data.text)
      return
    }
    if (data.type === 'error') {
      run.error = data.text
      return
    }
    if (data.type === 'done') {
      pending.delete(data.id)
      if (run.error) {
        run.reject(new Error(run.error))
      } else {
        run.resolve()
      }
    }
  }

  instance.onerror = (event: ErrorEvent) => {
    const error = new Error(event.message || 'Python 运行时加载失败')
    for (const run of pending.values()) run.reject(error)
    pending.clear()
    instance.terminate()
    worker = null
    workerPromise = null
  }

  return instance
}

function getWorker(): Promise<Worker> {
  workerPromise ??= Promise.resolve().then(() => {
    worker = createWorker()
    return worker
  })
  return workerPromise
}

export async function runPython(
  code: string,
  handlers: RunHandlers = {},
): Promise<void> {
  const instance = await getWorker()
  const id = nextId++

  return new Promise<void>((resolve, reject) => {
    pending.set(id, { ...handlers, resolve, reject })
    instance.postMessage({ id, type: 'run', code })
  })
}

/** 终止运行时。死循环或加载过慢时由「停止」按钮调用。 */
export function stopPython(): void {
  const error = new Error('已停止')
  for (const run of pending.values()) run.reject(error)
  pending.clear()

  worker?.terminate()
  worker = null
  workerPromise = null
}
