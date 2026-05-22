import { useState, useCallback, useEffect } from 'react'
import ToolShell, { Section } from '../components/ToolShell'

export default function ScientificCalc() {
  const [expr, setExpr] = useState('')
  const [result, setResult] = useState('')
  const [memory, setMemory] = useState(0)
  const [hasMemory, setHasMemory] = useState(false)

  const append = useCallback((s: string) => {
    setExpr(prev => prev + s)
  }, [])

  const clear = useCallback(() => {
    setExpr('')
    setResult('')
  }, [])

  const backspace = useCallback(() => {
    setExpr(prev => prev.slice(0, -1))
  }, [])

  const calculate = useCallback(() => {
    if (!expr) return
    try {
      const sanitized = expr
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/\^/g, '**')
        .replace(/sin\(/g, 'Math.sin(')
        .replace(/cos\(/g, 'Math.cos(')
        .replace(/tan\(/g, 'Math.tan(')
        .replace(/log\(/g, 'Math.log10(')
        .replace(/ln\(/g, 'Math.log(')
        .replace(/√\(/g, 'Math.sqrt(')
        .replace(/π/g, 'Math.PI')
        .replace(/(?<![a-zA-Z.])e(?![a-zA-Z.0-9])/g, 'Math.E')

      // Validate: only allow safe math characters
      if (!/^[\d\s+\-*/().,%^a-zA-Z]+$/.test(sanitized)) {
        setResult('错误: 非法表达式')
        return
      }

      const fn = new Function(`"use strict"; return (${sanitized})`)
      const val = fn()
      if (typeof val === 'number' && isFinite(val)) {
        const display = Number.isInteger(val) ? String(val) : val.toPrecision(12).replace(/\.?0+$/, '')
        setResult(display)
      } else {
        setResult(String(val))
      }
    } catch {
      setResult('错误')
    }
  }, [expr])

  const handleMemory = useCallback((action: string) => {
    const current = result ? parseFloat(result) : 0
    switch (action) {
      case 'MC': setMemory(0); setHasMemory(false); break
      case 'MR': setExpr(prev => prev + String(memory)); break
      case 'M+': setMemory(m => m + current); setHasMemory(true); break
      case 'M-': setMemory(m => m - current); setHasMemory(true); break
    }
  }, [result, memory])

  const insertFunc = useCallback((fn: string) => {
    append(fn + '(')
  }, [append])

  const insertSquare = useCallback(() => {
    append('^2')
  }, [append])

  const insertPower = useCallback(() => {
    append('^(')
  }, [append])

  // Keyboard support
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const key = e.key
      if (key >= '0' && key <= '9') append(key)
      else if (key === '.') append('.')
      else if (key === '+') append('+')
      else if (key === '-') append('-')
      else if (key === '*') { e.preventDefault(); append('×') }
      else if (key === '/') { e.preventDefault(); append('÷') }
      else if (key === '(') append('(')
      else if (key === ')') append(')')
      else if (key === 'Enter' || key === '=') { e.preventDefault(); calculate() }
      else if (key === 'Escape') clear()
      else if (key === 'Backspace') backspace()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [append, calculate, clear, backspace])

  const Btn = ({ label, onClick, className = '' }: { label: string; onClick: () => void; className?: string }) => (
    <button
      onClick={onClick}
      className={`h-11 rounded-lg text-sm font-medium transition-colors active:scale-95 ${className}`}
    >
      {label}
    </button>
  )

  return (
    <ToolShell title="科学计算器" description="支持科学函数运算，可用键盘输入">
      <Section>
        {/* Display */}
        <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-4 mb-3">
          <div className="text-right text-sm text-gray-500 dark:text-gray-400 h-6 truncate font-mono">
            {expr || '0'}
          </div>
          <div className="text-right text-2xl font-bold text-gray-900 dark:text-white h-9 truncate font-mono">
            {result || '0'}
          </div>
          {hasMemory && (
            <div className="text-right text-xs text-blue-500 mt-1">M = {memory}</div>
          )}
        </div>

        {/* Memory row */}
        <div className="grid grid-cols-4 gap-2 mb-2">
          <Btn label="MC" onClick={() => handleMemory('MC')} className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300" />
          <Btn label="MR" onClick={() => handleMemory('MR')} className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300" />
          <Btn label="M+" onClick={() => handleMemory('M+')} className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300" />
          <Btn label="M-" onClick={() => handleMemory('M-')} className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300" />
        </div>

        {/* Scientific functions row */}
        <div className="grid grid-cols-5 gap-2 mb-2">
          <Btn label="sin" onClick={() => insertFunc('sin')} className="bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300" />
          <Btn label="cos" onClick={() => insertFunc('cos')} className="bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300" />
          <Btn label="tan" onClick={() => insertFunc('tan')} className="bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300" />
          <Btn label="log" onClick={() => insertFunc('log')} className="bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300" />
          <Btn label="ln" onClick={() => insertFunc('ln')} className="bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300" />
        </div>

        <div className="grid grid-cols-5 gap-2 mb-2">
          <Btn label="√" onClick={() => insertFunc('√')} className="bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300" />
          <Btn label="x²" onClick={insertSquare} className="bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300" />
          <Btn label="xⁿ" onClick={insertPower} className="bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300" />
          <Btn label="π" onClick={() => append('π')} className="bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300" />
          <Btn label="e" onClick={() => append('e')} className="bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300" />
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-4 gap-2">
          <Btn label="C" onClick={clear} className="bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300" />
          <Btn label="(" onClick={() => append('(')} className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300" />
          <Btn label=")" onClick={() => append(')')} className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300" />
          <Btn label="÷" onClick={() => append('÷')} className="bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300" />

          <Btn label="7" onClick={() => append('7')} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700" />
          <Btn label="8" onClick={() => append('8')} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700" />
          <Btn label="9" onClick={() => append('9')} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700" />
          <Btn label="×" onClick={() => append('×')} className="bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300" />

          <Btn label="4" onClick={() => append('4')} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700" />
          <Btn label="5" onClick={() => append('5')} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700" />
          <Btn label="6" onClick={() => append('6')} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700" />
          <Btn label="-" onClick={() => append('-')} className="bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300" />

          <Btn label="1" onClick={() => append('1')} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700" />
          <Btn label="2" onClick={() => append('2')} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700" />
          <Btn label="3" onClick={() => append('3')} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700" />
          <Btn label="+" onClick={() => append('+')} className="bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300" />

          <Btn label="0" onClick={() => append('0')} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 col-span-2" />
          <Btn label="." onClick={() => append('.')} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700" />
          <Btn label="=" onClick={calculate} className="bg-blue-500 hover:bg-blue-600 text-white" />
        </div>

        {/* Backspace */}
        <div className="mt-2">
          <Btn label="退格 ⌫" onClick={backspace} className="w-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300" />
        </div>
      </Section>
    </ToolShell>
  )
}
