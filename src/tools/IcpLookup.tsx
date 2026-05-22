import { useState } from 'react'
import ToolShell, { Section, ActionButton, TextInput } from '../components/ToolShell'

interface IcpResult {
  domain: string
  owner: string
  type: string
  license: string
  siteName: string
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
      // Use ICP public query API
      const res = await fetch(`https://api.vvhan.com/api/icp?url=${encodeURIComponent(domain)}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      if (data.success && data.info) {
        setResults([{
          domain: data.info.domain || domain,
          owner: data.info.unitName || '-',
          type: data.info.nature || '-',
          license: data.info.icp || '-',
          siteName: data.info.siteName || '-',
        }])
      } else {
        throw new Error(data.msg || '未查询到备案信息')
      }
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
        {error && <div className="mt-2 text-sm text-red-500">{error}</div>}
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
