import { useState, useMemo } from 'react'
import ToolShell, { Section, TextInput } from '../components/ToolShell'

interface StatusEntry {
  code: number
  name: string
  description: string
}

const STATUS_DATA: { category: string; color: string; items: StatusEntry[] }[] = [
  {
    category: '1xx 信息',
    color: 'blue',
    items: [
      { code: 100, name: 'Continue', description: '服务器已收到请求头，客户端应继续发送请求体' },
      { code: 101, name: 'Switching Protocols', description: '服务器同意切换协议' },
      { code: 102, name: 'Processing', description: '服务器已收到请求，正在处理中' },
      { code: 103, name: 'Early Hints', description: '服务器提前返回一些响应头，用于预加载资源' },
    ],
  },
  {
    category: '2xx 成功',
    color: 'green',
    items: [
      { code: 200, name: 'OK', description: '请求成功' },
      { code: 201, name: 'Created', description: '请求成功并创建了新资源' },
      { code: 202, name: 'Accepted', description: '请求已接受，但尚未处理完成' },
      { code: 204, name: 'No Content', description: '请求成功，但无返回内容' },
      { code: 206, name: 'Partial Content', description: '服务器返回部分内容（范围请求）' },
    ],
  },
  {
    category: '3xx 重定向',
    color: 'yellow',
    items: [
      { code: 301, name: 'Moved Permanently', description: '资源已永久移动到新 URL' },
      { code: 302, name: 'Found', description: '资源临时重定向到另一个 URL' },
      { code: 303, name: 'See Other', description: '应使用 GET 方法请求另一个 URL' },
      { code: 304, name: 'Not Modified', description: '资源未修改，可使用缓存版本' },
      { code: 307, name: 'Temporary Redirect', description: '临时重定向，保持原请求方法' },
      { code: 308, name: 'Permanent Redirect', description: '永久重定向，保持原请求方法' },
    ],
  },
  {
    category: '4xx 客户端错误',
    color: 'red',
    items: [
      { code: 400, name: 'Bad Request', description: '请求语法错误或参数无效' },
      { code: 401, name: 'Unauthorized', description: '需要身份验证' },
      { code: 403, name: 'Forbidden', description: '服务器拒绝请求，无权限访问' },
      { code: 404, name: 'Not Found', description: '请求的资源不存在' },
      { code: 405, name: 'Method Not Allowed', description: '请求方法不被允许' },
      { code: 408, name: 'Request Timeout', description: '请求超时' },
      { code: 409, name: 'Conflict', description: '请求与服务器当前状态冲突' },
      { code: 413, name: 'Payload Too Large', description: '请求体超过服务器限制' },
      { code: 415, name: 'Unsupported Media Type', description: '不支持的媒体类型' },
      { code: 422, name: 'Unprocessable Entity', description: '请求格式正确，但语义错误' },
      { code: 429, name: 'Too Many Requests', description: '请求频率过高，已被限流' },
    ],
  },
  {
    category: '5xx 服务器错误',
    color: 'purple',
    items: [
      { code: 500, name: 'Internal Server Error', description: '服务器内部错误' },
      { code: 501, name: 'Not Implemented', description: '服务器不支持该请求方法' },
      { code: 502, name: 'Bad Gateway', description: '网关或代理收到上游服务器的无效响应' },
      { code: 503, name: 'Service Unavailable', description: '服务器暂时不可用（过载或维护）' },
      { code: 504, name: 'Gateway Timeout', description: '网关或代理等待上游服务器响应超时' },
    ],
  },
]

const colorMap: Record<string, { bg: string; text: string; badge: string }> = {
  blue: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-300', badge: 'bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300' },
  green: { bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-700 dark:text-green-300', badge: 'bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300' },
  yellow: { bg: 'bg-yellow-50 dark:bg-yellow-900/20', text: 'text-yellow-700 dark:text-yellow-300', badge: 'bg-yellow-100 dark:bg-yellow-800 text-yellow-700 dark:text-yellow-300' },
  red: { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-300', badge: 'bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-300' },
  purple: { bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-700 dark:text-purple-300', badge: 'bg-purple-100 dark:bg-purple-800 text-purple-700 dark:text-purple-300' },
}

export default function HttpStatus() {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return STATUS_DATA
    return STATUS_DATA.map(cat => ({
      ...cat,
      items: cat.items.filter(item =>
        String(item.code).includes(q) ||
        item.name.toLowerCase().includes(q) ||
        item.description.includes(q)
      ),
    })).filter(cat => cat.items.length > 0)
  }, [search])

  return (
    <ToolShell title="HTTP 状态码速查" description="常用 HTTP 状态码及中文说明，支持搜索过滤">
      <Section>
        <TextInput value={search} onChange={setSearch} placeholder="搜索状态码或描述..." />
      </Section>

      {filtered.length === 0 && (
        <Section>
          <div className="text-center text-gray-500 py-8">未找到匹配的状态码</div>
        </Section>
      )}

      {filtered.map((cat) => {
        const colors = colorMap[cat.color]
        return (
          <Section key={cat.category} title={cat.category} className={colors.bg}>
            <div className="space-y-2">
              {cat.items.map((item) => (
                <div key={item.code} className="flex items-start gap-3 text-sm">
                  <span className={`inline-block px-2 py-0.5 rounded font-mono font-bold text-sm shrink-0 ${colors.badge}`}>
                    {item.code}
                  </span>
                  <div>
                    <span className={`font-medium ${colors.text}`}>{item.name}</span>
                    <span className="text-gray-500 dark:text-gray-400 ml-2">{item.description}</span>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )
      })}
    </ToolShell>
  )
}
