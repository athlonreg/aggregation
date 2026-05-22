import { useState } from 'react'
import ToolShell, { Section, TextareaWithCopy, ActionButton, TextInput } from '../components/ToolShell'

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

function formatRdap(data: Record<string, unknown>): string {
  const lines: string[] = []

  const name = data.ldhName as string
  if (name) lines.push(`Domain Name: ${name}`)

  const status = data.status as string[] | undefined
  if (status?.length) lines.push(`Status: ${status.join(', ')}`)

  const events = data.events as { eventAction: string; eventDate: string }[] | undefined
  if (events) {
    const labels: Record<string, string> = {
      registration: 'Created', expiration: 'Expires',
      lastChanged: 'Updated', lastUpdateOfRdapDatabase: 'RDAP Updated',
    }
    for (const e of events) {
      lines.push(`${labels[e.eventAction] || e.eventAction}: ${e.eventDate}`)
    }
  }

  const ns = data.nameservers as { ldhName: string }[] | undefined
  if (ns?.length) {
    lines.push(`Name Servers:`)
    for (const n of ns) lines.push(`  ${n.ldhName}`)
  }

  const entities = data.entities as { handle?: string; roles?: string[]; vcardArray?: unknown[] }[] | undefined
  if (entities) {
    for (const ent of entities) {
      const roles = ent.roles?.join(', ') || 'unknown'
      const handle = ent.handle || '-'
      lines.push(`\n[${roles}] ${handle}`)
      const vcard = ent.vcardArray as [string, [string, Record<string, unknown>, string, string][]] | undefined
      if (vcard?.[1]) {
        for (const field of vcard[1]) {
          const [type, , , value] = field
          if (value && typeof value === 'string') {
            const fieldLabels: Record<string, string> = {
              fn: 'Name', org: 'Org', email: 'Email', 'contact-uri': 'URL', tel: 'Phone',
            }
            lines.push(`  ${fieldLabels[type] || type}: ${value}`)
          }
        }
      }
    }
  }

  return lines.join('\n') || JSON.stringify(data, null, 2)
}

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

      const errors: string[] = []

      // RDAP protocol (IETF standard, CORS supported)
      try {
        const data = await fetchWithProxy(`https://rdap.org/domain/${encodeURIComponent(domain)}`)
        setResult(formatRdap(data))
        return
      } catch (e) {
        errors.push(`RDAP: ${(e as Error).message}`)
      }

      throw new Error(`查询失败:\n${errors.join('\n')}`)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <ToolShell title="WHOIS 查询" description="查询域名注册信息（基于 RDAP 标准协议）">
      <Section>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-48">
            <TextInput value={input} onChange={setInput} placeholder="example.com" label="域名" />
          </div>
          <ActionButton onClick={handleLookup} disabled={loading}>
            {loading ? '查询中...' : '查询'}
          </ActionButton>
        </div>
        {error && <div className="mt-2 text-sm text-red-500 whitespace-pre-line">{error}</div>}
      </Section>

      {result && (
        <Section title="WHOIS 信息">
          <TextareaWithCopy value={result} readOnly rows={20} />
        </Section>
      )}
    </ToolShell>
  )
}
