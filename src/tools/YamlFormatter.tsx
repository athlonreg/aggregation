import { useState } from 'react'
import ToolShell, { Section, TextareaWithCopy, ActionButton } from '../components/ToolShell'
import { formatYaml, validateYaml, yamlToJson } from '../utils/format'

export default function YamlFormatter() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [validation, setValidation] = useState<{ valid: boolean; error?: string } | null>(null)

  const handleFormat = () => {
    try {
      setOutput(formatYaml(input))
      setValidation({ valid: true })
    } catch (e) {
      setValidation({ valid: false, error: (e as Error).message })
      setOutput('')
    }
  }

  const handleValidate = () => {
    setValidation(validateYaml(input))
  }

  const handleToJson = () => {
    try {
      setOutput(yamlToJson(input))
      setValidation({ valid: true })
    } catch (e) {
      setValidation({ valid: false, error: (e as Error).message })
    }
  }

  return (
    <ToolShell title="YAML 格式化" description="YAML 格式化、校验与转 JSON">
      <Section>
        <div className="flex flex-wrap gap-3 items-end mb-3">
          <ActionButton onClick={handleFormat}>格式化</ActionButton>
          <ActionButton onClick={handleValidate} variant="secondary">校验</ActionButton>
          <ActionButton onClick={handleToJson} variant="secondary">转 JSON</ActionButton>
        </div>
        <TextareaWithCopy value={input} onChange={setInput} placeholder="粘贴 YAML..." label="输入" rows={8} />
        {validation && (
          <div className={`mt-2 text-sm ${validation.valid ? 'text-green-600' : 'text-red-500'}`}>
            {validation.valid ? '✓ YAML 格式正确' : `✗ ${validation.error}`}
          </div>
        )}
        {output && <div className="mt-3"><TextareaWithCopy value={output} readOnly label="输出" /></div>}
      </Section>
    </ToolShell>
  )
}
