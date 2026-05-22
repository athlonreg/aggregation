import { useState } from 'react'
import ToolShell, { Section, ActionButton, TextareaWithCopy, Select } from '../components/ToolShell'

type Mode = 'text2unicode' | 'unicode2text'

const modeOptions = [
  { value: 'text2unicode', label: '文本 → Unicode' },
  { value: 'unicode2text', label: 'Unicode → 文本' },
]

export default function UnicodeCodec() {
  const [mode, setMode] = useState<Mode>('text2unicode')
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')

  const handleConvert = () => {
    setError('')
    try {
      if (mode === 'text2unicode') {
        const result = Array.from(input)
          .map(c => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'))
          .join('')
        setOutput(result)
      } else {
        const result = input.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) =>
          String.fromCharCode(parseInt(hex, 16))
        )
        setOutput(result)
      }
    } catch (e) {
      setError((e as Error).message)
      setOutput('')
    }
  }

  return (
    <ToolShell title="Unicode 编解码" description="文本与 Unicode 转义序列之间的相互转换">
      <Section>
        <div className="flex flex-wrap gap-3 mb-3">
          <Select value={mode} onChange={v => setMode(v as Mode)} options={modeOptions} label="转换模式" />
        </div>
        <TextareaWithCopy value={input} onChange={setInput} placeholder={mode === 'text2unicode' ? '输入文本...' : '输入 \\uXXXX 序列...'} label="输入" />
        <div className="mt-3 flex gap-2">
          <ActionButton onClick={handleConvert}>转换</ActionButton>
          <ActionButton onClick={() => { setInput(''); setOutput(''); setError('') }} variant="secondary">清空</ActionButton>
        </div>
        {error && <div className="mt-2 text-sm text-red-500">{error}</div>}
        {output && <div className="mt-3"><TextareaWithCopy value={output} readOnly label="输出" /></div>}
      </Section>
    </ToolShell>
  )
}
