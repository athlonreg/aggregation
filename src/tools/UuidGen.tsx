import { useState } from 'react'
import ToolShell, { Section, TextareaWithCopy, ActionButton, Select, TextInput } from '../components/ToolShell'
import { generateUUIDv4, generateUUIDv1, generateMultiple } from '../utils/uuid'

export default function UuidGen() {
  const [version, setVersion] = useState<'v4' | 'v1'>('v4')
  const [count, setCount] = useState('1')
  const [output, setOutput] = useState('')
  const [uppercase, setUppercase] = useState(false)
  const [noDash, setNoDash] = useState(false)

  const handleGenerate = () => {
    const n = Math.min(Math.max(parseInt(count) || 1, 1), 100)
    const gen = version === 'v4' ? generateUUIDv4 : generateUUIDv1
    const uuids = generateMultiple(gen, n)
    const processed = uuids.map(u => {
      let s = uppercase ? u.toUpperCase() : u
      if (noDash) s = s.replace(/-/g, '')
      return s
    })
    setOutput(processed.join('\n'))
  }

  return (
    <ToolShell title="UUID 生成" description="生成 UUID v1 / v4">
      <Section>
        <div className="flex flex-wrap gap-3 items-end">
          <Select value={version} onChange={v => setVersion(v as 'v4' | 'v1')} options={[
            { value: 'v4', label: 'UUID v4 (随机)' },
            { value: 'v1', label: 'UUID v1 (时间戳)' },
          ]} label="版本" />
          <div className="w-24">
            <TextInput value={count} onChange={setCount} placeholder="1" label="数量" />
          </div>
          <label className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
            <input type="checkbox" checked={uppercase} onChange={e => setUppercase(e.target.checked)} className="rounded" />
            大写
          </label>
          <label className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
            <input type="checkbox" checked={noDash} onChange={e => setNoDash(e.target.checked)} className="rounded" />
            无横杠
          </label>
          <ActionButton onClick={handleGenerate}>生成</ActionButton>
        </div>
        {output && <div className="mt-3"><TextareaWithCopy value={output} readOnly label="结果" rows={Math.min(parseInt(count) || 1, 10)} /></div>}
      </Section>
    </ToolShell>
  )
}
