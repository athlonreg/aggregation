import { useState } from 'react'
import ToolShell, { Section, TextareaWithCopy, ActionButton, Select } from '../components/ToolShell'
import { urlEncode, urlDecode, urlFullEncode, urlFullDecode, base64UrlEncode, base64UrlDecode } from '../utils/url'

export default function UrlCodec() {
  const [mode, setMode] = useState<'component' | 'full' | 'base64url'>('component')
  const [direction, setDirection] = useState<'encode' | 'decode'>('encode')
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')

  const handleConvert = () => {
    setError('')
    try {
      const fns = {
        component: { encode: urlEncode, decode: urlDecode },
        full: { encode: urlFullEncode, decode: urlFullDecode },
        base64url: { encode: base64UrlEncode, decode: base64UrlDecode },
      }
      setOutput(fns[mode][direction](input))
    } catch (e) {
      setError((e as Error).message)
      setOutput('')
    }
  }

  return (
    <ToolShell title="URL 编解码" description="URL 编码、解码与 Base64URL 转换">
      <Section>
        <div className="flex flex-wrap gap-3 mb-3">
          <Select value={mode} onChange={v => setMode(v as typeof mode)} options={[
            { value: 'component', label: 'URL Component' },
            { value: 'full', label: 'URL Full' },
            { value: 'base64url', label: 'Base64URL' },
          ]} label="编码方式" />
          <Select value={direction} onChange={v => setDirection(v as 'encode' | 'decode')} options={[
            { value: 'encode', label: '编码' },
            { value: 'decode', label: '解码' },
          ]} label="方向" />
        </div>
        <TextareaWithCopy value={input} onChange={setInput} placeholder="输入 URL 或文本..." label="输入" />
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
