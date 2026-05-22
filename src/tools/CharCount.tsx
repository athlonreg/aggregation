import { useState, useMemo } from 'react'
import ToolShell, { Section, TextareaWithCopy } from '../components/ToolShell'

export default function CharCount() {
  const [text, setText] = useState('')

  const stats = useMemo(() => {
    const charCount = text.length
    const charNoSpace = text.replace(/\s/g, '').length
    const wordCount = text.trim() === '' ? 0 : text.trim().split(/\s+/).length
    const lineCount = text === '' ? 0 : text.split('\n').length
    const byteCount = new TextEncoder().encode(text).length
    const paragraphCount = text.trim() === '' ? 0 : text.split(/\n\s*\n/).filter((p) => p.trim() !== '').length

    return [
      { label: '字符数', value: charCount },
      { label: '字符数(不含空格)', value: charNoSpace },
      { label: '单词数', value: wordCount },
      { label: '行数', value: lineCount },
      { label: '字节数(UTF-8)', value: byteCount },
      { label: '段落数', value: paragraphCount },
    ]
  }, [text])

  return (
    <ToolShell title="字符统计" description="实时统计文本的字符数、单词数、行数等信息">
      <Section>
        <TextareaWithCopy value={text} onChange={setText} placeholder="输入或粘贴文本..." label="输入文本" rows={8} />
      </Section>

      <Section title="统计结果">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {stats.map((s) => (
            <div key={s.label} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{s.value.toLocaleString()}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </Section>
    </ToolShell>
  )
}
