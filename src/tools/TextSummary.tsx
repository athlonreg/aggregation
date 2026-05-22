import { useState } from 'react'
import ToolShell, { Section, ActionButton, TextareaWithCopy, TextInput, Select } from '../components/ToolShell'

export default function TextSummary() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [maxChars, setMaxChars] = useState('200')
  const [mode, setMode] = useState('chars')

  const handleSummarize = () => {
    const limit = parseInt(maxChars) || 200

    if (mode === 'chars') {
      if (input.length <= limit) {
        setOutput(input)
      } else {
        setOutput(input.slice(0, limit) + '...')
      }
    } else if (mode === 'sentences') {
      const sentences = input.split(/(?<=[。！？.!?\n])/).filter((s) => s.trim() !== '')
      let result = ''
      let count = 0
      for (const s of sentences) {
        if (count + s.length > limit && count > 0) break
        result += s
        count += s.length
      }
      setOutput(result || input.slice(0, limit) + '...')
    } else if (mode === 'paragraphs') {
      const paragraphs = input.split(/\n\s*\n/).filter((p) => p.trim() !== '')
      let result = ''
      let count = 0
      for (const p of paragraphs) {
        if (count + p.length > limit && count > 0) break
        if (result) result += '\n\n'
        result += p
        count += p.length
      }
      setOutput(result || input.slice(0, limit) + '...')
    }
  }

  return (
    <ToolShell title="文本摘要" description="按字数、句子或段落对文本进行截断摘要">
      <Section>
        <TextareaWithCopy value={input} onChange={setInput} placeholder="输入需要摘要的文本..." label="输入文本" rows={8} />
        <div className="flex flex-wrap gap-3 items-end mt-3 mb-3">
          <TextInput value={maxChars} onChange={setMaxChars} placeholder="200" label="保留字数" type="number" />
          <Select value={mode} onChange={setMode} options={[
            { value: 'chars', label: '按字数截断' },
            { value: 'sentences', label: '按句子截断' },
            { value: 'paragraphs', label: '按段落截断' },
          ]} label="截断模式" />
          <ActionButton onClick={handleSummarize}>生成摘要</ActionButton>
        </div>
      </Section>

      {output && (
        <Section title="摘要结果">
          <TextareaWithCopy value={output} readOnly rows={6} />
        </Section>
      )}
    </ToolShell>
  )
}
