import { useState, useMemo } from 'react'
import ToolShell, { Section, TextInput, Select } from '../components/ToolShell'

const WEEKDAY_NAMES = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']

function formatDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function getWeekday(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  if (isNaN(d.getTime())) return ''
  return WEEKDAY_NAMES[d.getDay()]
}

function diffDates(start: string, end: string) {
  if (!start || !end) return null
  const a = new Date(start + 'T00:00:00')
  const b = new Date(end + 'T00:00:00')
  if (isNaN(a.getTime()) || isNaN(b.getTime())) return null

  const diffMs = Math.abs(b.getTime() - a.getTime())
  const days = Math.floor(diffMs / 86400000)
  const hours = Math.floor(diffMs / 3600000)
  const minutes = Math.floor(diffMs / 60000)
  const seconds = Math.floor(diffMs / 1000)

  return { days, hours, minutes, seconds, startWeekday: getWeekday(start), endWeekday: getWeekday(end) }
}

function addToDate(dateStr: string, amount: number, unit: string): string | null {
  if (!dateStr || isNaN(amount)) return null
  const d = new Date(dateStr + 'T00:00:00')
  if (isNaN(d.getTime())) return null

  switch (unit) {
    case 'day': d.setDate(d.getDate() + amount); break
    case 'week': d.setDate(d.getDate() + amount * 7); break
    case 'month': d.setMonth(d.getMonth() + amount); break
    case 'year': d.setFullYear(d.getFullYear() + amount); break
  }
  return formatDate(d)
}

export default function DateCalc() {
  // Section 1: date diff
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // Section 2: date add/subtract
  const [baseDate, setBaseDate] = useState('')
  const [addAmount, setAddAmount] = useState('')
  const [addUnit, setAddUnit] = useState('day')

  const diff = useMemo(() => diffDates(startDate, endDate), [startDate, endDate])
  const addResult = useMemo(() => {
    const n = parseInt(addAmount)
    if (isNaN(n)) return null
    const result = addToDate(baseDate, n, addUnit)
    if (!result) return null
    return { date: result, weekday: getWeekday(result) }
  }, [baseDate, addAmount, addUnit])

  return (
    <ToolShell title="日期计算器" description="计算两个日期之间的间隔，或对日期进行加减运算">
      <Section title="日期间隔">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-40">
            <TextInput value={startDate} onChange={setStartDate} type="date" label="起始日期" />
          </div>
          <div className="flex-1 min-w-40">
            <TextInput value={endDate} onChange={setEndDate} type="date" label="结束日期" />
          </div>
        </div>
        {diff && (
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{diff.days}</div>
              <div className="text-xs text-gray-500">天</div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{diff.hours.toLocaleString()}</div>
              <div className="text-xs text-gray-500">小时</div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{diff.minutes.toLocaleString()}</div>
              <div className="text-xs text-gray-500">分钟</div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{diff.seconds.toLocaleString()}</div>
              <div className="text-xs text-gray-500">秒</div>
            </div>
          </div>
        )}
        {diff && (
          <div className="mt-2 text-sm text-gray-500">
            起始: {diff.startWeekday} | 结束: {diff.endWeekday}
          </div>
        )}
      </Section>

      <Section title="日期加减">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-40">
            <TextInput value={baseDate} onChange={setBaseDate} type="date" label="基准日期" />
          </div>
          <div className="w-28">
            <TextInput value={addAmount} onChange={setAddAmount} placeholder="0" label="数量" type="number" />
          </div>
          <Select
            value={addUnit}
            onChange={setAddUnit}
            label="单位"
            options={[
              { value: 'day', label: '天' },
              { value: 'week', label: '周' },
              { value: 'month', label: '月' },
              { value: 'year', label: '年' },
            ]}
          />
        </div>
        {addResult && (
          <div className="mt-4 bg-green-50 dark:bg-green-900/30 rounded-lg p-4 text-center">
            <div className="text-lg font-medium text-gray-900 dark:text-gray-100">
              结果日期: {addResult.date}
            </div>
            <div className="text-sm text-gray-500 mt-1">{addResult.weekday}</div>
          </div>
        )}
      </Section>
    </ToolShell>
  )
}
