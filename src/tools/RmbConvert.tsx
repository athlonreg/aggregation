import { useState } from 'react'
import ToolShell, { Section, ActionButton, TextInput } from '../components/ToolShell'
import { rmbToUpper } from '../utils/rmb'
import { CopyButton } from '../components/ToolShell'

export default function RmbConvert() {
  const [input, setInput] = useState('')
  const [result, setResult] = useState('')
  const [error, setError] = useState('')

  const handleConvert = () => {
    setError('')
    try {
      setResult(rmbToUpper(input))
    } catch (e) {
      setError((e as Error).message)
      setResult('')
    }
  }

  return (
    <ToolShell title="人民币大写" description="将金额数字转换为人民币大写">
      <Section>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-48">
            <TextInput value={input} onChange={setInput} placeholder="123456.78" label="金额" />
          </div>
          <ActionButton onClick={handleConvert}>转换</ActionButton>
        </div>
        {error && <div className="mt-2 text-sm text-red-500">{error}</div>}
        {result && (
          <div className="mt-4 relative p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-sm text-gray-500 mb-1">大写金额</div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">{result}</div>
            <CopyButton text={result} className="!absolute !top-3 !right-3" />
          </div>
        )}
      </Section>
    </ToolShell>
  )
}
