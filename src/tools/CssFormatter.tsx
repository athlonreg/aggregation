import { useState } from 'react'
import ToolShell, { Section, ActionButton, TextareaWithCopy } from '../components/ToolShell'

function formatCss(css: string): string {
  let result = css.replace(/\s+/g, ' ').trim()

  // Add newline after {
  result = result.replace(/\{/g, ' {\n')
  // Add newline after }
  result = result.replace(/\}/g, '\n}\n')
  // Add newline after ;
  result = result.replace(/;/g, ';\n')

  // Split into lines and indent
  const lines = result.split('\n').map(l => l.trim()).filter(Boolean)
  let indent = 0
  const formatted: string[] = []

  for (const line of lines) {
    if (line === '}') {
      indent = Math.max(indent - 1, 0)
      formatted.push('  '.repeat(indent) + line)
    } else if (line.endsWith('{')) {
      formatted.push('  '.repeat(indent) + line)
      indent++
    } else {
      formatted.push('  '.repeat(indent) + line)
    }
  }

  return formatted.join('\n').replace(/\n{3,}/g, '\n\n').trim()
}

function compressCss(css: string): string {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([{}:;,>~+])\s*/g, '$1')
    .replace(/;}/g, '}')
    .trim()
}

export default function CssFormatter() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')

  return (
    <ToolShell title="CSS 格式化" description="格式化和压缩 CSS 代码">
      <Section>
        <TextareaWithCopy
          label="输入 CSS"
          value={input}
          onChange={setInput}
          placeholder="粘贴 CSS 代码..."
          rows={8}
        />
      </Section>

      <div className="flex gap-2 flex-wrap">
        <ActionButton onClick={() => setOutput(formatCss(input))}>格式化</ActionButton>
        <ActionButton onClick={() => setOutput(compressCss(input))} variant="secondary">压缩</ActionButton>
      </div>

      <Section>
        <TextareaWithCopy
          label="输出结果"
          value={output}
          readOnly
          rows={8}
        />
      </Section>
    </ToolShell>
  )
}
