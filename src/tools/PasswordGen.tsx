import { useState } from 'react'
import ToolShell, { Section, ActionButton, TextareaWithCopy, TextInput } from '../components/ToolShell'

function generatePassword(length: number, useUpper: boolean, useLower: boolean, useDigits: boolean, useSpecial: boolean): string {
  let charset = ''
  if (useUpper) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  if (useLower) charset += 'abcdefghijklmnopqrstuvwxyz'
  if (useDigits) charset += '0123456789'
  if (useSpecial) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?'
  if (!charset) charset = 'abcdefghijklmnopqrstuvwxyz'

  const array = new Uint32Array(length)
  crypto.getRandomValues(array)
  return Array.from(array, (v) => charset[v % charset.length]).join('')
}

export default function PasswordGen() {
  const [length, setLength] = useState('16')
  const [count, setCount] = useState('1')
  const [useUpper, setUseUpper] = useState(true)
  const [useLower, setUseLower] = useState(true)
  const [useDigits, setUseDigits] = useState(true)
  const [useSpecial, setUseSpecial] = useState(true)
  const [output, setOutput] = useState('')

  const handleGenerate = () => {
    const len = Math.min(Math.max(parseInt(length) || 16, 4), 128)
    const n = Math.min(Math.max(parseInt(count) || 1, 1), 100)
    const passwords = Array.from({ length: n }, () =>
      generatePassword(len, useUpper, useLower, useDigits, useSpecial)
    )
    setOutput(passwords.join('\n'))
  }

  return (
    <ToolShell title="密码生成" description="使用加密安全随机数生成强密码">
      <Section>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="w-24">
            <TextInput value={length} onChange={setLength} placeholder="16" label="密码长度" />
          </div>
          <div className="w-24">
            <TextInput value={count} onChange={setCount} placeholder="1" label="生成数量" />
          </div>
          <label className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
            <input type="checkbox" checked={useUpper} onChange={e => setUseUpper(e.target.checked)} className="rounded" />
            大写字母
          </label>
          <label className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
            <input type="checkbox" checked={useLower} onChange={e => setUseLower(e.target.checked)} className="rounded" />
            小写字母
          </label>
          <label className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
            <input type="checkbox" checked={useDigits} onChange={e => setUseDigits(e.target.checked)} className="rounded" />
            数字
          </label>
          <label className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
            <input type="checkbox" checked={useSpecial} onChange={e => setUseSpecial(e.target.checked)} className="rounded" />
            特殊字符
          </label>
          <ActionButton onClick={handleGenerate}>生成</ActionButton>
        </div>
        {output && (
          <div className="mt-3">
            <TextareaWithCopy value={output} readOnly label="生成结果" rows={Math.min(parseInt(count) || 1, 10)} />
          </div>
        )}
      </Section>
    </ToolShell>
  )
}
