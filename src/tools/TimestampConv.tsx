import { useState, useCallback } from 'react'
import ToolShell, { Section, ActionButton, TextInput } from '../components/ToolShell'

function formatTimestamp(ts: number): string {
  const date = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

function relativeTime(ts: number): string {
  const now = Date.now()
  const diff = now - ts
  const absDiff = Math.abs(diff)
  const future = diff < 0

  const seconds = Math.floor(absDiff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  const months = Math.floor(days / 30)
  const years = Math.floor(days / 365)

  let text: string
  if (seconds < 60) text = `${seconds}秒`
  else if (minutes < 60) text = `${minutes}分钟`
  else if (hours < 24) text = `${hours}小时`
  else if (days < 30) text = `${days}天`
  else if (months < 12) text = `${months}个月`
  else text = `${years}年`

  return future ? `${text}后` : `${text}前`
}

function parseTimestamp(input: string): number | null {
  const trimmed = input.trim()
  if (!trimmed) return null
  const num = Number(trimmed)
  if (isNaN(num)) return null
  // Auto-detect: if > 1e12, it's milliseconds; otherwise seconds
  if (num > 1e12) return num
  return num * 1000
}

function parseDateStr(input: string): number | null {
  const trimmed = input.trim()
  if (!trimmed) return null
  const date = new Date(trimmed)
  if (isNaN(date.getTime())) return null
  return date.getTime()
}

export default function TimestampConv() {
  const [tsInput, setTsInput] = useState('')
  const [tsResult, setTsResult] = useState('')
  const [dateInput, setDateInput] = useState('')
  const [dateResult, setDateResult] = useState('')
  const [nowTs, setNowTs] = useState('')

  const convertTimestamp = useCallback(() => {
    const ms = parseTimestamp(tsInput)
    if (ms === null) {
      setTsResult('错误: 请输入有效的时间戳数字')
      return
    }
    const secs = Math.floor(ms / 1000)
    const dateStr = formatTimestamp(ms)
    const rel = relativeTime(ms)
    setTsResult(
      `日期: ${dateStr}\n` +
      `秒级时间戳: ${secs}\n` +
      `毫秒级时间戳: ${ms}\n` +
      `相对时间: ${rel}`
    )
  }, [tsInput])

  const convertDate = useCallback(() => {
    const ms = parseDateStr(dateInput)
    if (ms === null) {
      setDateResult('错误: 请输入有效的日期格式 (YYYY-MM-DD HH:mm:ss)')
      return
    }
    const secs = Math.floor(ms / 1000)
    setDateResult(
      `秒级时间戳: ${secs}\n` +
      `毫秒级时间戳: ${ms}`
    )
  }, [dateInput])

  const getNow = useCallback(() => {
    const now = Date.now()
    const secs = Math.floor(now / 1000)
    setNowTs(
      `当前时间: ${formatTimestamp(now)}\n` +
      `秒级时间戳: ${secs}\n` +
      `毫秒级时间戳: ${now}`
    )
  }, [])

  return (
    <ToolShell title="时间戳转换" description="时间戳与日期格式互相转换">
      <Section title="时间戳 → 日期">
        <div className="space-y-3">
          <TextInput
            value={tsInput}
            onChange={setTsInput}
            placeholder="输入时间戳（秒或毫秒，自动识别）"
            label="时间戳"
          />
          <ActionButton onClick={convertTimestamp}>转换</ActionButton>
          {tsResult && (
            <pre className="text-sm bg-gray-50 dark:bg-gray-800 rounded-lg p-3 whitespace-pre-wrap font-mono text-gray-900 dark:text-gray-100">
              {tsResult}
            </pre>
          )}
        </div>
      </Section>

      <Section title="日期 → 时间戳">
        <div className="space-y-3">
          <TextInput
            value={dateInput}
            onChange={setDateInput}
            placeholder="2024-01-15 12:30:00"
            label="日期时间"
          />
          <ActionButton onClick={convertDate}>转换</ActionButton>
          {dateResult && (
            <pre className="text-sm bg-gray-50 dark:bg-gray-800 rounded-lg p-3 whitespace-pre-wrap font-mono text-gray-900 dark:text-gray-100">
              {dateResult}
            </pre>
          )}
        </div>
      </Section>

      <Section title="当前时间">
        <div className="space-y-3">
          <ActionButton onClick={getNow}>获取当前时间戳</ActionButton>
          {nowTs && (
            <pre className="text-sm bg-gray-50 dark:bg-gray-800 rounded-lg p-3 whitespace-pre-wrap font-mono text-gray-900 dark:text-gray-100">
              {nowTs}
            </pre>
          )}
        </div>
      </Section>
    </ToolShell>
  )
}
