import { useState, useMemo } from 'react'
import ToolShell, { Section, ActionButton, TextInput } from '../components/ToolShell'

const PRESETS = [
  { label: '每分钟', expr: '* * * * *' },
  { label: '每小时', expr: '0 * * * *' },
  { label: '每天零点', expr: '0 0 * * *' },
  { label: '每周一零点', expr: '0 0 * * 1' },
  { label: '每月1号零点', expr: '0 0 1 * *' },
  { label: '每5分钟', expr: '*/5 * * * *' },
  { label: '工作日9点', expr: '0 9 * * 1-5' },
]

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']

function describeField(value: string, field: string): string {
  if (value === '*') {
    const map: Record<string, string> = {
      minute: '每分钟', hour: '每小时', day: '每天', month: '每月', weekday: '每天',
    }
    return map[field] || value
  }
  if (value.startsWith('*/')) return `每 ${value.slice(2)} ${field === 'minute' ? '分钟' : field === 'hour' ? '小时' : ''}`
  if (value.includes(',')) return value.split(',').map(v => describeField(v, field)).join(', ')
  if (value.includes('-')) {
    const [a, b] = value.split('-')
    if (field === 'weekday') return `周${WEEKDAYS[+a]}到周${WEEKDAYS[+b]}`
    return `${a}到${b}`
  }
  return value
}

function describeCron(parts: string[]): string {
  const [min, hour, day, month, weekday] = parts
  let desc = ''

  if (month !== '*') desc += `${month}月 `
  if (weekday !== '*') {
    if (weekday.includes('-')) {
      const [a, b] = weekday.split('-')
      desc += `周${WEEKDAYS[+a]}到周${WEEKDAYS[+b]} `
    } else if (weekday.includes(',')) {
      desc += weekday.split(',').map(d => `周${WEEKDAYS[+d]}`).join(', ') + ' '
    } else {
      desc += `周${WEEKDAYS[+weekday]} `
    }
  }
  if (day !== '*' && weekday === '*') desc += `每月${day}号 `

  if (hour === '*' && min === '*') desc += '每分钟'
  else if (hour === '*') desc += `每小时的第${describeField(min, 'minute')}分钟`
  else if (min === '*') desc += `${hour}点的每分钟`
  else if (min.startsWith('*/')) desc += `每${min.slice(2)}分钟，${hour}点`
  else desc += `${hour}点${min === '0' ? '' : min + '分'}`

  return desc.trim()
}

function getNextRuns(parts: string[], count: number): Date[] {
  const [minE, hourE, dayE, monthE, weekdayE] = parts
  const now = new Date()
  const results: Date[] = []
  const d = new Date(now)
  d.setSeconds(0)
  d.setMilliseconds(0)
  d.setMinutes(d.getMinutes() + 1)

  const maxIter = 525960 // ~1 year in minutes
  for (let i = 0; i < maxIter && results.length < count; i++) {
    if (matchField(d.getMinutes(), minE) &&
        matchField(d.getHours(), hourE) &&
        matchField(d.getDate(), dayE) &&
        matchField(d.getMonth() + 1, monthE) &&
        matchField(d.getDay(), weekdayE)) {
      results.push(new Date(d))
    }
    d.setMinutes(d.getMinutes() + 1)
  }
  return results
}

function matchField(value: number, expr: string): boolean {
  if (expr === '*') return true
  if (expr.startsWith('*/')) return value % parseInt(expr.slice(2)) === 0
  if (expr.includes(',')) return expr.split(',').some(e => matchField(value, e))
  if (expr.includes('-')) {
    const [a, b] = expr.split('-').map(Number)
    return value >= a && value <= b
  }
  return value === parseInt(expr)
}

function formatRun(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())} 周${WEEKDAYS[d.getDay()]}`
}

export default function CronParser() {
  const [expr, setExpr] = useState('')

  const parts = expr.trim().split(/\s+/)
  const valid = parts.length >= 5 && parts.length <= 6

  const description = useMemo(() => valid ? describeCron(parts.slice(0, 5)) : '', [expr])
  const nextRuns = useMemo(() => valid ? getNextRuns(parts.slice(0, 5), 5) : [], [expr])

  return (
    <ToolShell title="Cron 解析" description="解析 Cron 表达式含义，显示下次执行时间">
      <Section title="Cron 表达式">
        <TextInput value={expr} onChange={setExpr} placeholder="例: 0 2 * * * (每天凌晨2点)" label="表达式" />
        <div className="mt-3 flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <ActionButton key={p.label} variant="secondary" onClick={() => setExpr(p.expr)}>
              {p.label}
            </ActionButton>
          ))}
        </div>
      </Section>

      {expr && !valid && (
        <Section>
          <div className="text-red-500 text-sm">请输入 5 或 6 个字段的 Cron 表达式</div>
        </Section>
      )}

      {valid && description && (
        <Section title="含义">
          <div className="text-lg font-medium text-gray-900 dark:text-gray-100">{description}</div>
          <div className="mt-2 text-sm text-gray-500 font-mono">
            分 {parts[0]} | 时 {parts[1]} | 日 {parts[2]} | 月 {parts[3]} | 周 {parts[4]}
            {parts[5] !== undefined && ` | 秒 ${parts[5]}`}
          </div>
        </Section>
      )}

      {nextRuns.length > 0 && (
        <Section title="下次 5 次执行时间">
          <div className="space-y-1">
            {nextRuns.map((d, i) => (
              <div key={i} className="text-sm text-gray-700 dark:text-gray-300 font-mono py-1 border-b border-gray-100 dark:border-gray-800 last:border-0">
                {i + 1}. {formatRun(d)}
              </div>
            ))}
          </div>
        </Section>
      )}
    </ToolShell>
  )
}
