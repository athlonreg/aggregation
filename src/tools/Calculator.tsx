import { useState } from 'react'
import ToolShell, { Section, TextareaWithCopy, ActionButton, Select, TextInput } from '../components/ToolShell'
import { type Base, convertBase, calculate } from '../utils/calculator'

export default function Calculator() {
  const [fromBase, setFromBase] = useState<Base>(10)
  const [toBase, setToBase] = useState<Base>(16)
  const [convertInput, setConvertInput] = useState('')
  const [convertResult, setConvertResult] = useState('')

  const [calcA, setCalcA] = useState('')
  const [calcOp, setCalcOp] = useState('+')
  const [calcB, setCalcB] = useState('')
  const [calcBase, setCalcBase] = useState<Base>(10)
  const [calcResult, setCalcResult] = useState('')

  const baseOptions = [
    { value: '2', label: '二进制 (BIN)' },
    { value: '8', label: '八进制 (OCT)' },
    { value: '10', label: '十进制 (DEC)' },
    { value: '16', label: '十六进制 (HEX)' },
  ]

  const handleConvert = () => {
    try {
      setConvertResult(convertBase(convertInput, fromBase, toBase))
    } catch (e) {
      setConvertResult('错误: ' + (e as Error).message)
    }
  }

  const handleCalc = () => {
    try {
      setCalcResult(calculate(calcA, calcOp, calcB, calcBase))
    } catch (e) {
      setCalcResult('错误: ' + (e as Error).message)
    }
  }

  return (
    <ToolShell title="进制计算器" description="进制转换与二/八/十/十六进制加减乘除运算">
      <Section title="进制转换">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-48">
            <TextInput value={convertInput} onChange={setConvertInput} placeholder="输入数值" label="输入" />
          </div>
          <Select value={String(fromBase)} onChange={v => setFromBase(Number(v) as Base)} options={baseOptions} label="源进制" />
          <Select value={String(toBase)} onChange={v => setToBase(Number(v) as Base)} options={baseOptions} label="目标进制" />
          <ActionButton onClick={handleConvert}>转换</ActionButton>
        </div>
        {convertResult && <TextareaWithCopy value={convertResult} readOnly rows={1} label="结果" />}
      </Section>

      <Section title="进制运算">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-32">
            <TextInput value={calcA} onChange={setCalcA} placeholder="操作数 A" />
          </div>
          <Select value={calcOp} onChange={setCalcOp} options={[
            { value: '+', label: '+' }, { value: '-', label: '-' },
            { value: '*', label: '×' }, { value: '/', label: '÷' },
            { value: '%', label: '%' },
          ]} />
          <div className="flex-1 min-w-32">
            <TextInput value={calcB} onChange={setCalcB} placeholder="操作数 B" />
          </div>
          <Select value={String(calcBase)} onChange={v => setCalcBase(Number(v) as Base)} options={baseOptions} label="进制" />
          <ActionButton onClick={handleCalc}>计算</ActionButton>
        </div>
        {calcResult && <TextareaWithCopy value={calcResult} readOnly rows={1} label="结果" />}
      </Section>
    </ToolShell>
  )
}
