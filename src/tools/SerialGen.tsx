import { useState } from 'react'
import ToolShell, { Section, ActionButton, TextareaWithCopy, TextInput, Select } from '../components/ToolShell'

const DIGITS = '0123456789'
const ALPHANUM = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

function randomFrom(charset: string, length: number): string {
  const array = new Uint32Array(length)
  crypto.getRandomValues(array)
  return Array.from(array, (v) => charset[v % charset.length]).join('')
}

function generateUUID(): string {
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  array[6] = (array[6] & 0x0f) | 0x40
  array[8] = (array[8] & 0x3f) | 0x80
  const hex = Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

function formatSerial(raw: string, sep: string, groupLen: number): string {
  if (!sep || groupLen <= 0) return raw
  const parts: string[] = []
  for (let i = 0; i < raw.length; i += groupLen) {
    parts.push(raw.slice(i, i + groupLen))
  }
  return parts.join(sep)
}

type Format = 'digits' | 'alphanum' | 'uuid' | 'custom'

export default function SerialGen() {
  const [prefix, setPrefix] = useState('SN')
  const [count, setCount] = useState('10')
  const [length, setLength] = useState('12')
  const [format, setFormat] = useState<Format>('alphanum')
  const [separator, setSeparator] = useState('-')
  const [groupLen, setGroupLen] = useState('4')
  const [customCharset, setCustomCharset] = useState('')
  const [output, setOutput] = useState('')

  const handleGenerate = () => {
    const n = Math.min(Math.max(parseInt(count) || 10, 1), 1000)
    const len = Math.min(Math.max(parseInt(length) || 12, 4), 64)
    const gl = Math.max(parseInt(groupLen) || 4, 1)

    const serials = Array.from({ length: n }, () => {
      if (format === 'uuid') {
        return prefix ? `${prefix}-${generateUUID()}` : generateUUID()
      }

      let charset = ALPHANUM
      if (format === 'digits') charset = DIGITS
      else if (format === 'custom' && customCharset) charset = customCharset

      const raw = randomFrom(charset, len)
      const formatted = formatSerial(raw, separator, gl)
      return prefix ? `${prefix}${separator}${formatted}` : formatted
    })

    setOutput(serials.join('\n'))
  }

  return (
    <ToolShell title="序列号生成" description="生成带格式的序列号、编号或唯一标识">
      <Section>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="w-28">
            <TextInput value={prefix} onChange={setPrefix} placeholder="SN" label="前缀" />
          </div>
          <div className="w-20">
            <TextInput value={count} onChange={setCount} placeholder="10" label="数量" />
          </div>
          <div className="w-20">
            <TextInput value={length} onChange={setLength} placeholder="12" label="长度" />
          </div>
          <Select value={format} onChange={v => setFormat(v as Format)} options={[
            { value: 'digits', label: '纯数字' },
            { value: 'alphanum', label: '字母+数字' },
            { value: 'uuid', label: 'UUID格式' },
            { value: 'custom', label: '自定义' },
          ]} label="格式" />
        </div>
        <div className="flex flex-wrap gap-3 items-end mt-3">
          <div className="w-24">
            <TextInput value={separator} onChange={setSeparator} placeholder="-" label="分隔符" />
          </div>
          <div className="w-24">
            <TextInput value={groupLen} onChange={setGroupLen} placeholder="4" label="分组长度" />
          </div>
          {format === 'custom' && (
            <div className="flex-1 min-w-[200px]">
              <TextInput value={customCharset} onChange={setCustomCharset} placeholder="自定义字符集，如 ABC123" label="字符集" />
            </div>
          )}
          <ActionButton onClick={handleGenerate}>生成</ActionButton>
        </div>
        {output && (
          <div className="mt-3">
            <TextareaWithCopy value={output} readOnly label="结果" rows={Math.min(parseInt(count) || 10, 15)} />
          </div>
        )}
      </Section>
    </ToolShell>
  )
}
