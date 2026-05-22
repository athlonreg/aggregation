import { useState } from 'react'
import ToolShell, { Section, TextareaWithCopy, ActionButton, TextInput } from '../components/ToolShell'

function formatRdap(data: Record<string, unknown>): string {
  const lines: string[] = []

  // Domain name
  const name = data.ldhName as string
  if (name) lines.push(`Domain Name: ${name}`)

  // Status
  const status = data.status as string[] | undefined
  if (status?.length) lines.push(`Status: ${status.join(', ')}`)

  // Events (registration, expiry, etc.)
  const events = data.events as { eventAction: string; eventDate: string }[] | undefined
  if (events) {
    for (const e of events) {
      const action: Record<string, string> = {
        registration: 'Created',
        expiration: 'Expires',
        lastChanged: 'Updated',
        lastUpdateOfRdapDatabase: 'RDAP Updated',
      }
      lines.push(`${action[e.eventAction] || e.eventAction}: ${e.eventDate}`)
    }
  }

  // Nameservers
  const ns = data.nameservers as { ldhName: string }[] | undefined
  if (ns?.length) {
    lines.push(`Name Servers:`)
    for (const n of ns) lines.push(`  ${n.ldhName}`)
  }

  // Entities (registrar, registrant)
  const entities = data.entities as { handle?: string; roles?: string[]; vcardArray?: unknown[] }[] | undefined
  if (entities) {
    for (const ent of entities) {
      const roles = ent.roles?.join(', ') || 'unknown'
      const handle = ent.handle || '-'
      lines.push(`\n[${roles}] ${handle}`)

      // Try to extract vcard info
      const vcard = ent.vcardArray as [string, [string, Record<string, unknown>, string, string][]] | undefined
      if (vcard?.[1]) {
        for (const field of vcard[1]) {
          const [type, , , value] = field
          if (value && typeof value === 'string') {
            const labels: Record<string, string> = {
              fn: 'Name', org: 'Org', email: 'Email', 'contact-uri': 'URL',
              tel: 'Phone', adr: 'Address',
            }
            lines.push(`  ${labels[type] || type}: ${value}`)
          }
        }
      }
    }
  }

  // Notices
  const notices = data.notices as { title?: string; description?: string[] }[] | undefined
  if (notices?.length) {
    lines.push(`\n--- Notices ---`)
    for (const n of notices) {
      if (n.title) lines.push(`${n.title}`)
      if (n.description) lines.push(n.description.join('\n'))
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

      // RDAP protocol (IETF standard, supports CORS)
      try {
        const tld = domain.split('.').pop()
        const res = await fetch(`https://rdap.org/${tld}/domain/${encodeURIComponent(domain)}`)
        if (res.ok) {
          const data = await res.json()
          setResult(formatRdap(data))
          return
        }
        errors.push(`rdap.org: HTTP ${res.status}`)
      } catch (e) {
        errors.push(`rdap.org: ${(e as Error).message}`)
      }

      // Fallback: WHOIS JSON API with CORS proxy
      try {
        const apiUrl = `https://whois.freeaiapi.xyz/?name=${encodeURIComponent(domain)}`
        const res = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(apiUrl)}`)
        if (res.ok) {
          const data = await res.json()
          if (data.result) {
            setResult(data.result)
            return
          }
          if (data.data) {
            setResult(typeof data.data === 'string' ? data.data : JSON.stringify(data.data, null, 2))
            return
          }
        }
        errors.push(`whois API: HTTP ${res.status}`)
      } catch (e) {
        errors.push(`whois API: ${(e as Error).message}`)
      }

      throw new Error(`查询失败:\n${errors.join('\n')}`)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <ToolShell title="WHOIS 查询" description="查询域名注册信息（支持 RDAP 标准协议）">
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
