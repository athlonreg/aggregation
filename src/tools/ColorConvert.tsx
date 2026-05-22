import { useState, useCallback } from 'react'
import ToolShell, { Section, TextInput } from '../components/ToolShell'

interface HSL { h: number; s: number; l: number }
interface HSV { h: number; s: number; v: number }
interface RGB { r: number; g: number; b: number }

function hexToRgb(hex: string): RGB | null {
  const clean = hex.replace('#', '')
  let full = clean
  if (clean.length === 3) {
    full = clean[0] + clean[0] + clean[1] + clean[1] + clean[2] + clean[2]
  }
  if (full.length !== 6) return null
  const n = parseInt(full, 16)
  if (isNaN(n)) return null
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(v => Math.round(v).toString(16).padStart(2, '0')).join('')
}

function rgbToHsl(r: number, g: number, b: number): HSL {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return { h: 0, s: 0, l }
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h = 0
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
  else if (max === g) h = ((b - r) / d + 2) / 6
  else h = ((r - g) / d + 4) / 6
  return { h: Math.round(h * 360), s, l }
}

function hslToRgb(h: number, s: number, l: number): RGB {
  if (s === 0) {
    const v = Math.round(l * 255)
    return { r: v, g: v, b: v }
  }
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1
    if (t > 1) t -= 1
    if (t < 1 / 6) return p + (q - p) * 6 * t
    if (t < 1 / 2) return q
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
    return p
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  return {
    r: Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    g: Math.round(hue2rgb(p, q, h) * 255),
    b: Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
  }
}

function rgbToHsv(r: number, g: number, b: number): HSV {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  const v = max
  const d = max - min
  const s = max === 0 ? 0 : d / max
  if (max === min) return { h: 0, s, v }
  let h = 0
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
  else if (max === g) h = ((b - r) / d + 2) / 6
  else h = ((r - g) / d + 4) / 6
  return { h: Math.round(h * 360), s, v }
}

function parseColor(input: string): RGB | null {
  const trimmed = input.trim()

  // HEX
  if (trimmed.startsWith('#') || /^[0-9a-fA-F]{3,6}$/.test(trimmed)) {
    return hexToRgb(trimmed.startsWith('#') ? trimmed : '#' + trimmed)
  }

  // RGB
  const rgbMatch = trimmed.match(/rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i)
  if (rgbMatch) {
    return { r: parseInt(rgbMatch[1]), g: parseInt(rgbMatch[2]), b: parseInt(rgbMatch[3]) }
  }

  // HSL
  const hslMatch = trimmed.match(/hsl\s*\(\s*(\d+)\s*,\s*(\d+(?:\.\d+)?)\s*%?\s*,\s*(\d+(?:\.\d+)?)\s*%?\s*\)/i)
  if (hslMatch) {
    return hslToRgb(parseInt(hslMatch[1]) / 360, parseFloat(hslMatch[2]) / 100, parseFloat(hslMatch[3]) / 100)
  }

  return null
}

function complementary(r: number, g: number, b: number): RGB {
  return { r: 255 - r, g: 255 - g, b: 255 - b }
}

export default function ColorConvert() {
  const [input, setInput] = useState('')
  const [color, setColor] = useState<RGB | null>(null)

  const updateColor = useCallback((rgb: RGB | null) => {
    setColor(rgb)
  }, [])

  const handleInput = useCallback((val: string) => {
    setInput(val)
    const rgb = parseColor(val)
    updateColor(rgb)
  }, [updateColor])

  const handlePicker = useCallback((hex: string) => {
    setInput(hex)
    const rgb = hexToRgb(hex)
    updateColor(rgb)
  }, [updateColor])

  const hex = color ? rgbToHex(color.r, color.g, color.b) : ''
  const hsl = color ? rgbToHsl(color.r, color.g, color.b) : null
  const hsv = color ? rgbToHsv(color.r, color.g, color.b) : null
  const comp = color ? complementary(color.r, color.g, color.b) : null
  const compHex = comp ? rgbToHex(comp.r, comp.g, comp.b) : ''

  return (
    <ToolShell title="颜色转换" description="在 HEX、RGB、HSL、HSV 等颜色格式之间转换">
      <Section>
        <div className="space-y-3">
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <TextInput
                value={input}
                onChange={handleInput}
                placeholder="#ff6600 或 rgb(255,102,0) 或 hsl(24,100%,50%)"
                label="颜色值"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">拾色器</label>
              <input
                type="color"
                value={hex || '#000000'}
                onChange={(e) => handlePicker(e.target.value)}
                className="w-12 h-10 rounded-lg border border-gray-300 dark:border-gray-700 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </Section>

      {color && (
        <>
          <Section title="颜色预览">
            <div className="flex gap-4 items-center">
              <div className="flex gap-2">
                <div>
                  <div
                    className="w-24 h-24 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm"
                    style={{ backgroundColor: hex }}
                  />
                  <div className="text-xs text-center text-gray-500 dark:text-gray-400 mt-1">原色</div>
                </div>
                <div>
                  <div
                    className="w-24 h-24 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm"
                    style={{ backgroundColor: compHex }}
                  />
                  <div className="text-xs text-center text-gray-500 dark:text-gray-400 mt-1">互补色</div>
                </div>
              </div>
            </div>
          </Section>

          <Section title="转换结果">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">HEX</div>
                <div className="font-mono font-medium text-gray-900 dark:text-white">{hex}</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">RGB</div>
                <div className="font-mono font-medium text-gray-900 dark:text-white">
                  rgb({color.r}, {color.g}, {color.b})
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">HSL</div>
                <div className="font-mono font-medium text-gray-900 dark:text-white">
                  hsl({hsl!.h}, {Math.round(hsl!.s * 100)}%, {Math.round(hsl!.l * 100)}%)
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">HSV</div>
                <div className="font-mono font-medium text-gray-900 dark:text-white">
                  hsv({hsv!.h}, {Math.round(hsv!.s * 100)}%, {Math.round(hsv!.v * 100)}%)
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">互补色 HEX</div>
                <div className="font-mono font-medium text-gray-900 dark:text-white">{compHex}</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">互补色 RGB</div>
                <div className="font-mono font-medium text-gray-900 dark:text-white">
                  rgb({comp!.r}, {comp!.g}, {comp!.b})
                </div>
              </div>
            </div>
          </Section>
        </>
      )}
    </ToolShell>
  )
}
