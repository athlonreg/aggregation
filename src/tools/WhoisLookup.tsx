import { useState } from 'react'
import ToolShell, { Section, TextareaWithCopy, ActionButton, TextInput } from '../components/ToolShell'

export default function WhoisLookup() {
  const [input, setInput] = useState('')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLookup = async () => {
    setLoading(true)
    setError('')
    setResult('')
    try {
      const domain = input.trim()
      if (!domain) throw new Error('请输入域名')
      // Use a public WHOIS API
      const res = await fetch(`https://whois.freeaiapi.xyz/?name=${encodeURIComponent(domain)}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      if (data.result) {
        setResult(data.result)
      } else if (data.data) {
        setResult(typeof data.data === 'string' ? data.data : JSON.stringify(data.data, null, 2))
      } else {
        setResult(JSON.stringify(data, null, 2))
      }
    } catch (e) {
      setError((e as Error).message || '查询失败，可能需要使用代理或换用其他 WHOIS 服务')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ToolShell title="WHOIS 查询" description="查询域名注册信息">
      <Section>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-48">
            <TextInput value={input} onChange={setInput} placeholder="example.com" label="域名" />
          </div>
          <ActionButton onClick={handleLookup} disabled={loading}>
            {loading ? '查询中...' : '查询'}
          </ActionButton>
        </div>
        {error && <div className="mt-2 text-sm text-red-500">{error}</div>}
      </Section>

      {result && (
        <Section title="WHOIS 信息">
          <TextareaWithCopy value={result} readOnly rows={20} />
        </Section>
      )}
    </ToolShell>
  )
}
