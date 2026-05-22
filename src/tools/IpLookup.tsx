import { useState } from 'react'
import ToolShell, { Section, ActionButton, TextInput } from '../components/ToolShell'

interface IpInfo {
  ip: string
  city?: string
  region?: string
  country?: string
  loc?: string
  org?: string
  timezone?: string
}

// Normalize different API responses to a common format
function normalizeIpApi(data: Record<string, unknown>): IpInfo {
  return {
    ip: data.query as string || '',
    city: data.city as string,
    region: data.regionName as string,
    country: data.country as string,
    loc: data.lat && data.lon ? `${data.lat},${data.lon}` : undefined,
    org: data.isp as string || data.org as string,
    timezone: data.timezone as string,
  }
}

function normalizeIpWho(data: Record<string, unknown>): IpInfo {
  const conn = data.connection as Record<string, unknown> | undefined
  const tz = data.timezone as Record<string, unknown> | undefined
  return {
    ip: data.ip as string || '',
    city: data.city as string,
    region: data.region as string,
    country: data.country as string,
    loc: data.latitude && data.longitude ? `${data.latitude},${data.longitude}` : undefined,
    org: (conn?.org as string) || (data.org as string),
    timezone: tz?.id as string,
  }
}

function normalizeIpinfo(data: Record<string, unknown>): IpInfo {
  return {
    ip: data.ip as string || '',
    city: data.city as string,
    region: data.region as string,
    country: data.country as string,
    loc: data.loc as string,
    org: data.org as string,
    timezone: data.timezone as string,
  }
}

async function fetchWithTimeout(url: string, ms = 5000): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), ms)
  try {
    const res = await fetch(url, { signal: controller.signal })
    return res
  } finally {
    clearTimeout(timer)
  }
}

async function lookupIp(ip: string): Promise<IpInfo> {
  const errors: string[] = []

  // API 1: ip-api.com (45 req/min, no HTTPS on free tier)
  try {
    const url = ip
      ? `http://ip-api.com/json/${ip}?lang=zh-CN`
      : 'http://ip-api.com/json/?lang=zh-CN'
    const res = await fetchWithTimeout(url)
    if (res.ok) {
      const data = await res.json()
      if (data.status === 'success') return normalizeIpApi(data)
      throw new Error(data.message || 'ip-api 查询失败')
    }
    errors.push(`ip-api: HTTP ${res.status}`)
  } catch (e) {
    errors.push(`ip-api: ${(e as Error).message}`)
  }

  // API 2: ipwho.is
  try {
    const url = ip ? `https://ipwho.is/${ip}` : 'https://ipwho.is/'
    const res = await fetchWithTimeout(url)
    if (res.ok) {
      const data = await res.json()
      if (data.success !== false) return normalizeIpWho(data)
      throw new Error(data.message || 'ipwho.is 查询失败')
    }
    errors.push(`ipwho.is: HTTP ${res.status}`)
  } catch (e) {
    errors.push(`ipwho.is: ${(e as Error).message}`)
  }

  // API 3: ipinfo.io (fallback)
  try {
    const url = ip ? `https://ipinfo.io/${ip}/json` : 'https://ipinfo.io/json'
    const res = await fetchWithTimeout(url)
    if (res.ok) {
      const data = await res.json()
      if (!data.error) return normalizeIpinfo(data)
      throw new Error(data.error?.message || 'ipinfo.io 查询失败')
    }
    errors.push(`ipinfo.io: HTTP ${res.status}`)
  } catch (e) {
    errors.push(`ipinfo.io: ${(e as Error).message}`)
  }

  throw new Error(`所有查询接口均失败:\n${errors.join('\n')}`)
}

export default function IpLookup() {
  const [input, setInput] = useState('')
  const [result, setResult] = useState<IpInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLookup = async () => {
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const data = await lookupIp(input.trim())
      setResult(data)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <ToolShell title="IP 查询" description="查询 IP 地址的地理位置和网络信息（自动降级多个 API）">
      <Section>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-48">
            <TextInput value={input} onChange={setInput} placeholder="留空查询本机 IP，或输入目标 IP" label="IP 地址" />
          </div>
          <ActionButton onClick={handleLookup} disabled={loading}>
            {loading ? '查询中...' : '查询'}
          </ActionButton>
        </div>
        {error && (
          <div className="mt-2 text-sm text-red-500 whitespace-pre-line">{error}</div>
        )}
      </Section>

      {result && (
        <Section title="查询结果">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              ['IP 地址', result.ip],
              ['城市', result.city],
              ['地区', result.region],
              ['国家', result.country],
              ['坐标', result.loc],
              ['组织', result.org],
              ['时区', result.timezone],
            ].filter(([, v]) => v).map(([label, value]) => (
              <div key={label} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <span className="text-sm text-gray-500">{label}</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{value}</span>
              </div>
            ))}
          </div>
        </Section>
      )}
    </ToolShell>
  )
}
