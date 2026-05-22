import { useState, useEffect } from 'react'
import ToolShell, { Section, TextareaWithCopy, ActionButton, Select, TextInput } from '../components/ToolShell'
import { now, dateToTimestamp, timestampToDate, formatDate, parseDate, FORMATS } from '../utils/datetime'

export default function DateTime() {
  const [current, setCurrent] = useState(now())
  const [tsInput, setTsInput] = useState('')
  const [tsResult, setTsResult] = useState('')
  const [dateInput, setDateInput] = useState('')
  const [dateResult, setDateResult] = useState('')
  const [format, setFormat] = useState('YYYY-MM-DD HH:mm:ss')

  useEffect(() => {
    const timer = setInterval(() => setCurrent(now()), 1000)
    return () => clearInterval(timer)
  }, [])

  const handleTs2Date = () => {
    try {
      const ts = parseInt(tsInput)
      setTsResult(formatDate(timestampToDate(ts), format))
    } catch (e) {
      setTsResult('错误: ' + (e as Error).message)
    }
  }

  const handleDate2Ts = () => {
    try {
      const d = parseDate(dateInput)
      setDateResult(`秒: ${dateToTimestamp(d, 's')}\n毫秒: ${dateToTimestamp(d, 'ms')}`)
    } catch (e) {
      setDateResult('错误: ' + (e as Error).message)
    }
  }

  return (
    <ToolShell title="日期时间工具" description="时间戳与日期时间相互转换">
      <Section title="当前时间">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-3xl font-mono font-bold text-gray-900 dark:text-white">
              {formatDate(current, 'HH:mm:ss')}
            </div>
            <div className="text-sm text-gray-500 mt-1">{formatDate(current, 'YYYY-MM-DD')}</div>
          </div>
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-lg font-mono text-gray-900 dark:text-white">
              {dateToTimestamp(current, 's')}
            </div>
            <div className="text-sm text-gray-500 mt-1">Unix 时间戳 (秒)</div>
          </div>
        </div>
      </Section>

      <Section title="时间戳 → 日期">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-48">
            <TextInput value={tsInput} onChange={setTsInput} placeholder="输入时间戳 (秒或毫秒)" label="时间戳" />
          </div>
          <Select value={format} onChange={setFormat} options={FORMATS} label="输出格式" />
          <ActionButton onClick={handleTs2Date}>转换</ActionButton>
        </div>
        {tsResult && <TextareaWithCopy value={tsResult} readOnly rows={2} label="结果" />}
      </Section>

      <Section title="日期 → 时间戳">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-48">
            <TextInput value={dateInput} onChange={setDateInput} placeholder="2024-01-01 12:00:00" label="日期时间" />
          </div>
          <ActionButton onClick={handleDate2Ts}>转换</ActionButton>
        </div>
        {dateResult && <TextareaWithCopy value={dateResult} readOnly rows={2} label="结果" />}
      </Section>
    </ToolShell>
  )
}
