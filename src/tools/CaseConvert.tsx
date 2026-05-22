import { useState } from 'react'
import ToolShell, { Section, ActionButton, TextareaWithCopy } from '../components/ToolShell'

export default function CaseConvert() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')

  const toUpperCase = () => setOutput(input.toUpperCase())
  const toLowerCase = () => setOutput(input.toLowerCase())

  const toTitleCase = () => {
    setOutput(
      input.replace(/\b[a-zA-Z]/g, (c) => c.toUpperCase())
    )
  }

  const toCamelCase = () => {
    setOutput(
      input
        .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
        .replace(/^[A-Z]/, (c) => c.toLowerCase())
    )
  }

  const toPascalCase = () => {
    const camel = input
      .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
      .replace(/^[A-Z]/, (c) => c.toLowerCase())
    setOutput(camel.replace(/^[a-z]/, (c) => c.toUpperCase()))
  }

  const toSnakeCase = () => {
    setOutput(
      input
        .replace(/([a-z])([A-Z])/g, '$1_$2')
        .replace(/[\s-]+/g, '_')
        .toLowerCase()
    )
  }

  const toKebabCase = () => {
    setOutput(
      input
        .replace(/([a-z])([A-Z])/g, '$1-$2')
        .replace(/[\s_]+/g, '-')
        .toLowerCase()
    )
  }

  const toConstantCase = () => {
    setOutput(
      input
        .replace(/([a-z])([A-Z])/g, '$1_$2')
        .replace(/[\s-]+/g, '_')
        .toUpperCase()
    )
  }

  return (
    <ToolShell title="大小写转换" description="支持多种大小写与命名风格的相互转换">
      <Section>
        <TextareaWithCopy value={input} onChange={setInput} placeholder="输入要转换的文本..." label="输入文本" rows={6} />
        <div className="flex flex-wrap gap-2 mt-3">
          <ActionButton onClick={toUpperCase}>大写</ActionButton>
          <ActionButton onClick={toLowerCase}>小写</ActionButton>
          <ActionButton onClick={toTitleCase}>首字母大写</ActionButton>
          <ActionButton onClick={toCamelCase} variant="secondary">驼峰(camelCase)</ActionButton>
          <ActionButton onClick={toPascalCase} variant="secondary">帕斯卡(PascalCase)</ActionButton>
          <ActionButton onClick={toSnakeCase} variant="secondary">蛇形(snake_case)</ActionButton>
          <ActionButton onClick={toKebabCase} variant="secondary">短横线(kebab-case)</ActionButton>
          <ActionButton onClick={toConstantCase} variant="secondary">常量(CONSTANT_CASE)</ActionButton>
        </div>
      </Section>

      {output && (
        <Section title="转换结果">
          <TextareaWithCopy value={output} readOnly rows={6} />
        </Section>
      )}
    </ToolShell>
  )
}
