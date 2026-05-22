import { useState, useRef, useCallback, useEffect } from 'react'
import ToolShell, { Section, ActionButton, TextInput, TextareaWithCopy, Select } from '../components/ToolShell'
import { Trash2, X } from 'lucide-react'
import mqtt from 'mqtt'

interface MqttMessage {
  id: number
  time: string
  direction: 'pub' | 'sub' | 'sys'
  topic: string
  payload: string
  qos: number
}

interface Subscription {
  topic: string
  qos: number
}

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error'

function generateClientId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let id = ''
  for (let i = 0; i < 8; i++) id += chars[Math.floor(Math.random() * chars.length)]
  return `devtoolbox_${id}`
}

function timestamp(): string {
  return new Date().toLocaleTimeString('zh-CN', { hour12: false }) + '.' +
    String(new Date().getMilliseconds()).padStart(3, '0')
}

const QOS_OPTIONS = [
  { value: '0', label: 'QoS 0 - 最多一次' },
  { value: '1', label: 'QoS 1 - 至少一次' },
  { value: '2', label: 'QoS 2 - 恰好一次' },
]

const PRESET_BROKERS = [
  { value: 'wss://broker.hivemq.com:8884/mqtt', label: 'HiveMQ 公共 (WSS)' },
  { value: 'wss://broker.emqx.io:8084/mqtt', label: 'EMQX 公共 (WSS)' },
  { value: 'wss://test.mosquitto.org:8081', label: 'Mosquitto 公共 (WSS)' },
  { value: 'ws://broker.hivemq.com:8000/mqtt', label: 'HiveMQ 公共 (WS)' },
  { value: 'ws://broker.emqx.io:8083/mqtt', label: 'EMQX 公共 (WS)' },
]

export default function MqttClient() {
  const clientRef = useRef<mqtt.MqttClient | null>(null)
  const nextId = useRef(1)
  const logEndRef = useRef<HTMLDivElement>(null)

  const [status, setStatus] = useState<ConnectionStatus>('disconnected')
  const [brokerUrl, setBrokerUrl] = useState('wss://broker.hivemq.com:8884/mqtt')
  const [clientId, setClientId] = useState(() => generateClientId())
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const [pubTopic, setPubTopic] = useState('test/devtoolbox')
  const [pubQos, setPubQos] = useState('0')
  const [pubPayload, setPubPayload] = useState('')
  const [retain, setRetain] = useState(false)

  const [subTopic, setSubTopic] = useState('')
  const [subQos, setSubQos] = useState('0')
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])

  const [messages, setMessages] = useState<MqttMessage[]>([])

  const addMessage = useCallback((direction: 'pub' | 'sub' | 'sys', topic: string, payload: string, qos: number) => {
    const msg: MqttMessage = {
      id: nextId.current++,
      time: timestamp(),
      direction,
      topic,
      payload,
      qos,
    }
    setMessages(prev => [...prev, msg])
    setTimeout(() => logEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clientRef.current?.end(true)
    }
  }, [])

  const handleConnect = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.end(true)
      clientRef.current = null
    }

    setStatus('connecting')
    setError('')

    const opts: mqtt.IClientOptions = {
      clientId,
      clean: true,
      connectTimeout: 10_000,
      reconnectPeriod: 0, // don't auto-reconnect
    }
    if (username) opts.username = username
    if (password) opts.password = password

    try {
      const client = mqtt.connect(brokerUrl, opts)
      clientRef.current = client

      client.on('connect', () => {
        setStatus('connected')
        addMessage('sys', '$SYS/connection', JSON.stringify({
          status: '已连接',
          broker: brokerUrl,
          clientId,
          protocol: client.options?.protocol,
        }, null, 2), 0)
      })

      client.on('message', (topic, payload, packet) => {
        addMessage('sub', topic, payload.toString(), packet.qos)
      })

      client.on('error', (err) => {
        setStatus('error')
        setError(err.message)
        addMessage('sys', '$SYS/error', err.message, 0)
      })

      client.on('close', () => {
        if (status === 'connecting') {
          setStatus('error')
          setError('连接被拒绝，请检查地址和端口')
        }
      })

      client.on('offline', () => {
        setStatus('disconnected')
        addMessage('sys', '$SYS/connection', '已断开', 0)
      })
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : '连接失败')
    }
  }, [brokerUrl, clientId, username, password, addMessage])

  const handleDisconnect = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.end(true)
      clientRef.current = null
    }
    setStatus('disconnected')
    setSubscriptions([])
    setError('')
    addMessage('sys', '$SYS/connection', '客户端主动断开', 0)
  }, [addMessage])

  const handlePublish = useCallback(() => {
    const client = clientRef.current
    if (!client || !pubTopic.trim()) return
    const qos = parseInt(pubQos) as 0 | 1 | 2
    const payload = pubPayload || ''

    client.publish(pubTopic, payload, { qos, retain }, (err) => {
      if (err) {
        addMessage('sys', '$SYS/error', `发布失败: ${err.message}`, 0)
      } else {
        addMessage('pub', pubTopic, payload || '(空消息)', qos)
      }
    })
  }, [pubTopic, pubPayload, pubQos, retain, addMessage])

  const handleSubscribe = useCallback(() => {
    const client = clientRef.current
    if (!client || !subTopic.trim()) return
    const topic = subTopic.trim()
    if (subscriptions.some(s => s.topic === topic)) return
    const qos = parseInt(subQos) as 0 | 1 | 2

    client.subscribe(topic, { qos }, (err, granted) => {
      if (err) {
        addMessage('sys', '$SYS/error', `订阅失败: ${err.message}`, 0)
        return
      }
      const grantedQos = granted?.[0]?.qos ?? qos
      setSubscriptions(prev => [...prev, { topic, qos: grantedQos }])
      addMessage('sys', '$SYS/subscription', JSON.stringify({
        action: '已订阅',
        topic,
        requestedQos: qos,
        grantedQos,
      }, null, 2), 0)
      setSubTopic('')
    })
  }, [subTopic, subQos, subscriptions, addMessage])

  const handleUnsubscribe = useCallback((topic: string) => {
    const client = clientRef.current
    if (!client) return

    client.unsubscribe(topic, (err) => {
      if (err) {
        addMessage('sys', '$SYS/error', `取消订阅失败: ${err.message}`, 0)
        return
      }
      setSubscriptions(prev => prev.filter(s => s.topic !== topic))
      addMessage('sys', '$SYS/subscription', JSON.stringify({
        action: '已取消订阅',
        topic,
      }, null, 2), 0)
    })
  }, [addMessage])

  const handleClearLog = useCallback(() => {
    setMessages([])
    nextId.current = 1
  }, [])

  const directionLabel = (d: 'pub' | 'sub' | 'sys') =>
    d === 'pub' ? '发布' : d === 'sub' ? '接收' : '系统'
  const directionColor = (d: 'pub' | 'sub' | 'sys') =>
    d === 'pub'
      ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
      : d === 'sub'
        ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300'
        : 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300'

  const isConnected = status === 'connected'

  return (
    <ToolShell title="MQTT 客户端" description="基于 WebSocket 的真实 MQTT 客户端，连接公共 Broker 进行发布/订阅测试">
      {/* Protocol hint */}
      <div className="px-4 py-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-sm text-blue-700 dark:text-blue-300">
        <strong>协议说明：</strong>浏览器只能通过 <code className="bg-blue-100 dark:bg-blue-800/50 px-1 rounded">ws://</code> 或 <code className="bg-blue-100 dark:bg-blue-800/50 px-1 rounded">wss://</code> (WebSocket) 连接 MQTT Broker。
        <code className="bg-blue-100 dark:bg-blue-800/50 px-1 rounded">mqtt://</code> 使用原生 TCP 协议，浏览器不支持。请确认你的 Broker 已开启 WebSocket 监听器，并使用对应的 WS 端口和路径。
      </div>

      {/* Connection Settings */}
      <Section title="连接设置">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Broker 地址</label>
            <div className="flex gap-2">
              <input
                value={brokerUrl}
                onChange={e => setBrokerUrl(e.target.value)}
                placeholder="wss://broker:port/path"
                className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {PRESET_BROKERS.map(b => (
                <button
                  key={b.value}
                  onClick={() => setBrokerUrl(b.value)}
                  className={`text-xs px-2 py-1 rounded-md border transition-colors ${
                    brokerUrl === b.value
                      ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300'
                      : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-400'
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>
          <TextInput
            value={clientId}
            onChange={setClientId}
            placeholder="client_id"
            label="Client ID"
          />
          <div className="grid grid-cols-2 gap-3">
            <TextInput
              value={username}
              onChange={setUsername}
              placeholder="（可选）"
              label="用户名"
            />
            <TextInput
              value={password}
              onChange={setPassword}
              placeholder="（可选）"
              label="密码"
              type="password"
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          {!isConnected ? (
            <ActionButton onClick={handleConnect} disabled={status === 'connecting'}>
              {status === 'connecting' ? '连接中...' : '连接'}
            </ActionButton>
          ) : (
            <ActionButton onClick={handleDisconnect} variant="danger">断开</ActionButton>
          )}
          <span className={`inline-flex items-center gap-1.5 text-sm ${
            isConnected ? 'text-green-600 dark:text-green-400'
              : status === 'connecting' ? 'text-yellow-600 dark:text-yellow-400'
              : status === 'error' ? 'text-red-600 dark:text-red-400'
              : 'text-gray-400'
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-green-500'
                : status === 'connecting' ? 'bg-yellow-500 animate-pulse'
                : status === 'error' ? 'bg-red-500'
                : 'bg-gray-300 dark:bg-gray-600'
            }`} />
            {isConnected ? '已连接' : status === 'connecting' ? '连接中...' : status === 'error' ? '连接失败' : '未连接'}
          </span>
          {error && (
            <span className="text-xs text-red-500 dark:text-red-400 truncate max-w-md">{error}</span>
          )}
        </div>
      </Section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Publish */}
        <Section title="发布消息">
          <div className="space-y-3">
            <TextInput
              value={pubTopic}
              onChange={setPubTopic}
              placeholder="test/topic"
              label="主题"
            />
            <Select
              value={pubQos}
              onChange={setPubQos}
              options={QOS_OPTIONS}
              label="QoS 等级"
            />
            <TextareaWithCopy
              value={pubPayload}
              onChange={setPubPayload}
              placeholder="输入消息内容..."
              label="消息内容"
              rows={4}
            />
            <div className="flex items-center gap-3">
              <ActionButton onClick={handlePublish} disabled={!isConnected || !pubTopic.trim()}>
                发布
              </ActionButton>
              <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={retain}
                  onChange={e => setRetain(e.target.checked)}
                  className="rounded border-gray-300 dark:border-gray-600 text-blue-500 focus:ring-blue-500"
                />
                Retain
              </label>
            </div>
          </div>
        </Section>

        {/* Subscribe */}
        <Section title="订阅主题">
          <div className="space-y-3">
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <TextInput
                  value={subTopic}
                  onChange={setSubTopic}
                  placeholder="test/#"
                  label="主题 (支持 + # 通配符)"
                />
              </div>
              <Select
                value={subQos}
                onChange={setSubQos}
                options={QOS_OPTIONS}
                label="QoS 等级"
              />
            </div>
            <ActionButton onClick={handleSubscribe} disabled={!isConnected || !subTopic.trim()}>
              订阅
            </ActionButton>

            {subscriptions.length > 0 && (
              <div className="mt-3">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">活跃订阅</div>
                <div className="space-y-2">
                  {subscriptions.map(sub => (
                    <div key={sub.topic} className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm font-mono text-gray-900 dark:text-gray-100 truncate">{sub.topic}</span>
                        <span className="shrink-0 text-xs px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                          QoS {sub.qos}
                        </span>
                      </div>
                      <button
                        onClick={() => handleUnsubscribe(sub.topic)}
                        className="shrink-0 p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500 transition-colors"
                        title="取消订阅"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Section>
      </div>

      {/* Message Log */}
      <Section title="消息日志">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            共 {messages.length} 条消息
          </span>
          <button
            onClick={handleClearLog}
            disabled={messages.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Trash2 size={12} />
            清空日志
          </button>
        </div>

        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <div className="max-h-96 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
            {messages.length === 0 ? (
              <div className="py-12 text-center text-sm text-gray-400 dark:text-gray-500">
                暂无消息记录
              </div>
            ) : (
              messages.map(msg => (
                <div key={msg.id} className="px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-gray-400 dark:text-gray-500 font-mono">{msg.time}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${directionColor(msg.direction)}`}>
                      {directionLabel(msg.direction)}
                    </span>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                      QoS {msg.qos}
                    </span>
                  </div>
                  <div className="text-sm font-mono text-blue-600 dark:text-blue-400 mb-1">{msg.topic}</div>
                  <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-all">
                    {msg.payload}
                  </div>
                </div>
              ))
            )}
            <div ref={logEndRef} />
          </div>
        </div>
      </Section>
    </ToolShell>
  )
}
