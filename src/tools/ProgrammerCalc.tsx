import { useState, useCallback, useEffect } from 'react'
import ToolShell, { Section } from '../components/ToolShell'

type Base = 2 | 8 | 10 | 16

const BASE_LABELS: Record<Base, string> = { 2: 'BIN', 8: 'OCT', 10: 'DEC', 16: 'HEX' }
const BASE_COLORS: Record<Base, string> = {
  2: 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700',
  8: 'bg-sky-100 dark:bg-sky-900 text-sky-700 dark:text-sky-300 border-sky-300 dark:border-sky-700',
  10: 'bg-violet-100 dark:bg-violet-900 text-violet-700 dark:text-violet-300 border-violet-300 dark:border-violet-700',
  16: 'bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700',
}

function parseValue(s: string, base: Base): number {
  if (!s) return 0
  const clean = s.replace(/\s/g, '')
  if (base === 16) return parseInt(clean, 16) || 0
  if (base === 8) return parseInt(clean, 8) || 0
  if (base === 2) return parseInt(clean, 2) || 0
  return parseInt(clean, 10) || 0
}

function formatValue(n: number, base: Base): string {
  if (!Number.isFinite(n) || !Number.isInteger(n)) return '0'
  // Handle 32-bit signed
  const v = n > 0x7FFFFFFF || n < -0x80000000 ? (n >>> 0) : n
  if (base === 16) return v.toString(16).toUpperCase()
  if (base === 8) return v.toString(8)
  if (base === 2) return v.toString(2)
  return String(v)
}

function formatWithGroups(s: string, base: Base): string {
  if (!s || s === '0') return s
  const groupSize = base === 2 ? 4 : base === 16 ? 2 : 3
  const parts: string[] = []
  for (let i = s.length; i > 0; i -= groupSize) {
    parts.unshift(s.slice(Math.max(0, i - groupSize), i))
  }
  return parts.join(' ')
}

function toSigned32(n: number): number {
  if (n > 0x7FFFFFFF) return n - 0x100000000
  return n
}

function getValidDigits(base: Base): string[] {
  if (base === 2) return ['0', '1']
  if (base === 8) return ['0', '1', '2', '3', '4', '5', '6', '7']
  if (base === 10) return ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
  return ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F']
}

export default function ProgrammerCalc() {
  const [input, setInput] = useState('')
  const [base, setBase] = useState<Base>(10)
  const [value, setValue] = useState(0)
  const [error, setError] = useState('')

  const updateFromInput = useCallback((newInput: string, newBase: Base) => {
    setInput(newInput)
    if (!newInput) { setValue(0); setError(''); return }
    try {
      const v = parseValue(newInput, newBase)
      if (isNaN(v)) { setError('无效输入'); return }
      setValue(v)
      setError('')
    } catch {
      setError('无效输入')
    }
  }, [])

  const changeBase = useCallback((newBase: Base) => {
    setBase(newBase)
    if (value !== 0) {
      setInput(formatValue(value, newBase))
    } else {
      setInput('')
    }
  }, [value])

  const appendDigit = useCallback((d: string) => {
    updateFromInput(input + d, base)
  }, [input, base, updateFromInput])

  const clear = useCallback(() => {
    setInput('')
    setValue(0)
    setError('')
  }, [])

  const backspace = useCallback(() => {
    const newInput = input.slice(0, -1)
    updateFromInput(newInput, base)
  }, [input, base, updateFromInput])

  const toggleBit = useCallback((bitPos: number) => {
    const mask = 1 << bitPos
    setValue(prev => prev ^ mask)
    setInput(formatValue(value ^ (1 << bitPos), base))
  }, [value, base])

  // Bitwise operations
  const applyOp = useCallback((op: string) => {
    try {
      const inputVal = parseValue(input, base)
      let result = 0
      switch (op) {
        case 'NOT': result = ~inputVal; break
        case 'AND': {
          const b = prompt('输入第二个操作数 (十进制):')
          if (b !== null) result = inputVal & parseInt(b)
          break
        }
        case 'OR': {
          const b = prompt('输入第二个操作数 (十进制):')
          if (b !== null) result = inputVal | parseInt(b)
          break
        }
        case 'XOR': {
          const b = prompt('输入第二个操作数 (十进制):')
          if (b !== null) result = inputVal ^ parseInt(b)
          break
        }
        case 'SHL': result = inputVal << 1; break
        case 'SHR': result = inputVal >>> 1; break
        case 'ROL': result = ((inputVal << 1) | (inputVal >>> 31)) >>> 0; break
        case 'ROR': result = ((inputVal >>> 1) | (inputVal << 31)) >>> 0; break
        case 'NEG': result = -inputVal; break
      }
      setValue(result)
      setInput(formatValue(result, base))
      setError('')
    } catch {
      setError('运算错误')
    }
  }, [input, base])

  // Keyboard support
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const key = e.key.toUpperCase()
      const valid = getValidDigits(base)
      if (valid.includes(key)) { e.preventDefault(); appendDigit(key) }
      else if (key === 'BACKSPACE') { e.preventDefault(); backspace() }
      else if (key === 'ESCAPE') { e.preventDefault(); clear() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [base, appendDigit, backspace, clear])

  const Btn = ({ label, onClick, className = '', disabled = false }: { label: string; onClick: () => void; className?: string; disabled?: boolean }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`h-11 rounded-lg text-sm font-medium transition-colors active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed ${className}`}
    >
      {label}
    </button>
  )

  const signed = toSigned32(value)

  return (
    <ToolShell title="程序员计算器" description="支持多进制转换与位运算，可用键盘输入">
      <Section>
        {/* Base selector */}
        <div className="grid grid-cols-4 gap-2 mb-3">
          {([2, 8, 10, 16] as Base[]).map(b => (
            <button
              key={b}
              onClick={() => changeBase(b)}
              className={`px-3 py-2 rounded-lg text-xs font-bold border transition-colors ${
                base === b ? BASE_COLORS[b] : 'bg-gray-100 dark:bg-gray-800 text-gray-500 border-gray-200 dark:border-gray-700'
              }`}
            >
              {BASE_LABELS[b]}
            </button>
          ))}
        </div>

        {/* Display */}
        <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-4 mb-3">
          {/* All bases */}
          <div className="space-y-1 mb-3 text-xs font-mono">
            {([16, 10, 8, 2] as Base[]).filter(b => b !== base).map(b => (
              <div key={b} className="flex items-center gap-2 text-gray-400 dark:text-gray-500">
                <span className="w-8 text-right font-bold">{BASE_LABELS[b]}</span>
                <span className="truncate">{formatWithGroups(formatValue(value, b), b)}</span>
              </div>
            ))}
          </div>
          {/* Current input */}
          <div className="text-right text-sm text-gray-500 dark:text-gray-400 h-6 truncate font-mono">
            {input ? `${BASE_LABELS[base]} ${formatWithGroups(input, base)}` : '0'}
          </div>
          <div className="text-right text-2xl font-bold text-gray-900 dark:text-white h-9 truncate font-mono">
            {error || (input ? formatWithGroups(formatValue(value, base), base) : '0')}
          </div>
          {base === 10 && value !== 0 && (
            <div className="text-right text-xs text-gray-400 mt-1 font-mono">
              有符号: {signed}
            </div>
          )}
        </div>

        {/* Bit display (32-bit) */}
        <div className="bg-gray-900 dark:bg-gray-950 rounded-lg p-3 mb-3 overflow-x-auto">
          <div className="flex gap-0.5 min-w-max">
            {Array.from({ length: 32 }, (_, i) => {
              const bit = (value >>> (31 - i)) & 1
              return (
                <button
                  key={i}
                  onClick={() => toggleBit(31 - i)}
                  className={`w-6 h-7 rounded text-[10px] font-mono font-bold transition-colors ${
                    bit ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                  }`}
                  title={`位 ${31 - i}`}
                >
                  {bit}
                </button>
              )
            })}
          </div>
          <div className="flex gap-0.5 mt-1 min-w-max">
            {Array.from({ length: 32 }, (_, i) => (
              <div key={i} className="w-6 text-center text-[8px] text-gray-500 font-mono">
                {31 - i}
              </div>
            ))}
          </div>
        </div>

        {/* Bitwise operations */}
        <div className="grid grid-cols-4 gap-2 mb-2">
          <Btn label="NOT" onClick={() => applyOp('NOT')} className="bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300" />
          <Btn label="AND" onClick={() => applyOp('AND')} className="bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300" />
          <Btn label="OR" onClick={() => applyOp('OR')} className="bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300" />
          <Btn label="XOR" onClick={() => applyOp('XOR')} className="bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300" />
        </div>
        <div className="grid grid-cols-4 gap-2 mb-2">
          <Btn label="SHL <<" onClick={() => applyOp('SHL')} className="bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300" />
          <Btn label="SHR >>" onClick={() => applyOp('SHR')} className="bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300" />
          <Btn label="ROL" onClick={() => applyOp('ROL')} className="bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300" />
          <Btn label="ROR" onClick={() => applyOp('ROR')} className="bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300" />
        </div>

        {/* Hex digits */}
        {base === 16 && (
          <div className="grid grid-cols-6 gap-2 mb-2">
            {['A', 'B', 'C', 'D', 'E', 'F'].map(d => (
              <Btn key={d} label={d} onClick={() => appendDigit(d)} className="bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800" />
            ))}
          </div>
        )}

        {/* Main digit pad */}
        <div className="grid grid-cols-4 gap-2">
          <Btn label="C" onClick={clear} className="bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300" />
          <Btn label="NEG" onClick={() => applyOp('NEG')} className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300" />
          <Btn label="MOD" onClick={() => appendDigit('%')} disabled={base !== 10} className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300" />
          <Btn label="÷" onClick={() => appendDigit('/')} disabled={base !== 10} className="bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300" />

          <Btn label="7" onClick={() => appendDigit('7')} disabled={!getValidDigits(base).includes('7')} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700" />
          <Btn label="8" onClick={() => appendDigit('8')} disabled={!getValidDigits(base).includes('8')} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700" />
          <Btn label="9" onClick={() => appendDigit('9')} disabled={!getValidDigits(base).includes('9')} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700" />
          <Btn label="×" onClick={() => appendDigit('*')} disabled={base !== 10} className="bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300" />

          <Btn label="4" onClick={() => appendDigit('4')} disabled={!getValidDigits(base).includes('4')} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700" />
          <Btn label="5" onClick={() => appendDigit('5')} disabled={!getValidDigits(base).includes('5')} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700" />
          <Btn label="6" onClick={() => appendDigit('6')} disabled={!getValidDigits(base).includes('6')} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700" />
          <Btn label="-" onClick={() => appendDigit('-')} disabled={base !== 10} className="bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300" />

          <Btn label="1" onClick={() => appendDigit('1')} disabled={!getValidDigits(base).includes('1')} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700" />
          <Btn label="2" onClick={() => appendDigit('2')} disabled={!getValidDigits(base).includes('2')} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700" />
          <Btn label="3" onClick={() => appendDigit('3')} disabled={!getValidDigits(base).includes('3')} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700" />
          <Btn label="+" onClick={() => appendDigit('+')} disabled={base !== 10} className="bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300" />

          <Btn label="0" onClick={() => appendDigit('0')} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 col-span-2" />
          <Btn label="⌫" onClick={backspace} className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300" />
          <Btn label="=" onClick={() => {}} disabled className="bg-blue-500 text-white opacity-50" />
        </div>
      </Section>
    </ToolShell>
  )
}
