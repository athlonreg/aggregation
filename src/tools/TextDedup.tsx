import { useState } from 'react'
import ToolShell, { Section, ActionButton, TextareaWithCopy } from '../components/ToolShell'

export default function TextDedup() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [stats, setStats] = useState<{ original: number; deduped: number; removed: number } | null>(null)
  const [ignoreEmpty, setIgnoreEmpty] = useState(true)
  const [trimWhitespace, setTrimWhitespace] = useState(true)
  const [sort, setSort] = useState(false)

  const handleDedup = () => {
    const lines = input.split('\n')
    const originalCount = lines.length

    const processed = lines.map((line) => (trimWhitespace ? line.trim() : line))
    const filtered = ignoreEmpty ? processed.filter((line) => line !== '') : processed

    const seen = new Set<string>()
    const unique: string[] = []
    for (const line of filtered) {
      const key = trimWhitespace ? line.trim() : line
      if (!seen.has(key)) {
        seen.add(key)
        unique.push(line)
      }
    }

    if (sort) {
      unique.sort((a, b) => a.localeCompare(b, 'zh-CN'))
    }

    setOutput(unique.join('\n'))
    setStats({ original: originalCount, deduped: unique.length, removed: originalCount - unique.length })
  }

  return (
    <ToolShell title="文本去重" description="按行去重，支持忽略空行、首尾空格及排序">
      <Section>
        <TextareaWithCopy value={input} onChange={setInput} placeholder="每行一个条目..." label="输入文本" rows={8} />
        <div className="flex flex-wrap gap-4 mt-3 mb-3">
          <label className="inline-flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300">
            <input type="checkbox" checked={ignoreEmpty} onChange={(e) => setIgnoreEmpty(e.target.checked)} className="rounded" />
            忽略空行
          </label>
          <label className="inline-flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300">
            <input type="checkbox" checked={trimWhitespace} onChange={(e) => setTrimWhitespace(e.target.checked)} className="rounded" />
            忽略首尾空格
          </label>
          <label className="inline-flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300">
            <input type="checkbox" checked={sort} onChange={(e) => setSort(e.target.checked)} className="rounded" />
            排序
          </label>
        </div>
        <ActionButton onClick={handleDedup}>去重</ActionButton>
      </Section>

      {stats && (
        <Section title="去重结果">
          <div className="flex gap-4 mb-3 text-sm">
            <span className="text-gray-500 dark:text-gray-400">原始行数: <strong className="text-gray-700 dark:text-gray-200">{stats.original}</strong></span>
            <span className="text-gray-500 dark:text-gray-400">去重后行数: <strong className="text-green-600 dark:text-green-400">{stats.deduped}</strong></span>
            <span className="text-gray-500 dark:text-gray-400">移除行数: <strong className="text-red-500">{stats.removed}</strong></span>
          </div>
          <TextareaWithCopy value={output} readOnly rows={8} />
        </Section>
      )}
    </ToolShell>
  )
}
