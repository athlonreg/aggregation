import { useState } from 'react'
import ToolShell, { Section, ActionButton, TextareaWithCopy, Select } from '../components/ToolShell'

function jsonToYaml(obj: unknown, indent = 0): string {
  const prefix = '  '.repeat(indent)
  if (obj === null || obj === undefined) return 'null'
  if (typeof obj === 'boolean') return obj ? 'true' : 'false'
  if (typeof obj === 'number') return String(obj)
  if (typeof obj === 'string') {
    if (obj.includes('\n') || obj.includes(':') || obj.includes('#')) {
      return `"${obj.replace(/"/g, '\\"')}"`
    }
    return obj
  }
  if (Array.isArray(obj)) {
    if (obj.length === 0) return '[]'
    return obj.map(item => {
      const val = jsonToYaml(item, indent + 1)
      if (typeof item === 'object' && item !== null) {
        return `\n${prefix}- ${val.trimStart()}`
      }
      return `\n${prefix}- ${val}`
    }).join('')
  }
  if (typeof obj === 'object') {
    const entries = Object.entries(obj as Record<string, unknown>)
    if (entries.length === 0) return '{}'
    return entries.map(([key, val]) => {
      const v = jsonToYaml(val, indent + 1)
      if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
        return `\n${prefix}${key}:${jsonToYaml(val, indent + 1)}`
      }
      if (Array.isArray(val) && val.length > 0) {
        return `\n${prefix}${key}:${v}`
      }
      return `\n${prefix}${key}: ${v}`
    }).join('')
  }
  return String(obj)
}

function jsonToCsv(data: unknown): string {
  if (!Array.isArray(data)) {
    return '错误: JSON 数据必须是数组格式才能转换为 CSV'
  }
  if (data.length === 0) return ''
  if (typeof data[0] !== 'object' || data[0] === null) {
    return data.map(String).join(',')
  }
  const keys = Object.keys(data[0] as Record<string, unknown>)
  const header = keys.join(',')
  const rows = (data as Record<string, unknown>[]).map(row =>
    keys.map(k => {
      const val = row[k]
      if (val === null || val === undefined) return ''
      const str = String(val)
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return '"' + str.replace(/"/g, '""') + '"'
      }
      return str
    }).join(',')
  )
  return [header, ...rows].join('\n')
}

function jsonToTsv(data: unknown): string {
  if (!Array.isArray(data)) {
    return '错误: JSON 数据必须是数组格式才能转换为 TSV'
  }
  if (data.length === 0) return ''
  if (typeof data[0] !== 'object' || data[0] === null) {
    return data.map(String).join('\t')
  }
  const keys = Object.keys(data[0] as Record<string, unknown>)
  const header = keys.join('\t')
  const rows = (data as Record<string, unknown>[]).map(row =>
    keys.map(k => {
      const val = row[k]
      return val === null || val === undefined ? '' : String(val)
    }).join('\t')
  )
  return [header, ...rows].join('\n')
}

function jsonToXml(obj: unknown, rootTag = 'root', indent = 0): string {
  const prefix = '  '.repeat(indent)
  if (obj === null || obj === undefined) {
    return `${prefix}<${rootTag}/>`
  }
  if (typeof obj !== 'object') {
    return `${prefix}<${rootTag}>${escapeXml(String(obj))}</${rootTag}>`
  }
  if (Array.isArray(obj)) {
    return obj.map(item => jsonToXml(item, 'item', indent)).join('\n')
  }
  const entries = Object.entries(obj as Record<string, unknown>)
  const children = entries.map(([key, val]) => {
    const safeKey = key.replace(/[^a-zA-Z0-9_-]/g, '_')
    if (Array.isArray(val)) {
      return val.map(item => jsonToXml(item, safeKey, indent + 1)).join('\n')
    }
    return jsonToXml(val, safeKey, indent + 1)
  }).join('\n')
  return `${prefix}<${rootTag}>\n${children}\n${prefix}</${rootTag}>`
}

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function jsonToPhpArray(obj: unknown, indent = 0): string {
  const prefix = '  '.repeat(indent)
  if (obj === null || obj === undefined) return 'null'
  if (typeof obj === 'boolean') return obj ? 'true' : 'false'
  if (typeof obj === 'number') return String(obj)
  if (typeof obj === 'string') return `'${obj.replace(/'/g, "\\'")}'`
  if (Array.isArray(obj)) {
    if (obj.length === 0) return '[]'
    const items = obj.map((item, i) => `${prefix}    ${i} => ${jsonToPhpArray(item, indent + 1)}`)
    return `[\n${items.join(',\n')}\n${prefix}]`
  }
  if (typeof obj === 'object') {
    const entries = Object.entries(obj as Record<string, unknown>)
    if (entries.length === 0) return '[]'
    const items = entries.map(([key, val]) =>
      `${prefix}    '${key}' => ${jsonToPhpArray(val, indent + 1)}`
    )
    return `[\n${items.join(',\n')}\n${prefix}]`
  }
  return String(obj)
}

const FORMAT_OPTIONS = [
  { value: 'yaml', label: 'YAML' },
  { value: 'csv', label: 'CSV' },
  { value: 'xml', label: 'XML' },
  { value: 'tsv', label: 'TSV' },
  { value: 'php', label: 'PHP Array' },
]

export default function JsonConvert() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [format, setFormat] = useState('yaml')

  const convert = () => {
    try {
      const data = JSON.parse(input)
      switch (format) {
        case 'yaml':
          setOutput(jsonToYaml(data))
          break
        case 'csv':
          setOutput(jsonToCsv(data))
          break
        case 'xml':
          setOutput(jsonToXml(data))
          break
        case 'tsv':
          setOutput(jsonToTsv(data))
          break
        case 'php':
          setOutput(jsonToPhpArray(data))
          break
      }
    } catch (e) {
      setOutput('错误: 无效的 JSON 格式 - ' + (e as Error).message)
    }
  }

  return (
    <ToolShell title="JSON 转换" description="将 JSON 转换为 YAML、CSV、XML、TSV、PHP Array 等格式">
      <Section>
        <TextareaWithCopy
          label="输入 JSON"
          value={input}
          onChange={setInput}
          placeholder='[{"name":"张三","age":25},{"name":"李四","age":30}]'
          rows={8}
        />
      </Section>

      <div className="flex gap-2 items-end flex-wrap">
        <Select value={format} onChange={setFormat} options={FORMAT_OPTIONS} label="目标格式" />
        <ActionButton onClick={convert}>转换</ActionButton>
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
