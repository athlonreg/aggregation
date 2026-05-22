import { useState, useRef, useEffect, useCallback } from 'react'
import ToolShell, { Section, ActionButton, TextInput } from '../components/ToolShell'

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected'

interface LogEntry {
  id: number
  time: string
  direction: 'in' | 'out' | 'system' | 'error'
  content: string
}

function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  const parts: string[] = []
  if (h > 0) parts.push(`${h}小时`)
  if (m > 0 || h > 0) parts.push(`${m}分`)
  parts.push(`${s}秒`)
  return parts.join('')
}

function timestamp(): string {
  const d = new Date()
  return d.toLocaleTimeString('zh-CN', { hour12: false }) + '.' + String(d.getMilliseconds()).padStart(3, '0')
}

export default function WebSocketTester() {
  const [url, setUrl] = useState('ws://localhost:8080')
  const [status, setStatus] = useState<ConnectionStatus>('disconnected')
  const [message, setMessage] = useState('')
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [heartbeatInterval, setHeartbeatInterval] = useState('0')
  const [sentCount, setSentCount] = useState(0)
  const [receivedCount, setReceivedCount] = useState(0)
  const [connectedSince, setConnectedSince] = useState<number | null>(null)
  const [duration, setDuration] = useState(0)

  const wsRef = useRef<WebSocket | null>(null)
  const logIdRef = useRef(0)
  const logEndRef = useRef<HTMLDivElement>(null)
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const addLog = useCallback((direction: LogEntry['direction'], content: string) => {
    const entry: LogEntry = {
      id: ++logIdRef.current,
      time: timestamp(),
      direction,
      content,
    }
    setLogs(prev => [...prev, entry])
  }, [])

  // Auto-scroll to bottom when logs change
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  // Duration timer
  useEffect(() => {
    if (status !== 'connected' || connectedSince === null) return
    const timer = setInterval(() => {
      setDuration(Date.now() - connectedSince)
    }, 1000)
    return () => clearInterval(timer)
  }, [status, connectedSince])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current)
      }
    }
  }, [])

  const startHeartbeat = useCallback((intervalMs: number) => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current)
      heartbeatRef.current = null
    }
    if (intervalMs <= 0) return
    heartbeatRef.current = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send('ping')
        addLog('out', 'ping')
        setSentCount(prev => prev + 1)
      }
    }, intervalMs)
  }, [addLog])

  const stopHeartbeat = useCallback(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current)
      heartbeatRef.current = null
    }
  }, [])

  const handleConnect = useCallback(() => {
    if (status === 'connected' || status === 'connecting') {
      // Disconnect
      stopHeartbeat()
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
      return
    }

    if (!url.trim()) return

    setStatus('connecting')
    addLog('system', `正在连接 ${url} ...`)

    try {
      const ws = new WebSocket(url)
      wsRef.current = ws

      ws.onopen = () => {
        setStatus('connected')
        setConnectedSince(Date.now())
        setDuration(0)
        addLog('system', '连接已建立')

        const interval = parseInt(heartbeatInterval, 10)
        if (interval > 0) {
          startHeartbeat(interval)
        }
      }

      ws.onmessage = (event) => {
        const data = typeof event.data === 'string' ? event.data : `[Binary ${event.data.byteLength} bytes]`
        addLog('in', data)
        setReceivedCount(prev => prev + 1)
      }

      ws.onclose = (event) => {
        setStatus('disconnected')
        setConnectedSince(null)
        stopHeartbeat()
        const reason = event.reason ? `: ${event.reason}` : ''
        addLog('system', `连接已关闭 (code: ${event.code}${reason})`)
        wsRef.current = null
      }

      ws.onerror = () => {
        addLog('error', '连接发生错误')
      }
    } catch (err) {
      setStatus('disconnected')
      addLog('error', `连接失败: ${err instanceof Error ? err.message : String(err)}`)
    }
  }, [status, url, heartbeatInterval, addLog, startHeartbeat, stopHeartbeat])

  const handleSend = useCallback(() => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return
    if (!message) return

    wsRef.current.send(message)
    addLog('out', message)
    setSentCount(prev => prev + 1)
    setMessage('')
  }, [message, addLog])

  const handleClearLogs = useCallback(() => {
    setLogs([])
  }, [])

  const statusConfig: Record<ConnectionStatus, { label: string; color: string; dotColor: string }> = {
    disconnected: { label: '未连接', color: 'text-gray-500', dotColor: 'bg-gray-400' },
    connecting: { label: '连接中', color: 'text-yellow-600', dotColor: 'bg-yellow-400' },
    connected: { label: '已连接', color: 'text-green-600', dotColor: 'bg-green-500' },
  }

  const currentStatus = statusConfig[status]
  const isConnected = status === 'connected'

  const directionArrow: Record<LogEntry['direction'], { arrow: string; color: string }> = {
    in: { arrow: '<-', color: 'text-blue-600 dark:text-blue-400' },
    out: { arrow: '->', color: 'text-green-600 dark:text-green-400' },
    system: { arrow: '**', color: 'text-gray-500 dark:text-gray-400' },
    error: { arrow: '!!', color: 'text-red-600 dark:text-red-400' },
  }

  return (
    <ToolShell
      title="WebSocket 测试工具"
      description="连接 WebSocket 服务器，发送和接收消息，查看连接状态和统计信息"
    >
      {/* Connection Section */}
      <Section title="连接设置">
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <TextInput
              label="WebSocket 地址"
              value={url}
              onChange={setUrl}
              placeholder="ws://localhost:8080"
            />
          </div>
          <div className="flex items-center gap-3 pb-0.5">
            <div className="flex items-center gap-1.5">
              <span className={`inline-block w-2.5 h-2.5 rounded-full ${currentStatus.dotColor} ${status === 'connecting' ? 'animate-pulse' : ''}`} />
              <span className={`text-sm font-medium ${currentStatus.color}`}>{currentStatus.label}</span>
            </div>
            <ActionButton
              onClick={handleConnect}
              variant={isConnected ? 'danger' : 'primary'}
            >
              {isConnected ? '断开' : '连接'}
            </ActionButton>
          </div>
        </div>
        <div className="mt-3 max-w-xs">
          <TextInput
            label="心跳间隔 (ms)"
            value={heartbeatInterval}
            onChange={setHeartbeatInterval}
            placeholder="0 表示禁用"
            type="text"
          />
          <p className="mt-1 text-xs text-gray-400">设置大于 0 的值以启用自动心跳，连接后生效</p>
        </div>
      </Section>

      {/* Connection Stats */}
      <Section title="连接统计">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{formatDuration(duration)}</div>
            <div className="text-xs text-gray-500 mt-1">连接时长</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{sentCount}</div>
            <div className="text-xs text-gray-500 mt-1">发送消息数</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{receivedCount}</div>
            <div className="text-xs text-gray-500 mt-1">接收消息数</div>
          </div>
        </div>
      </Section>

      {/* Send Message */}
      <Section title="发送消息">
        <div className="flex gap-3">
          <div className="flex-1">
            <TextInput
              value={message}
              onChange={setMessage}
              placeholder="输入要发送的消息..."
            />
          </div>
          <ActionButton
            onClick={handleSend}
            disabled={!isConnected || !message}
          >
            发送
          </ActionButton>
        </div>
      </Section>

      {/* Message History */}
      <Section title="消息日志">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs text-gray-400">共 {logs.length} 条记录</span>
          <ActionButton variant="secondary" onClick={handleClearLogs}>
            清空日志
          </ActionButton>
        </div>
        <div
          className="h-80 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-3 font-mono text-sm"
        >
          {logs.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
              暂无消息记录
            </div>
          ) : (
            <div className="space-y-1">
              {logs.map(entry => {
                const dir = directionArrow[entry.direction]
                return (
                  <div key={entry.id} className="flex items-start gap-2 py-0.5">
                    <span className="text-gray-400 shrink-0">{entry.time}</span>
                    <span className={`shrink-0 font-bold ${dir.color}`}>{dir.arrow}</span>
                    <span className={`whitespace-pre-wrap break-all ${entry.direction === 'error' ? 'text-red-600 dark:text-red-400' : 'text-gray-800 dark:text-gray-200'}`}>
                      {entry.content}
                    </span>
                  </div>
                )
              })}
              <div ref={logEndRef} />
            </div>
          )}
        </div>
      </Section>
    </ToolShell>
  )
}
