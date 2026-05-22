import { useState } from 'react'
import ToolShell, { Section, TextareaWithCopy, ActionButton, Select } from '../components/ToolShell'
import { base64Encode, base64Decode, hexEncode, hexDecode, unicodeEncode, unicodeDecode } from '../utils/encoding'

type Mode = 'base64' | 'hex' | 'unicode'
type Direction = 'encode' | 'decode'

export default function Encoding() {
  const [mode, setMode] = useState<Mode>('base64')
  const [direction, setDirection] = useState<Direction>('encode')
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')

  const handleConvert = () => {
    setError('')
    try {
      const fn = { base64: { encode: base64Encode, decode: base64Decode }, hex: { encode: hexEncode, decode: hexDecode }, unicode: { encode: unicodeEncode, decode: unicodeDecode } }
      setOutput(fn[mode][direction](input))
    } catch (e) {
      setError((e as Error).message)
      setOutput('')
    }
  }

  return (
    <ToolShell title="编码转换" description="Base64、Hex、Unicode 编码与解码">
      <Section>
        <div className="flex flex-wrap gap-3 mb-4">
          <Select value={mode} onChange={v => setMode(v as Mode)} options={[
            { value: 'base64', label: 'Base64' },
            { value: 'hex', label: 'Hex (十六进制)' },
            { value: 'unicode', label: 'Unicode 转义' },
          ]} label="编码类型" />
          <Select value={direction} onChange={v => setDirection(v as Direction)} options={[
            { value: 'encode', label: '编码' },
            { value: 'decode', label: '解码' },
          ]} label="方向" />
        </div>
        <TextareaWithCopy value={input} onChange={setInput} placeholder="输入文本..." label="输入" />
        <div className="mt-3 flex gap-2">
          <ActionButton onClick={handleConvert}>{direction === 'encode' ? '编码' : '解码'}</ActionButton>
          <ActionButton onClick={() => { setInput(''); setOutput(''); setError('') }} variant="secondary">清空</ActionButton>
        </div>
        {error && <div className="mt-2 text-sm text-red-500">{error}</div>}
        {output && <div className="mt-3"><TextareaWithCopy value={output} readOnly label="输出" /></div>}
      </Section>
    </ToolShell>
  )
}
