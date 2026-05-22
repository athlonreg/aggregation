import { useState, useRef, useCallback } from 'react'
import ToolShell, { Section, TextareaWithCopy, ActionButton, Select, TextInput } from '../components/ToolShell'
import { Copy, Download, Upload, X } from 'lucide-react'

interface ApiResponse {
  status: number
  statusText: string
  headers: Record<string, string>
  body: string
  bodyBlob?: Blob
  time: number
  fileName?: string
}

function parseHeaders(raw: string): Record<string, string> {
  const h: Record<string, string> = {}
  if (!raw.trim()) return h
  raw.split('\n').forEach(line => {
    const idx = line.indexOf(':')
    if (idx > 0) h[line.slice(0, idx).trim()] = line.slice(idx + 1).trim()
  })
  return h
}

function buildCurl(method: string, url: string, headers: string, body: string, file?: File | null): string {
  const parts = ['curl']
  if (method !== 'GET') parts.push(`-X ${method}`)
  parts.push(`'${url}'`)
  if (headers.trim()) {
    headers.split('\n').forEach(line => {
      const idx = line.indexOf(':')
      if (idx > 0) {
        const k = line.slice(0, idx).trim()
        const v = line.slice(idx + 1).trim()
        parts.push(`-H '${k}: ${v}'`)
      }
    })
  }
  if (file) {
    parts.push(`-F 'file=@${file.name}'`)
  } else if (body.trim() && ['POST', 'PUT', 'PATCH'].includes(method)) {
    const escaped = body.replace(/'/g, "'\\''")
    parts.push(`-d '${escaped}'`)
  }
  return parts.join(' \\\n  ')
}

function extractFileName(headers: Record<string, string>): string | undefined {
  const cd = headers['content-disposition'] || headers['Content-Disposition']
  if (cd) {
    const m = cd.match(/filename\*?=(?:UTF-8''|")?([^";]+)/i)
    if (m) return decodeURIComponent(m[1].replace(/"/g, ''))
  }
  return undefined
}

function guessFileName(url: string, headers: Record<string, string>): string {
  const fromHeader = extractFileName(headers)
  if (fromHeader) return fromHeader
  try {
    const path = new URL(url).pathname
    const last = path.split('/').filter(Boolean).pop()
    if (last && last.includes('.')) return last
  } catch { /* ignore */ }
  return 'download'
}

export default function ApiTester() {
  const [method, setMethod] = useState('GET')
  const [url, setUrl] = useState('https://httpbin.org/get')
  const [headers, setHeaders] = useState('')
  const [body, setBody] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [bodyMode, setBodyMode] = useState<'text' | 'file'>('text')
  const [response, setResponse] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [curlCopied, setCurlCopied] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) setFile(f)
  }, [])

  const removeFile = useCallback(() => {
    setFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [])

  const handleSend = async () => {
    setLoading(true)
    setError('')
    setResponse(null)
    const start = performance.now()

    try {
      const reqHeaders = parseHeaders(headers)

      const opts: RequestInit = { method, headers: reqHeaders }
      let sendBody: string | FormData | undefined

      if (['POST', 'PUT', 'PATCH'].includes(method)) {
        if (bodyMode === 'file' && file) {
          const formData = new FormData()
          formData.append('file', file)
          sendBody = formData
          // Remove content-type so browser sets boundary automatically
          delete reqHeaders['Content-Type']
          delete reqHeaders['content-type']
        } else if (body.trim()) {
          sendBody = body
        }
        if (sendBody) opts.body = sendBody
      }

      const res = await fetch(url, opts)
      const elapsed = Math.round(performance.now() - start)

      const resHeaders: Record<string, string> = {}
      res.headers.forEach((v, k) => { resHeaders[k] = v })

      const ct = resHeaders['content-type'] || resHeaders['Content-Type'] || ''
      const isBinary = ct.includes('octet-stream') ||
        ct.includes('application/pdf') ||
        ct.includes('application/zip') ||
        ct.includes('image/') ||
        ct.includes('application/gzip') ||
        ct.includes('application/x-tar')

      let bodyText = ''
      let bodyBlob: Blob | undefined
      let fileName: string | undefined

      if (isBinary) {
        bodyBlob = await res.blob()
        bodyText = `[Binary file: ${bodyBlob.size} bytes, ${ct}]`
        fileName = guessFileName(url, resHeaders)
      } else {
        bodyText = await res.text()
      }

      setResponse({
        status: res.status,
        statusText: res.statusText,
        headers: resHeaders,
        body: bodyText,
        bodyBlob,
        time: elapsed,
        fileName,
      })
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const handleCopyCurl = () => {
    const cmd = buildCurl(method, url, headers, body, bodyMode === 'file' ? file : null)
    navigator.clipboard.writeText(cmd)
    setCurlCopied(true)
    setTimeout(() => setCurlCopied(false), 1500)
  }

  const handleDownload = () => {
    if (!response?.bodyBlob) return
    const a = document.createElement('a')
    a.href = URL.createObjectURL(response.bodyBlob)
    a.download = response.fileName || 'download'
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const formatResponseBody = (text: string): string => {
    try { return JSON.stringify(JSON.parse(text), null, 2) }
    catch { return text }
  }

  const showBody = ['POST', 'PUT', 'PATCH'].includes(method)

  return (
    <ToolShell title="API 测试" description="发送 HTTP 请求、上传文件、下载响应、复制为 cURL">
      <Section title="请求">
        <div className="flex flex-wrap gap-3 items-end mb-3">
          <Select value={method} onChange={setMethod} options={[
            { value: 'GET', label: 'GET' },
            { value: 'POST', label: 'POST' },
            { value: 'PUT', label: 'PUT' },
            { value: 'PATCH', label: 'PATCH' },
            { value: 'DELETE', label: 'DELETE' },
            { value: 'HEAD', label: 'HEAD' },
            { value: 'OPTIONS', label: 'OPTIONS' },
          ]} />
          <div className="flex-1 min-w-48">
            <TextInput value={url} onChange={setUrl} placeholder="https://api.example.com/endpoint" />
          </div>
          <ActionButton onClick={handleSend} disabled={loading}>
            {loading ? '发送中...' : '发送'}
          </ActionButton>
          <button
            onClick={handleCopyCurl}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
            title="复制为 cURL"
          >
            {curlCopied ? <Copy size={14} className="text-green-500" /> : <Copy size={14} />}
            cURL
          </button>
        </div>

        <TextareaWithCopy
          value={headers}
          onChange={setHeaders}
          placeholder="Content-Type: application/json\nAuthorization: Bearer token"
          label="请求头 (每行一个)"
          rows={3}
        />

        {showBody && (
          <div className="mt-3">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">请求体</span>
              <div className="flex rounded-lg border border-gray-300 dark:border-gray-700 overflow-hidden text-xs">
                <button
                  onClick={() => setBodyMode('text')}
                  className={`px-3 py-1 ${bodyMode === 'text'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  文本
                </button>
                <button
                  onClick={() => setBodyMode('file')}
                  className={`px-3 py-1 ${bodyMode === 'file'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  文件
                </button>
              </div>
            </div>

            {bodyMode === 'text' ? (
              <TextareaWithCopy
                value={body}
                onChange={setBody}
                placeholder={'{"key": "value"}'}
                rows={4}
              />
            ) : (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                {file ? (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <Upload size={16} className="text-gray-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{file.name}</div>
                      <div className="text-xs text-gray-500">{file.type || 'application/octet-stream'} &middot; {(file.size / 1024).toFixed(1)} KB</div>
                    </div>
                    <button onClick={removeFile} className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400">
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full p-6 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg hover:border-blue-400 dark:hover:border-blue-600 transition-colors text-center"
                  >
                    <Upload size={24} className="mx-auto mb-2 text-gray-400" />
                    <div className="text-sm text-gray-500">点击选择文件，或拖拽到此处</div>
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </Section>

      {error && <div className="text-sm text-red-500 whitespace-pre-line">{error}</div>}

      {response && (
        <Section title="响应">
          <div className="flex flex-wrap items-center gap-4 mb-3 text-sm">
            <span className={`font-medium ${response.status < 400 ? 'text-green-600' : 'text-red-500'}`}>
              {response.status} {response.statusText}
            </span>
            <span className="text-gray-500">{response.time}ms</span>
            <span className="text-gray-500">{response.bodyBlob ? response.bodyBlob.size.toLocaleString() : response.body.length.toLocaleString()} bytes</span>
            {response.bodyBlob && (
              <button
                onClick={handleDownload}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
              >
                <Download size={14} />
                下载 {response.fileName || '文件'}
              </button>
            )}
          </div>

          <div className="mb-3">
            <div className="text-xs font-medium text-gray-500 mb-1">响应头</div>
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-xs font-mono max-h-32 overflow-y-auto">
              {Object.entries(response.headers).map(([k, v]) => (
                <div key={k} className="text-gray-600 dark:text-gray-400">
                  <span className="text-gray-900 dark:text-white">{k}</span>: {v}
                </div>
              ))}
            </div>
          </div>

          {response.bodyBlob ? (
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
              <Download size={32} className="mx-auto mb-2 text-gray-400" />
              <div className="text-sm text-gray-600 dark:text-gray-400">{response.body}</div>
              <button
                onClick={handleDownload}
                className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-blue-500 hover:bg-blue-600 text-white transition-colors"
              >
                <Download size={16} />
                下载文件
              </button>
            </div>
          ) : (
            <TextareaWithCopy value={formatResponseBody(response.body)} readOnly label="响应体" rows={12} />
          )}
        </Section>
      )}
    </ToolShell>
  )
}
