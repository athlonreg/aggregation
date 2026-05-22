import { useState, useCallback, useRef } from 'react'
import ToolShell, { Section, ActionButton, TextInput, Select } from '../components/ToolShell'
import { Play, Clock, CheckCircle, XCircle, Loader2, Trash2 } from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────

interface PingResult {
  attempt: number
  status: number
  statusText: string
  time: number
  error?: string
}

interface PortResult {
  port: number
  service: string
  status: 'open' | 'closed' | 'timeout'
  time: number
}

// ── Constants ──────────────────────────────────────────────────────

const COMMON_PORTS = [
  { port: 21, service: 'FTP' },
  { port: 22, service: 'SSH' },
  { port: 25, service: 'SMTP' },
  { port: 53, service: 'DNS' },
  { port: 80, service: 'HTTP' },
  { port: 110, service: 'POP3' },
  { port: 143, service: 'IMAP' },
  { port: 443, service: 'HTTPS' },
  { port: 465, service: 'SMTPS' },
  { port: 587, service: 'SMTP' },
  { port: 993, service: 'IMAPS' },
  { port: 995, service: 'POP3S' },
  { port: 1433, service: 'MSSQL' },
  { port: 1521, service: 'Oracle' },
  { port: 3306, service: 'MySQL' },
  { port: 3389, service: 'RDP' },
  { port: 5432, service: 'PostgreSQL' },
  { port: 5672, service: 'RabbitMQ' },
  { port: 6379, service: 'Redis' },
  { port: 8080, service: 'HTTP-Alt' },
  { port: 8443, service: 'HTTPS-Alt' },
  { port: 8888, service: 'HTTP-Alt' },
  { port: 9090, service: 'Prometheus' },
  { port: 9200, service: 'Elasticsearch' },
  { port: 9527, service: 'Custom' },
  { port: 27017, service: 'MongoDB' },
]

// ── Component ──────────────────────────────────────────────────────

export default function ServerTest() {
  // Ping state
  const [pingHost, setPingHost] = useState('')
  const [pingCount, setPingCount] = useState('5')
  const [pingResults, setPingResults] = useState<PingResult[]>([])
  const [pingRunning, setPingRunning] = useState(false)
  const abortRef = useRef(false)

  // Port scan state
  const [portHost, setPortHost] = useState('')
  const [portInput, setPortInput] = useState('')
  const [portResults, setPortResults] = useState<PortResult[]>([])
  const [portRunning, setPortRunning] = useState(false)

  // ── HTTP Ping ────────────────────────────────────────────────────

  const handlePing = useCallback(async () => {
    if (!pingHost.trim()) return
    setPingRunning(true)
    setPingResults([])
    abortRef.current = false

    const count = Math.min(Math.max(parseInt(pingCount) || 5, 1), 50)
    const results: PingResult[] = []

    let url = pingHost.trim()
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url
    }
    // Remove trailing path for ping
    try {
      const u = new URL(url)
      url = u.origin
    } catch {}

    for (let i = 0; i < count && !abortRef.current; i++) {
      const start = performance.now()
      try {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 10000)
        const res = await fetch(url, {
          method: 'HEAD',
          mode: 'no-cors',
          cache: 'no-store',
          signal: controller.signal,
        })
        clearTimeout(timeout)
        const elapsed = performance.now() - start
        results.push({
          attempt: i + 1,
          status: res.status,
          statusText: res.type === 'opaque' ? 'OK (opaque)' : `${res.status} ${res.statusText}`,
          time: Math.round(elapsed),
        })
      } catch (err) {
        const elapsed = performance.now() - start
        const msg = err instanceof Error ? err.message : '未知错误'
        if (msg.includes('abort')) {
          results.push({ attempt: i + 1, status: 0, statusText: '超时', time: 10000, error: '请求超时 (10s)' })
        } else {
          results.push({ attempt: i + 1, status: 0, statusText: '失败', time: Math.round(elapsed), error: msg })
        }
      }
      setPingResults([...results])
      if (i < count - 1 && !abortRef.current) {
        await new Promise(r => setTimeout(r, 500))
      }
    }
    setPingRunning(false)
  }, [pingHost, pingCount])

  // ── Port Scan ────────────────────────────────────────────────────

  const parsePorts = useCallback((input: string): number[] => {
    const ports = new Set<number>()
    const parts = input.split(/[,，\s]+/).filter(Boolean)
    for (const part of parts) {
      if (part.includes('-')) {
        const [a, b] = part.split('-').map(Number)
        if (a && b && a <= b) {
          for (let i = a; i <= Math.min(b, a + 100); i++) ports.add(i)
        }
      } else {
        const n = parseInt(part)
        if (n > 0 && n <= 65535) ports.add(n)
      }
    }
    return [...ports].sort((a, b) => a - b)
  }, [])

  const testPort = useCallback((host: string, port: number, timeout: number): Promise<PortResult> => {
    return new Promise((resolve) => {
      const start = performance.now()
      const ws = new WebSocket(`ws://${host}:${port}`)
      const timer = setTimeout(() => {
        ws.close()
        const service = COMMON_PORTS.find(p => p.port === port)?.service || ''
        resolve({ port, service, status: 'timeout', time: timeout })
      }, timeout)

      ws.onopen = () => {
        clearTimeout(timer)
        ws.close()
        const service = COMMON_PORTS.find(p => p.port === port)?.service || ''
        resolve({ port, service, status: 'open', time: Math.round(performance.now() - start) })
      }
      ws.onerror = () => {
        clearTimeout(timer)
        const elapsed = Math.round(performance.now() - start)
        const service = COMMON_PORTS.find(p => p.port === port)?.service || ''
        // WebSocket error can mean port is closed OR port is open but not WS
        // Fast error (< 200ms) usually means connection refused (closed)
        // Slower error might mean open but not WebSocket
        if (elapsed < 200) {
          resolve({ port, service, status: 'closed', time: elapsed })
        } else {
          resolve({ port, service, status: 'open', time: elapsed })
        }
      }
    })
  }, [])

  const handlePortScan = useCallback(async () => {
    if (!portHost.trim()) return
    setPortRunning(true)
    setPortResults([])

    let host = portHost.trim()
    // Strip protocol
    host = host.replace(/^https?:\/\//, '').replace(/[:/].*$/, '')

    const ports = portInput.trim()
      ? parsePorts(portInput)
      : COMMON_PORTS.map(p => p.port)

    const results: PortResult[] = []
    // Test 5 ports concurrently
    for (let i = 0; i < ports.length; i += 5) {
      const batch = ports.slice(i, i + 5)
      const batchResults = await Promise.all(batch.map(p => testPort(host, p, 5000)))
      results.push(...batchResults)
      setPortResults([...results])
    }
    setPortRunning(false)
  }, [portHost, portInput, parsePorts, testPort])

  // ── Helpers ──────────────────────────────────────────────────────

  const pingStats = pingResults.length > 0 ? {
    min: Math.min(...pingResults.filter(r => !r.error).map(r => r.time)),
    max: Math.max(...pingResults.filter(r => !r.error).map(r => r.time)),
    avg: Math.round(pingResults.filter(r => !r.error).reduce((s, r) => s + r.time, 0) / pingResults.filter(r => !r.error).length),
    loss: pingResults.filter(r => r.error).length,
  } : null

  return (
    <ToolShell title="服务器测试" description="HTTP 延迟测试、端口连通性检测">
      {/* HTTP Ping */}
      <Section title="HTTP 延迟测试">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
          <div className="sm:col-span-2">
            <TextInput value={pingHost} onChange={setPingHost} placeholder="example.com 或 https://api.example.com" label="目标地址" />
          </div>
          <Select
            value={pingCount}
            onChange={setPingCount}
            options={[
              { value: '3', label: '3 次' },
              { value: '5', label: '5 次' },
              { value: '10', label: '10 次' },
              { value: '20', label: '20 次' },
            ]}
            label="测试次数"
          />
        </div>
        <div className="flex items-center gap-3">
          <ActionButton onClick={handlePing} disabled={pingRunning || !pingHost.trim()}>
            {pingRunning ? (
              <span className="inline-flex items-center gap-1.5"><Loader2 size={14} className="animate-spin" /> 测试中...</span>
            ) : (
              <span className="inline-flex items-center gap-1.5"><Play size={14} /> 开始测试</span>
            )}
          </ActionButton>
          {pingRunning && (
            <button onClick={() => { abortRef.current = true }} className="text-xs text-red-500 hover:underline">停止</button>
          )}
        </div>

        {pingResults.length > 0 && (
          <div className="mt-4">
            {/* Stats */}
            {pingStats && (
              <div className="grid grid-cols-4 gap-2 mb-3">
                {[
                  { label: '最低延迟', value: `${pingStats.min}ms`, color: 'text-green-600 dark:text-green-400' },
                  { label: '最高延迟', value: `${pingStats.max}ms`, color: 'text-yellow-600 dark:text-yellow-400' },
                  { label: '平均延迟', value: `${pingStats.avg}ms`, color: 'text-blue-600 dark:text-blue-400' },
                  { label: '丢包率', value: `${Math.round(pingStats.loss / pingResults.length * 100)}%`, color: pingStats.loss > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400' },
                ].map(s => (
                  <div key={s.label} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 text-center">
                    <div className="text-xs text-gray-500 dark:text-gray-400">{s.label}</div>
                    <div className={`text-lg font-bold font-mono ${s.color}`}>{s.value}</div>
                  </div>
                ))}
              </div>
            )}
            {/* Results table */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800">
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">#</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">状态</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">延迟</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {pingResults.map((r, i) => (
                    <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-3 py-1.5 text-xs font-mono text-gray-500">{r.attempt}</td>
                      <td className="px-3 py-1.5">
                        {r.error ? (
                          <span className="inline-flex items-center gap-1 text-xs text-red-500"><XCircle size={12} /> {r.error}</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400"><CheckCircle size={12} /> {r.statusText}</span>
                        )}
                      </td>
                      <td className={`px-3 py-1.5 text-right text-xs font-mono ${
                        r.time < 200 ? 'text-green-600 dark:text-green-400'
                          : r.time < 500 ? 'text-yellow-600 dark:text-yellow-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {r.error ? '-' : `${r.time}ms`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Section>

      {/* Port Scan */}
      <Section title="端口连通性检测">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <TextInput value={portHost} onChange={setPortHost} placeholder="example.com 或 192.168.1.1" label="目标主机" />
          <TextInput value={portInput} onChange={setPortInput} placeholder="留空检测常用端口，或输入: 80,443,3306" label="端口 (可选)" />
        </div>
        <div className="flex items-center gap-3 mb-3">
          <ActionButton onClick={handlePortScan} disabled={portRunning || !portHost.trim()}>
            {portRunning ? (
              <span className="inline-flex items-center gap-1.5"><Loader2 size={14} className="animate-spin" /> 扫描中...</span>
            ) : (
              <span className="inline-flex items-center gap-1.5"><Play size={14} /> 开始扫描</span>
            )}
          </ActionButton>
          {portResults.length > 0 && (
            <button onClick={() => setPortResults([])} className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors">
              <Trash2 size={12} /> 清空
            </button>
          )}
          <span className="text-xs text-gray-400">
            支持格式: <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">80,443</code> 或 <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">80-100</code>
          </span>
        </div>

        {portResults.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {portResults.map((r, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg border ${
                  r.status === 'open'
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                    : r.status === 'timeout'
                      ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                      : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                }`}
              >
                {r.status === 'open' ? (
                  <CheckCircle size={14} className="text-green-500 shrink-0" />
                ) : r.status === 'timeout' ? (
                  <Clock size={14} className="text-yellow-500 shrink-0" />
                ) : (
                  <XCircle size={14} className="text-gray-400 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono font-medium text-gray-900 dark:text-gray-100">{r.port}</span>
                    {r.service && <span className="text-xs text-gray-500">{r.service}</span>}
                  </div>
                </div>
                <span className={`text-xs font-medium ${
                  r.status === 'open' ? 'text-green-600 dark:text-green-400'
                    : r.status === 'timeout' ? 'text-yellow-600 dark:text-yellow-400'
                    : 'text-gray-400'
                }`}>
                  {r.status === 'open' ? '开放' : r.status === 'timeout' ? '超时' : '关闭'}
                </span>
                <span className="text-xs text-gray-400 font-mono">{r.time}ms</span>
              </div>
            ))}
          </div>
        )}
      </Section>

    </ToolShell>
  )
}
