import { useState } from 'react'
import ToolShell, { Section, ActionButton, TextareaWithCopy } from '../components/ToolShell'

const BLOCK_ELEMENTS = new Set([
  'html', 'head', 'body', 'div', 'p', 'section', 'article', 'aside',
  'header', 'footer', 'nav', 'main', 'ul', 'ol', 'li', 'table',
  'thead', 'tbody', 'tr', 'td', 'th', 'form', 'fieldset', 'legend',
  'dl', 'dt', 'dd', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'blockquote', 'pre', 'figure', 'figcaption', 'details', 'summary',
  'select', 'option', 'optgroup', 'textarea', 'button', 'label',
  'title', 'style', 'script', 'noscript', 'iframe', 'br', 'hr',
])

function formatHtml(html: string): string {
  const tokens = html.replace(/>\s+</g, '><').match(/(<[^>]+>|[^<]+)/g) || []
  let indent = 0
  const formatted: string[] = []

  for (const token of tokens) {
    const trimmed = token.trim()
    if (!trimmed) continue

    const selfClose = trimmed.match(/^<([a-zA-Z][\w-]*)[^>]*\/>$/)
    const closeTag = trimmed.match(/^<\/([a-zA-Z][\w-]*)/)
    const openTag = trimmed.match(/^<([a-zA-Z][\w-]*)/)

    if (closeTag) {
      indent = Math.max(indent - 1, 0)
      formatted.push('  '.repeat(indent) + trimmed)
    } else if (selfClose) {
      formatted.push('  '.repeat(indent) + trimmed)
    } else if (openTag) {
      const tag = openTag[1].toLowerCase()
      formatted.push('  '.repeat(indent) + trimmed)
      if (BLOCK_ELEMENTS.has(tag)) {
        indent++
      }
    } else {
      // Text content
      formatted.push('  '.repeat(indent) + trimmed)
    }
  }

  return formatted.join('\n').replace(/\n{3,}/g, '\n\n').trim()
}

function compressHtml(html: string): string {
  return html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/>\s+</g, '><')
    .replace(/\s+/g, ' ')
    .trim()
}

export default function HtmlFormatter() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')

  return (
    <ToolShell title="HTML 格式化" description="格式化和压缩 HTML 代码">
      <Section>
        <TextareaWithCopy
          label="输入 HTML"
          value={input}
          onChange={setInput}
          placeholder="粘贴 HTML 代码..."
          rows={8}
        />
      </Section>

      <div className="flex gap-2 flex-wrap">
        <ActionButton onClick={() => setOutput(formatHtml(input))}>格式化</ActionButton>
        <ActionButton onClick={() => setOutput(compressHtml(input))} variant="secondary">压缩</ActionButton>
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
