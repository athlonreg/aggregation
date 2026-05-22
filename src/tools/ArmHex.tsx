import { useState } from 'react'
import ToolShell, { Section, TextareaWithCopy, ActionButton, Select } from '../components/ToolShell'
import { hexToBytes, bytesToHex, hexToBinary, reverseEndian, intToHex, hexToInt, decodeArmInstruction } from '../utils/armhex'

export default function ArmHex() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [mode, setMode] = useState<string>('bytes')
  const [signed, setSigned] = useState(false)
  const [intBits, setIntBits] = useState('4')
  const [error, setError] = useState('')

  const handleConvert = () => {
    setError('')
    try {
      switch (mode) {
        case 'bytes': setOutput(bytesToHex(hexToBytes(input))); break
        case 'binary': setOutput(hexToBinary(input)); break
        case 'endian': setOutput(reverseEndian(input)); break
        case 'to-int': setOutput(String(hexToInt(input, signed))); break
        case 'from-int': setOutput(intToHex(parseInt(input), parseInt(intBits))); break
        case 'arm': setOutput(decodeArmInstruction(input)); break
      }
    } catch (e) {
      setError((e as Error).message)
      setOutput('')
    }
  }

  return (
    <ToolShell title="ARM HEX 转换" description="十六进制、字节序、ARM 指令解码">
      <Section>
        <div className="flex flex-wrap gap-3 items-end mb-3">
          <Select value={mode} onChange={setMode} options={[
            { value: 'bytes', label: 'HEX → 字节' },
            { value: 'binary', label: 'HEX → 二进制' },
            { value: 'endian', label: '大小端转换' },
            { value: 'to-int', label: 'HEX → 整数' },
            { value: 'from-int', label: '整数 → HEX' },
            { value: 'arm', label: 'ARM 指令解码' },
          ]} label="转换模式" />
          {mode === 'to-int' && (
            <label className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
              <input type="checkbox" checked={signed} onChange={e => setSigned(e.target.checked)} className="rounded" />
              有符号
            </label>
          )}
          {mode === 'from-int' && (
            <Select value={intBits} onChange={setIntBits} options={[
              { value: '1', label: '1 字节' }, { value: '2', label: '2 字节' },
              { value: '4', label: '4 字节' }, { value: '8', label: '8 字节' },
            ]} label="字节数" />
          )}
        </div>
        <TextareaWithCopy value={input} onChange={setInput} placeholder="输入 HEX (如 FF 00 A1) 或整数..." label="输入" />
        <div className="mt-3 flex gap-2">
          <ActionButton onClick={handleConvert}>转换</ActionButton>
          <ActionButton onClick={() => { setInput(''); setOutput(''); setError('') }} variant="secondary">清空</ActionButton>
        </div>
        {error && <div className="mt-2 text-sm text-red-500">{error}</div>}
        {output && <div className="mt-3"><TextareaWithCopy value={output} readOnly label="输出" /></div>}
      </Section>
    </ToolShell>
  )
}
