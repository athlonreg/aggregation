import { useState, useMemo } from 'react'
import ToolShell, { Section, TextInput, Select } from '../components/ToolShell'

interface UnitDef {
  value: string
  label: string
}

interface Category {
  value: string
  label: string
  units: UnitDef[]
  convert: (value: number, from: string, to: string) => number
}

const categories: Category[] = [
  {
    value: 'length',
    label: '长度',
    units: [
      { value: 'mm', label: '毫米 (mm)' },
      { value: 'cm', label: '厘米 (cm)' },
      { value: 'm', label: '米 (m)' },
      { value: 'km', label: '千米 (km)' },
      { value: 'inch', label: '英寸 (inch)' },
      { value: 'foot', label: '英尺 (foot)' },
      { value: 'yard', label: '码 (yard)' },
      { value: 'mile', label: '英里 (mile)' },
    ],
    convert: (v, from, to) => {
      const toM: Record<string, number> = {
        mm: 0.001, cm: 0.01, m: 1, km: 1000,
        inch: 0.0254, foot: 0.3048, yard: 0.9144, mile: 1609.344,
      }
      return v * toM[from] / toM[to]
    },
  },
  {
    value: 'weight',
    label: '重量',
    units: [
      { value: 'mg', label: '毫克 (mg)' },
      { value: 'g', label: '克 (g)' },
      { value: 'kg', label: '千克 (kg)' },
      { value: 'ton', label: '吨 (ton)' },
      { value: 'oz', label: '盎司 (oz)' },
      { value: 'lb', label: '磅 (lb)' },
    ],
    convert: (v, from, to) => {
      const toG: Record<string, number> = {
        mg: 0.001, g: 1, kg: 1000, ton: 1e6, oz: 28.3495, lb: 453.592,
      }
      return v * toG[from] / toG[to]
    },
  },
  {
    value: 'temperature',
    label: '温度',
    units: [
      { value: 'c', label: '摄氏度 (°C)' },
      { value: 'f', label: '华氏度 (°F)' },
      { value: 'k', label: '开尔文 (K)' },
    ],
    convert: (v, from, to) => {
      // Convert to Celsius first
      let celsius: number
      if (from === 'c') celsius = v
      else if (from === 'f') celsius = (v - 32) * 5 / 9
      else celsius = v - 273.15

      if (to === 'c') return celsius
      if (to === 'f') return celsius * 9 / 5 + 32
      return celsius + 273.15
    },
  },
  {
    value: 'area',
    label: '面积',
    units: [
      { value: 'mm2', label: '平方毫米 (mm²)' },
      { value: 'cm2', label: '平方厘米 (cm²)' },
      { value: 'm2', label: '平方米 (m²)' },
      { value: 'km2', label: '平方千米 (km²)' },
      { value: 'acre', label: '英亩 (acre)' },
      { value: 'hectare', label: '公顷 (hectare)' },
    ],
    convert: (v, from, to) => {
      const toM2: Record<string, number> = {
        mm2: 1e-6, cm2: 1e-4, m2: 1, km2: 1e6,
        acre: 4046.8564224, hectare: 1e4,
      }
      return v * toM2[from] / toM2[to]
    },
  },
  {
    value: 'volume',
    label: '体积',
    units: [
      { value: 'ml', label: '毫升 (ml)' },
      { value: 'l', label: '升 (L)' },
      { value: 'gal', label: '加仑 (gal)' },
      { value: 'cup', label: '杯 (cup)' },
      { value: 'floz', label: '液体盎司 (fl oz)' },
    ],
    convert: (v, from, to) => {
      const toMl: Record<string, number> = {
        ml: 1, l: 1000, gal: 3785.41, cup: 236.588, floz: 29.5735,
      }
      return v * toMl[from] / toMl[to]
    },
  },
  {
    value: 'speed',
    label: '速度',
    units: [
      { value: 'ms', label: '米/秒 (m/s)' },
      { value: 'kmh', label: '千米/时 (km/h)' },
      { value: 'mph', label: '英里/时 (mph)' },
      { value: 'knot', label: '节 (knot)' },
    ],
    convert: (v, from, to) => {
      const toMs: Record<string, number> = {
        ms: 1, kmh: 1 / 3.6, mph: 0.44704, knot: 0.514444,
      }
      return v * toMs[from] / toMs[to]
    },
  },
  {
    value: 'data',
    label: '数据存储',
    units: [
      { value: 'b', label: '字节 (B)' },
      { value: 'kb', label: 'KB' },
      { value: 'mb', label: 'MB' },
      { value: 'gb', label: 'GB' },
      { value: 'tb', label: 'TB' },
    ],
    convert: (v, from, to) => {
      const toB: Record<string, number> = {
        b: 1, kb: 1024, mb: 1048576, gb: 1073741824, tb: 1099511627776,
      }
      return v * toB[from] / toB[to]
    },
  },
]

function formatResult(value: number): string {
  if (value === 0) return '0'
  if (Math.abs(value) >= 1e15 || (Math.abs(value) < 1e-6 && value !== 0)) {
    return value.toExponential(6)
  }
  // Remove trailing zeros
  return parseFloat(value.toPrecision(12)).toString()
}

export default function UnitConvert() {
  const [category, setCategory] = useState('length')
  const [value, setValue] = useState('')
  const [fromUnit, setFromUnit] = useState('')
  const [toUnit, setToUnit] = useState('')

  const cat = useMemo(() => categories.find(c => c.value === category)!, [category])

  // Reset units when category changes
  const handleCategoryChange = (newCat: string) => {
    setCategory(newCat)
    const c = categories.find(ct => ct.value === newCat)!
    setFromUnit(c.units[0].value)
    setToUnit(c.units.length > 1 ? c.units[1].value : c.units[0].value)
  }

  // Initialize defaults
  if (!fromUnit && cat.units.length > 0) {
    setFromUnit(cat.units[0].value)
    setToUnit(cat.units.length > 1 ? cat.units[1].value : cat.units[0].value)
  }

  const numValue = parseFloat(value)
  const result = !isNaN(numValue) && fromUnit && toUnit
    ? formatResult(cat.convert(numValue, fromUnit, toUnit))
    : ''

  return (
    <ToolShell title="单位转换" description="长度、重量、温度、面积、体积、速度、数据存储等单位转换">
      <Section>
        <div className="space-y-3">
          <Select
            value={category}
            onChange={handleCategoryChange}
            options={categories.map(c => ({ value: c.value, label: c.label }))}
            label="类别"
          />
          <TextInput
            value={value}
            onChange={setValue}
            placeholder="输入数值"
            label="数值"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              value={fromUnit}
              onChange={setFromUnit}
              options={cat.units.map(u => ({ value: u.value, label: u.label }))}
              label="从"
            />
            <Select
              value={toUnit}
              onChange={setToUnit}
              options={cat.units.map(u => ({ value: u.value, label: u.label }))}
              label="到"
            />
          </div>
        </div>
      </Section>

      {result && (
        <Section>
          <div className="text-sm text-gray-500 dark:text-gray-400">转换结果</div>
          <div className="text-2xl font-mono font-bold text-gray-900 dark:text-white mt-1">
            {result}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {value} {cat.units.find(u => u.value === fromUnit)?.label} = {result} {cat.units.find(u => u.value === toUnit)?.label}
          </div>
        </Section>
      )}
    </ToolShell>
  )
}
