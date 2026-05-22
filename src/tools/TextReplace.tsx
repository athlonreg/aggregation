import { useState } from 'react'
import ToolShell, { Section, ActionButton, TextareaWithCopy, TextInput } from '../components/ToolShell'

export default function TextReplace() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [search, setSearch] = useState('')
  const [replaceWith, setReplaceWith] = useState('')
  const [useRegex, setUseRegex] = useState(false)
  const [global, setGlobal] = useState(true)
  const [ignoreCase, setIgnoreCase] = useState(false)
  const [count, setCount] = useState<number | null>(null)

  const handleReplace = () => {
    if (!search) return

    try {
      let flags = ''
      if (ignoreCase) flags += 'i'
      if (global) flags += 'g'

      const regex = useRegex ? new RegExp(search, flags) : new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags)
      let replaceCount = 0

      const result = input.replace(regex, () => {
        replaceCount++
        return replaceWith
      })

      setOutput(result)
      setCount(replaceCount)
    } catch {
      setOutput('正则表达式语法错误')
      setCount(null)
    }
  }

  return (
    <ToolShell title="文本替换" description="支持普通文本和正则表达式的查找替换">
      <Section>
        <TextareaWithCopy value={input} onChange={setInput} placeholder="输入文本..." label="输入文本" rows={8} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 mb-3">
          <TextInput value={search} onChange={setSearch} placeholder="查找内容" label="查找" />
          <TextInput value={replaceWith} onChange={setReplaceWith} placeholder="替换内容" label="替换为" />
        </div>
        <div className="flex flex-wrap gap-4 mb-3">
          <label className="inline-flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300">
            <input type="checkbox" checked={useRegex} onChange={(e) => setUseRegex(e.target.checked)} className="rounded" />
            使用正则表达式
          </label>
          <label className="inline-flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300">
            <input type="checkbox" checked={global} onChange={(e) => setGlobal(e.target.checked)} className="rounded" />
            全局替换
          </label>
          <label className="inline-flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300">
            <input type="checkbox" checked={ignoreCase} onChange={(e) => setIgnoreCase(e.target.checked)} className="rounded" />
            忽略大小写
          </label>
        </div>
        <ActionButton onClick={handleReplace}>替换</ActionButton>
      </Section>

      {count !== null && (
        <Section title="替换结果">
          <div className="mb-3 text-sm text-gray-500 dark:text-gray-400">
            共替换 <strong className="text-blue-600 dark:text-blue-400">{count}</strong> 处
          </div>
          <TextareaWithCopy value={output} readOnly rows={8} />
        </Section>
      )}
    </ToolShell>
  )
}
