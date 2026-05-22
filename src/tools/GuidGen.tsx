import { useState } from 'react'
import ToolShell, { Section, TextareaWithCopy, ActionButton, TextInput } from '../components/ToolShell'
import { generateGUID, generateMultiple } from '../utils/uuid'

export default function GuidGen() {
  const [count, setCount] = useState('1')
  const [output, setOutput] = useState('')
  const [noDash, setNoDash] = useState(false)

  const handleGenerate = () => {
    const n = Math.min(Math.max(parseInt(count) || 1, 1), 100)
    const guids = generateMultiple(generateGUID, n)
    const processed = noDash ? guids.map(g => g.replace(/-/g, '')) : guids
    setOutput(processed.join('\n'))
  }

  return (
    <ToolShell title="GUID 生成" description="生成全局唯一标识符 (GUID)">
      <Section>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="w-24">
            <TextInput value={count} onChange={setCount} placeholder="1" label="数量" />
          </div>
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
