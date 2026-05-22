import { useState } from 'react'
import ToolShell, { Section, ActionButton, TextareaWithCopy, Select } from '../components/ToolShell'

type Mode = 'text2hex' | 'hex2text' | 'text2bin' | 'bin2text'

const modeOptions = [
  { value: 'text2hex', label: '文本 → Hex' },
  { value: 'hex2text', label: 'Hex → 文本' },
  { value: 'text2bin', label: '文本 → 二进制' },
  { value: 'bin2text', label: '二进制 → 文本' },
]

export default function HexCodec() {
  const [mode, setMode] = useState<Mode>('text2hex')
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')

  const handleConvert = () => {
    setError('')
    try {
      switch (mode) {
        case 'text2hex': {
          const hex = Array.from(input)
            .map(c => c.charCodeAt(0).toString(16).padStart(2, '0'))
            .join(' ')
          setOutput(hex)
          break
        }
        case 'hex2text': {
          const cleaned = input.replace(/[^0-9a-fA-F]/g, ' ').trim()
          const pairs = cleaned.split(/\s+/).filter(Boolean)
          const text = pairs
            .map(h => String.fromCharCode(parseInt(h, 16)))
            .join('')
          setOutput(text)
          break
        }
        case 'text2bin': {
          const bin = Array.from(input)
            .map(c => c.charCodeAt(0).toString(2).padStart(8, '0'))
            .join(' ')
          setOutput(bin)
          break
        }
        case 'bin2text': {
          const cleaned = input.replace(/[^01]/g, ' ').trim()
          const bytes = cleaned.split(/\s+/).filter(Boolean)
          const text = bytes
            .map(b => String.fromCharCode(parseInt(b, 2)))
            .join('')
          setOutput(text)
          break
        }
      }
    } catch (e) {
      setError((e as Error).message)
      setOutput('')
    }
  }

  return (
    <ToolShell title="Hex 编解码" description="文本与 Hex、二进制之间的相互转换">
      <Section>
        <div className="flex flex-wrap gap-3 mb-3">
          <Select value={mode} onChange={v => setMode(v as Mode)} options={modeOptions} label="转换模式" />
        </div>
        <TextareaWithCopy value={input} onChange={setInput} placeholder="输入内容..." label="输入" />
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
