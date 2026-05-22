import { useState } from 'react'
import ToolShell, { Section, ActionButton, TextInput } from '../components/ToolShell'

interface IcpResult {
  domain: string
  owner: string
  type: string
  license: string
  siteName: string
}

async function fetchJson(url: string, ms = 10000): Promise<Record<string, unknown>> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), ms)
  try {
    const res = await fetch(url, { signal: controller.signal })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } finally {
    clearTimeout(timer)
  }
}

async function fetchWithProxy(url: string, ms = 10000): Promise<Record<string, unknown>> {
  try {
    return await fetchJson(url, ms)
  } catch {
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`
    return fetchJson(proxyUrl, ms + 4000)
  }
}

function parseIcpData(data: Record<string, unknown>, domain: string): IcpResult {
  // Handle different API response formats
  const info = data.info as Record<string, unknown> | undefined
  if (info) {
    return {
      domain: (info.domain as string) || domain,
      owner: (info.unitName as string) || '-',
      type: (info.nature as string) || '-',
      license: (info.icp as string) || '-',
      siteName: (info.siteName as string) || '-',
    }
  }
  // Alternative format
  const d = data.data as Record<string, unknown> | undefined
  if (d) {
    return {
      domain: (d.domain as string) || domain,
      owner: (d.unitName as string) || (d.owner_name as string) || '-',
      type: (d.nature as string) || (d.type as string) || '-',
      license: (d.icp as string) || (d.licence as string) || '-',
      siteName: (d.siteName as string) || (d.site_name as string) || '-',
    }
  }
  throw new Error(data.msg as string || data.message as string || '未查询到备案信息')
}

export default function IcpLookup() {
  const [input, setInput] = useState('')
  const [results, setResults] = useState<IcpResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLookup = async () => {
    setLoading(true)
    setError('')
    setResults([])
    try {
      const domain = input.trim()
      if (!domain) throw new Error('请输入域名或备案号')

      const errors: string[] = []

      // API 1: vvhan (direct or via proxy)
      try {
        const data = await fetchWithProxy(`https://api.vvhan.com/api/icp?url=${encodeURIComponent(domain)}`)
        if (data.success) {
          setResults([parseIcpData(data, domain)])
          return
        }
        errors.push(`vvhan: ${data.msg || '查询失败'}`)
      } catch (e) {
        errors.push(`vvhan: ${(e as Error).message}`)
      }

      // API 2: icpapi (alternative, via proxy)
      try {
        const data = await fetchWithProxy(`https://icpapi.com/api/v1/icp?domain=${encodeURIComponent(domain)}`)
        if (!data.error) {
          const info = data.data as Record<string, unknown> | undefined
          if (info) {
            setResults([{
              domain: (info.Domain as string) || domain,
              owner: (info.Owner as string) || '-',
              type: (info.Type as string) || '-',
              license: (info.Licence as string) || '-',
              siteName: (info.Name as string) || '-',
            }])
            return
          }
        }
        errors.push(`icpapi: ${data.error || '查询失败'}`)
      } catch (e) {
        errors.push(`icpapi: ${(e as Error).message}`)
      }

      throw new Error(`查询失败:\n${errors.join('\n')}`)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <ToolShell title="网站备案查询" description="查询 ICP 备案信息">
      <Section>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-48">
            <TextInput value={input} onChange={setInput} placeholder="example.com 或备案号" label="域名 / 备案号" />
          </div>
          <ActionButton onClick={handleLookup} disabled={loading}>
            {loading ? '查询中...' : '查询'}
          </ActionButton>
        </div>
        {error && <div className="mt-2 text-sm text-red-500 whitespace-pre-line">{error}</div>}
      </Section>

      {results.length > 0 && (
        <Section title="备案信息">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">域名</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">主办单位</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">性质</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">备案号</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">网站名称</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, i) => (
                  <tr key={i} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-2.5 px-3 font-mono text-gray-900 dark:text-white">{r.domain}</td>
                    <td className="py-2.5 px-3 text-gray-900 dark:text-white">{r.owner}</td>
                    <td className="py-2.5 px-3 text-gray-600 dark:text-gray-400">{r.type}</td>
                    <td className="py-2.5 px-3 font-mono text-gray-900 dark:text-white">{r.license}</td>
                    <td className="py-2.5 px-3 text-gray-600 dark:text-gray-400">{r.siteName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}
    </ToolShell>
  )
}
