// 把 Pyodide 运行时从 node_modules 复制到 public/pyodide/。
//
// 为什么不直接从 CDN 加载：运行时约 12 MB，CDN 在部分网络环境下会超时或被拦截，
// 站点自己托管最稳；public/pyodide/ 已加入 .gitignore，构建前自动生成。
import { copyFileSync, existsSync, mkdirSync, statSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const require = createRequire(import.meta.url)

let packageDir
try {
  packageDir = dirname(require.resolve('pyodide/package.json'))
} catch {
  console.error(
    'copy-pyodide: 找不到 pyodide，请先运行 pnpm install（pyodide 已是 devDependency）。',
  )
  process.exit(1)
}

const files = [
  'pyodide.js',
  'pyodide.asm.js',
  'pyodide.asm.wasm',
  'python_stdlib.zip',
  'pyodide-lock.json',
]
const targetDir = join(root, 'apps/docs/public/pyodide')
mkdirSync(targetDir, { recursive: true })

let copied = 0
for (const file of files) {
  const from = join(packageDir, file)
  const to = join(targetDir, file)
  if (!existsSync(from)) {
    console.error(`copy-pyodide: 缺少 ${from}`)
    process.exit(1)
  }
  const unchanged = existsSync(to) && statSync(to).size === statSync(from).size
  if (!unchanged) {
    copyFileSync(from, to)
    copied += 1
  }
}

console.log(
  copied
    ? `copy-pyodide: 已更新 ${copied} 个运行时文件 -> apps/docs/public/pyodide/`
    : 'copy-pyodide: 运行时文件已是最新',
)
