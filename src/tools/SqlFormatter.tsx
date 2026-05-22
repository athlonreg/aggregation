import { useState } from 'react'
import ToolShell, { Section, ActionButton, TextareaWithCopy } from '../components/ToolShell'

const MAJOR_KEYWORDS = [
  'SELECT', 'FROM', 'WHERE', 'GROUP BY', 'ORDER BY', 'HAVING',
  'LIMIT', 'OFFSET', 'VALUES', 'SET', 'INTO', 'UPDATE', 'DELETE FROM',
  'INSERT INTO', 'CREATE TABLE', 'ALTER TABLE', 'DROP TABLE',
]

const JOIN_KEYWORDS = [
  'JOIN', 'INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'FULL JOIN',
  'LEFT OUTER JOIN', 'RIGHT OUTER JOIN', 'FULL OUTER JOIN', 'CROSS JOIN',
]

const ALL_KEYWORDS = [
  ...MAJOR_KEYWORDS, ...JOIN_KEYWORDS,
  'AND', 'OR', 'ON', 'AS', 'NOT', 'NULL', 'IS', 'IN', 'LIKE',
  'BETWEEN', 'EXISTS', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END',
  'UNION', 'UNION ALL', 'DISTINCT', 'TOP', 'ALL', 'ASC', 'DESC',
]

function formatSql(sql: string): string {
  let result = sql.replace(/\s+/g, ' ').trim()

  // Uppercase keywords
  const sortedKeywords = [...ALL_KEYWORDS].sort((a, b) => b.length - a.length)
  for (const kw of sortedKeywords) {
    const regex = new RegExp('\\b' + kw.replace(/\s+/g, '\\s+') + '\\b', 'gi')
    result = result.replace(regex, kw)
  }

  // Add newlines before major keywords
  for (const kw of MAJOR_KEYWORDS) {
    const regex = new RegExp('\\s+(' + kw.replace(/\s+/g, '\\s+') + ')\\b', 'g')
    result = result.replace(regex, '\n$1')
  }

  // Add newlines before join keywords
  for (const kw of JOIN_KEYWORDS) {
    const regex = new RegExp('\\s+(' + kw.replace(/\s+/g, '\\s+') + ')\\b', 'g')
    result = result.replace(regex, '\n$1')
  }

  // Add newlines before AND/OR
  result = result.replace(/\s+(AND|OR)\b/gi, '\n  $1')

  // Add newlines and indent after commas in SELECT
  result = result.replace(/,\s*(?=[^\n])/g, ',\n  ')

  // Clean up extra newlines
  result = result.replace(/\n\s*\n/g, '\n').trim()

  return result
}

function compressSql(sql: string): string {
  return sql.replace(/\s+/g, ' ').trim()
}

export default function SqlFormatter() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')

  return (
    <ToolShell title="SQL 格式化" description="格式化和压缩 SQL 语句">
      <Section>
        <TextareaWithCopy
          label="输入 SQL"
          value={input}
          onChange={setInput}
          placeholder="粘贴 SQL 语句..."
          rows={8}
        />
      </Section>

      <div className="flex gap-2 flex-wrap">
        <ActionButton onClick={() => setOutput(formatSql(input))}>格式化</ActionButton>
        <ActionButton onClick={() => setOutput(compressSql(input))} variant="secondary">压缩</ActionButton>
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
