import { useState } from 'react'
import ToolShell, { Section, ActionButton, TextareaWithCopy } from '../components/ToolShell'

function formatXml(xml: string): string {
  let formatted = ''
  let indent = 0
  const lines = xml.replace(/>\s*</g, '><').split(/(<[^>]+>)/).filter(Boolean)

  for (const line of lines) {
    if (line.match(/^<\//)) {
      indent--
      formatted += '  '.repeat(Math.max(indent, 0)) + line + '\n'
    } else if (line.match(/^<[^/][^>]*\/>$/)) {
      formatted += '  '.repeat(indent) + line + '\n'
    } else if (line.match(/^</)) {
      formatted += '  '.repeat(indent) + line + '\n'
      indent++
    } else {
      formatted += '  '.repeat(indent) + line.trim() + '\n'
    }
  }

  return formatted.trim()
}

function compressXml(xml: string): string {
  return xml.replace(/>\s+</g, '><').replace(/\s+/g, ' ').trim()
}

function validateXml(xml: string): string {
  const errors: string[] = []
  const stack: string[] = []
  const cleaned = xml.replace(/<!--[\s\S]*?-->/g, '').replace(/<\?[\s\S]*?\?>/g, '')
  const tags = cleaned.match(/<\/?[a-zA-Z_][\w.-]*(?:\s[^>]*)?\s*\/?>/g) || []

  for (const tag of tags) {
    if (tag.match(/^<\//)) {
      const name = tag.match(/^<\/([a-zA-Z_][\w.-]*)/)?.[1]
      if (!name) {
        errors.push('无效的结束标签: ' + tag)
        continue
      }
      if (stack.length === 0) {
        errors.push('多余的结束标签: </' + name + '>')
      } else {
        const last = stack.pop()!
        if (last !== name) {
          errors.push(`标签不匹配: 期望 </${last}>, 实际 </${name}>`)
        }
      }
    } else if (!tag.match(/\/>$/)) {
      const name = tag.match(/^<([a-zA-Z_][\w.-]*)/)?.[1]
      if (name) stack.push(name)
    }
  }

  if (stack.length > 0) {
    errors.push(`未关闭的标签: ${stack.map(t => '<' + t + '>').join(', ')}`)
  }

  if (errors.length === 0) {
    return 'XML 格式正确，共 ' + tags.length + ' 个标签。'
  }
  return '发现 ' + errors.length + ' 个错误:\n' + errors.join('\n')
}

export default function XmlFormatter() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')

  return (
    <ToolShell title="XML 格式化" description="格式化、压缩和校验 XML 数据">
      <Section>
        <TextareaWithCopy
          label="输入 XML"
          value={input}
          onChange={setInput}
          placeholder="粘贴 XML 内容..."
          rows={8}
        />
      </Section>

      <div className="flex gap-2 flex-wrap">
        <ActionButton onClick={() => setOutput(formatXml(input))}>格式化</ActionButton>
        <ActionButton onClick={() => setOutput(compressXml(input))} variant="secondary">压缩</ActionButton>
        <ActionButton onClick={() => setOutput(validateXml(input))} variant="secondary">校验</ActionButton>
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
