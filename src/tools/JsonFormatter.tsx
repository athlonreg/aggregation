import { useState } from 'react'
import ToolShell, { Section, TextareaWithCopy, ActionButton, Select } from '../components/ToolShell'
import { formatJson, minifyJson, validateJson, jsonToYaml } from '../utils/format'

export default function JsonFormatter() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [indent, setIndent] = useState('2')
  const [validation, setValidation] = useState<{ valid: boolean; error?: string } | null>(null)

  const handleFormat = () => {
    try {
      setOutput(formatJson(input, parseInt(indent)))
      setValidation({ valid: true })
    } catch (e) {
      setValidation({ valid: false, error: (e as Error).message })
      setOutput('')
    }
  }

  const handleMinify = () => {
    try {
      setOutput(minifyJson(input))
      setValidation({ valid: true })
    } catch (e) {
      setValidation({ valid: false, error: (e as Error).message })
    }
  }

  const handleValidate = () => {
    setValidation(validateJson(input))
  }

  const handleToYaml = () => {
    try {
      setOutput(jsonToYaml(input))
      setValidation({ valid: true })
    } catch (e) {
      setValidation({ valid: false, error: (e as Error).message })
    }
  }

  return (
    <ToolShell title="JSON 格式化" description="JSON 格式化、压缩、校验与转换">
      <Section>
        <div className="flex flex-wrap gap-3 items-end mb-3">
          <Select value={indent} onChange={setIndent} options={[
            { value: '2', label: '2 空格' },
            { value: '4', label: '4 空格' },
            { value: '1', label: '1 空格' },
          ]} label="缩进" />
          <ActionButton onClick={handleFormat}>格式化</ActionButton>
          <ActionButton onClick={handleMinify} variant="secondary">压缩</ActionButton>
          <ActionButton onClick={handleValidate} variant="secondary">校验</ActionButton>
          <ActionButton onClick={handleToYaml} variant="secondary">转 YAML</ActionButton>
        </div>
        <TextareaWithCopy value={input} onChange={setInput} placeholder='粘贴 JSON...\n{"key": "value"}' label="输入" />
        {validation && (
          <div className={`mt-2 text-sm ${validation.valid ? 'text-green-600' : 'text-red-500'}`}>
            {validation.valid ? '✓ JSON 格式正确' : `✗ ${validation.error}`}
          </div>
        )}
        {output && <div className="mt-3"><TextareaWithCopy value={output} readOnly label="输出" /></div>}
      </Section>
    </ToolShell>
  )
}
