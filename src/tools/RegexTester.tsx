import { useState, useMemo } from 'react'
import ToolShell, { Section, ActionButton, TextareaWithCopy, TextInput } from '../components/ToolShell'

const COMMON_PATTERNS = [
  { label: '邮箱', pattern: '[\\w.-]+@[\\w.-]+\\.[a-zA-Z]{2,}', flags: 'gi' },
  { label: '手机号', pattern: '1[3-9]\\d{9}', flags: 'g' },
  { label: 'URL', pattern: 'https?://[\\w\\-._~:/?#\\[\\]@!$&\'()*+,;=%]+', flags: 'gi' },
  { label: 'IPv4', pattern: '\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b', flags: 'g' },
  { label: '日期', pattern: '\\d{4}[-/](?:0[1-9]|1[0-2])[-/](?:0[1-9]|[12]\\d|3[01])', flags: 'g' },
  { label: '中文字符', pattern: '[\\u4e00-\\u9fa5]+', flags: 'g' },
]

interface MatchResult {
  text: string
  index: number
  groups: string[]
}

export default function RegexTester() {
  const [pattern, setPattern] = useState('')
  const [flags, setFlags] = useState('g')
  const [testString, setTestString] = useState('')

  const { matches, error, highlighted } = useMemo(() => {
    if (!pattern || !testString) return { matches: [] as MatchResult[], error: '', highlighted: '' }
    try {
      const regex = new RegExp(pattern, flags)
      const results: MatchResult[] = []
      let m: RegExpExecArray | null
      if (flags.includes('g')) {
        while ((m = regex.exec(testString)) !== null) {
          results.push({ text: m[0], index: m.index, groups: m.slice(1) })
          if (m[0].length === 0) regex.lastIndex++
        }
      } else {
        m = regex.exec(testString)
        if (m) results.push({ text: m[0], index: m.index, groups: m.slice(1) })
      }

      // Build highlighted HTML
      let html = ''
      let last = 0
      const sorted = [...results].sort((a, b) => a.index - b.index)
      for (const r of sorted) {
        html += escapeHtml(testString.slice(last, r.index))
        html += `<mark class="bg-yellow-200 dark:bg-yellow-800 rounded px-0.5">${escapeHtml(r.text)}</mark>`
        last = r.index + r.text.length
      }
      html += escapeHtml(testString.slice(last))

      return { matches: results, error: '', highlighted: html }
    } catch (e) {
      return { matches: [] as MatchResult[], error: (e as Error).message, highlighted: '' }
    }
  }, [pattern, flags, testString])

  return (
    <ToolShell title="正则测试" description="实时正则表达式测试与匹配，支持常用模式快速插入">
      <Section title="正则表达式">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-48">
            <TextInput value={pattern} onChange={setPattern} placeholder="输入正则表达式" label="正则" />
          </div>
          <div className="w-24">
            <TextInput value={flags} onChange={setFlags} placeholder="g" label="标志" />
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {COMMON_PATTERNS.map((p) => (
            <ActionButton key={p.label} variant="secondary" onClick={() => { setPattern(p.pattern); setFlags(p.flags) }}>
              {p.label}
            </ActionButton>
          ))}
        </div>
      </Section>

      <Section title="测试字符串">
        <TextareaWithCopy value={testString} onChange={setTestString} placeholder="输入要测试的文本" rows={5} />
      </Section>

      {error && (
        <Section>
          <div className="text-red-500 text-sm">{error}</div>
        </Section>
      )}

      {highlighted && (
        <Section title="匹配高亮">
          <div
            className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-all leading-relaxed font-mono"
            dangerouslySetInnerHTML={{ __html: highlighted }}
          />
        </Section>
      )}

      {matches.length > 0 && (
        <Section title={`匹配结果 (共 ${matches.length} 个)`}>
          <div className="space-y-2">
            {matches.map((m, i) => (
              <div key={i} className="flex items-start gap-3 text-sm p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <span className="text-gray-400 w-8 shrink-0">#{i + 1}</span>
                <div className="flex-1">
                  <div className="text-gray-900 dark:text-gray-100 font-mono">
                    &quot;{m.text}&quot; <span className="text-gray-400 text-xs">位置: {m.index}</span>
                  </div>
                  {m.groups.length > 0 && (
                    <div className="text-gray-500 text-xs mt-1">
                      捕获组: {m.groups.map((g, j) => `$${j + 1}="${g}"`).join(', ')}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}
    </ToolShell>
  )
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
