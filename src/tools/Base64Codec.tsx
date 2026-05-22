import { useState } from 'react'
import ToolShell, { Section, ActionButton, TextareaWithCopy } from '../components/ToolShell'

export default function Base64Codec() {
  // Text section state
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')

  // File section state
  const [fileOutput, setFileOutput] = useState('')

  const handleEncode = () => {
    setError('')
    try {
      setOutput(btoa(unescape(encodeURIComponent(input))))
    } catch (e) {
      setError((e as Error).message)
      setOutput('')
    }
  }

  const handleDecode = () => {
    setError('')
    try {
      setOutput(decodeURIComponent(escape(atob(input))))
    } catch (e) {
      setError((e as Error).message)
      setOutput('')
    }
  }

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // Strip data URL prefix to get raw base64
      const base64 = result.includes(',') ? result.split(',')[1] : result
      setFileOutput(base64)
    }
    reader.readAsDataURL(file)
  }

  return (
    <ToolShell title="Base64 编解码" description="文本与文件的 Base64 编码、解码">
      {/* Text Base64 */}
      <Section title="文本 Base64">
        <TextareaWithCopy value={input} onChange={setInput} placeholder="输入要编码或解码的文本..." label="输入" />
        <div className="mt-3 flex gap-2">
          <ActionButton onClick={handleEncode}>编码</ActionButton>
          <ActionButton onClick={handleDecode}>解码</ActionButton>
          <ActionButton onClick={() => { setInput(''); setOutput(''); setError('') }} variant="secondary">清空</ActionButton>
        </div>
        {error && <div className="mt-2 text-sm text-red-500">{error}</div>}
        {output && <div className="mt-3"><TextareaWithCopy value={output} readOnly label="输出" /></div>}
      </Section>

      {/* File Base64 */}
      <Section title="文件 Base64">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">选择文件</label>
        <input
          type="file"
          onChange={handleFile}
          className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 dark:file:bg-blue-900/30 dark:file:text-blue-300 hover:file:bg-blue-100 dark:hover:file:bg-blue-900/50 file:cursor-pointer"
        />
        {fileOutput && <div className="mt-3"><TextareaWithCopy value={fileOutput} readOnly label="Base64 结果" rows={8} /></div>}
      </Section>
    </ToolShell>
  )
}
