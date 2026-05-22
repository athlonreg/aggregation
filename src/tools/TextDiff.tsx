import { useState } from 'react'
import ToolShell, { Section, ActionButton, TextareaWithCopy } from '../components/ToolShell'

export default function TextDiff() {
  const [oldText, setOldText] = useState('')
  const [newText, setNewText] = useState('')
  const [diff, setDiff] = useState<{ type: 'same' | 'added' | 'removed'; line: string }[]>([])

  const handleCompare = () => {
    const oldLines = oldText.split('\n')
    const newLines = newText.split('\n')
    const maxLen = Math.max(oldLines.length, newLines.length)
    const result: { type: 'same' | 'added' | 'removed'; line: string }[] = []

    for (let i = 0; i < maxLen; i++) {
      const oldLine = i < oldLines.length ? oldLines[i] : undefined
      const newLine = i < newLines.length ? newLines[i] : undefined

      if (oldLine === undefined) {
        result.push({ type: 'added', line: newLine! })
      } else if (newLine === undefined) {
        result.push({ type: 'removed', line: oldLine })
      } else if (oldLine === newLine) {
        result.push({ type: 'same', line: oldLine })
      } else {
        result.push({ type: 'removed', line: oldLine })
        result.push({ type: 'added', line: newLine })
      }
    }

    setDiff(result)
  }

  return (
    <ToolShell title="文本对比" description="逐行对比两段文本，高亮显示差异">
      <Section>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
          <TextareaWithCopy value={oldText} onChange={setOldText} placeholder="输入原始文本..." label="原始文本" rows={10} />
          <TextareaWithCopy value={newText} onChange={setNewText} placeholder="输入新文本..." label="新文本" rows={10} />
        </div>
        <ActionButton onClick={handleCompare}>对比</ActionButton>
      </Section>

      {diff.length > 0 && (
        <Section title="对比结果">
          <div className="font-mono text-sm rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            {diff.map((item, i) => {
              const colorClass =
                item.type === 'added'
                  ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                  : item.type === 'removed'
                  ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                  : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300'
              const prefix = item.type === 'added' ? '+' : item.type === 'removed' ? '-' : ' '

              return (
                <div key={i} className={`px-3 py-1 border-b border-gray-100 dark:border-gray-800 ${colorClass}`}>
                  <span className="text-gray-400 select-none mr-2 inline-block w-4 text-right">{prefix}</span>
                  {item.line || ' '}
                </div>
              )
            })}
          </div>
        </Section>
      )}
    </ToolShell>
  )
}
