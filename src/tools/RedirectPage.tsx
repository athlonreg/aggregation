import { ExternalLink, ShieldAlert } from 'lucide-react'

function getTargetUrl(): string {
  const hash = window.location.hash.slice(1) // remove leading #
  return hash ? decodeURIComponent(hash) : ''
}

export default function RedirectPage() {
  const targetUrl = getTargetUrl()

  if (!targetUrl) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center text-gray-400">无效的链接</div>
      </div>
    )
  }

  let displayUrl = targetUrl
  let isValid = true
  try {
    const u = new URL(targetUrl)
    displayUrl = u.hostname + u.pathname + u.search
  } catch {
    isValid = false
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-lg p-6">
        <div className="flex items-center justify-center w-14 h-14 rounded-full bg-blue-50 dark:bg-blue-900/30 mx-auto mb-4">
          <ShieldAlert size={28} className="text-blue-500" />
        </div>

        <h1 className="text-lg font-bold text-center text-gray-900 dark:text-white mb-2">链接安全提示</h1>
        <p className="text-sm text-center text-gray-500 dark:text-gray-400 mb-5">您即将访问以下地址，请确认是否安全</p>

        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 mb-5 break-all">
          <span className="text-sm font-mono text-gray-700 dark:text-gray-300">{displayUrl}</span>
        </div>

        <div className="flex flex-col gap-2">
          <a
            href={isValid ? targetUrl : `https://${targetUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition-colors"
          >
            <ExternalLink size={16} /> 继续访问
          </a>
          <a
            href="/"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 text-sm font-medium transition-colors"
          >
            返回首页
          </a>
        </div>

        <p className="text-xs text-center text-gray-400 mt-4">如果该链接不是您预期的，请勿继续访问</p>
      </div>
    </div>
  )
}
