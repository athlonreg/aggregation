import { useState, useCallback, useRef } from 'react'
import ToolShell, { Section, ActionButton } from '../components/ToolShell'
import { Upload, Download, RotateCcw, Zap, Eye, EyeOff } from 'lucide-react'
import { analyzeBuffer, applyEdits } from '../utils/saveParser'
import type { DetectedField } from '../utils/saveParser'

export default function SaveEditor() {
  const [fileBuffer, setFileBuffer] = useState<Uint8Array | null>(null)
  const [fileName, setFileName] = useState('')
  const [fields, setFields] = useState<DetectedField[]>([])
  const [edits, setEdits] = useState<Record<string, number>>({})
  const [showHex, setShowHex] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── File loading ─────────────────────────────────────────────

  const loadFile = useCallback((file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      const buf = new Uint8Array(reader.result as ArrayBuffer)
      setFileBuffer(buf)
      setFileName(file.name)
      setEdits({})
      const detected = analyzeBuffer(buf)
      setFields(detected)
    }
    reader.readAsArrayBuffer(file)
  }, [])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) loadFile(file)
  }, [loadFile])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) loadFile(file)
  }, [loadFile])

  // ── Edit ─────────────────────────────────────────────────────

  const handleEdit = useCallback((fieldId: string, value: number) => {
    setEdits(prev => ({ ...prev, [fieldId]: value }))
  }, [])

  // ── Max all in group ─────────────────────────────────────────

  const handleMaxGroup = useCallback((group: string) => {
    const groupFields = fields.filter(f => f.group === group && f.editable)
    const changes: Record<string, number> = {}
    for (const f of groupFields) {
      if (f.dataType === 'uint8') changes[f.id] = 255
      else if (f.dataType === 'uint16le') changes[f.id] = 9999
      else if (f.dataType === 'uint24le') changes[f.id] = 999999
      else if (f.dataType === 'bcd2') changes[f.id] = 9999
      else if (f.dataType === 'bcd3') changes[f.id] = 999999
    }
    setEdits(prev => ({ ...prev, ...changes }))
  }, [fields])

  // ── Reset ────────────────────────────────────────────────────

  const handleReset = useCallback(() => { setEdits({}) }, [])

  // ── Re-analyze with fresh scan ───────────────────────────────

  const handleReanalyze = useCallback(() => {
    if (!fileBuffer) return
    setEdits({})
    setFields(analyzeBuffer(fileBuffer))
  }, [fileBuffer])

  // ── Download ─────────────────────────────────────────────────

  const handleDownload = useCallback(() => {
    if (!fileBuffer) return
    const modified = applyEdits(fileBuffer, fields, edits)
    const blob = new Blob([modified.buffer as BlobPart], { type: 'application/octet-stream' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName.replace(/\.\w+$/, '') + '_edited' + (fileName.match(/\.\w+$/)?.[0] || '.dat')
    a.click()
    URL.revokeObjectURL(url)
  }, [fileBuffer, fields, edits, fileName])

  // ── Display value ────────────────────────────────────────────

  const displayValue = (f: DetectedField): number => f.id in edits ? edits[f.id] : f.value

  // ── Group fields ─────────────────────────────────────────────

  const groups = [...new Set(fields.map(f => f.group))]

  // ── Hex view ─────────────────────────────────────────────────

  const editedOffsets = new Set<number>()
  for (const [id] of Object.entries(edits)) {
    const f = fields.find(x => x.id === id)
    if (f) for (let i = 0; i < f.length; i++) editedOffsets.add(f.offset + i)
  }

  const formatValue = (f: DetectedField, v: number) => {
    if (f.dataType === 'bcd2' || f.dataType === 'bcd3') return v.toLocaleString()
    if (f.dataType === 'uint24le') return v.toLocaleString()
    return v.toLocaleString()
  }

  const getMaxForType = (dt: DetectedField['dataType']) => {
    if (dt === 'uint8') return 255
    if (dt === 'uint16le') return 65535
    if (dt === 'uint24le') return 16777215
    if (dt === 'bcd2') return 9999
    if (dt === 'bcd3') return 999999
    return 255
  }

  return (
    <ToolShell title="存档编辑器" description="自动解析 FC/NES 存档文件，识别数据结构并支持编辑修改">
      {/* ── File Upload ──────────────────────────────────────── */}
      <Section title="文件">
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            dragOver
              ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
          }`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <Upload size={24} className="mx-auto mb-2 text-gray-400" />
          <div className="text-sm text-gray-500">拖拽存档文件到此处，或点击选择文件</div>
          <div className="text-xs text-gray-400 mt-1">支持 .dat / .sav / .srm / .bin 等格式</div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".dat,.sav,.srm,.bin"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {fileBuffer && (
          <div className="mt-3 flex items-center gap-4 text-sm">
            <span className="text-gray-500">文件: <span className="font-mono text-gray-700 dark:text-gray-300">{fileName}</span></span>
            <span className="text-gray-500">大小: <span className="font-mono text-gray-700 dark:text-gray-300">{fileBuffer.length} 字节</span></span>
            <span className="text-gray-500">识别: <span className="font-mono text-blue-600 dark:text-blue-400">{fields.length} 个字段</span></span>
          </div>
        )}
      </Section>

      {/* ── Data Editor ──────────────────────────────────────── */}
      {fileBuffer && fields.length > 0 && (
        <>
          <Section title="数据编辑">
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <button
                onClick={() => setShowHex(!showHex)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors"
              >
                {showHex ? <EyeOff size={12} /> : <Eye size={12} />}
                {showHex ? '隐藏十六进制' : '十六进制查看'}
              </button>
              <button
                onClick={handleReanalyze}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors"
              >
                重新扫描
              </button>
              {Object.keys(edits).length > 0 && (
                <span className="text-xs text-blue-500">{Object.keys(edits).length} 项已修改</span>
              )}
            </div>

            {groups.map(group => {
              const groupFields = fields.filter(f => f.group === group)
              return (
                <div key={group} className="mb-4 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 font-mono">{group}</span>
                    <button
                      onClick={() => handleMaxGroup(group)}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-200 dark:hover:bg-yellow-900/50 transition-colors"
                    >
                      <Zap size={11} /> 全部最大
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-xs text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800">
                          <th className="text-left px-4 py-1.5 font-medium">偏移</th>
                          <th className="text-left px-4 py-1.5 font-medium">类型</th>
                          <th className="text-left px-4 py-1.5 font-medium">原始值</th>
                          <th className="text-left px-4 py-1.5 font-medium">修改</th>
                          <th className="text-left px-4 py-1.5 font-medium">范围</th>
                        </tr>
                      </thead>
                      <tbody>
                        {groupFields.map(f => {
                          const cur = displayValue(f)
                          const orig = f.value
                          const isEdited = f.id in edits
                          return (
                            <tr key={f.id} className={`border-b border-gray-50 dark:border-gray-800/50 ${isEdited ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}>
                              <td className="px-4 py-1.5 font-mono text-gray-600 dark:text-gray-400 whitespace-nowrap">
                                0x{f.offset.toString(16).toUpperCase().padStart(4, '0')}
                              </td>
                              <td className="px-4 py-1.5 text-xs text-gray-500 whitespace-nowrap">{f.dataType}</td>
                              <td className="px-4 py-1.5 font-mono text-gray-500 dark:text-gray-500">
                                {formatValue(f, orig)}
                              </td>
                              <td className="px-4 py-1.5">
                                <input
                                  type="number"
                                  value={cur}
                                  min={0}
                                  max={getMaxForType(f.dataType)}
                                  onChange={e => handleEdit(f.id, parseInt(e.target.value) || 0)}
                                  className="w-28 px-2 py-0.5 text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-mono"
                                />
                              </td>
                              <td className="px-4 py-1.5 text-xs text-gray-400">
                                0 ~ {getMaxForType(f.dataType).toLocaleString()}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            })}

            <div className="flex items-center gap-3 mt-4">
              <ActionButton onClick={handleDownload} disabled={Object.keys(edits).length === 0}>
                <span className="inline-flex items-center gap-1.5"><Download size={14} /> 下载存档</span>
              </ActionButton>
              <ActionButton variant="secondary" onClick={handleReset} disabled={Object.keys(edits).length === 0}>
                <span className="inline-flex items-center gap-1.5"><RotateCcw size={14} /> 撤销修改</span>
              </ActionButton>
            </div>
          </Section>

          {/* ── Hex Viewer ─────────────────────────────────── */}
          {showHex && (
            <Section title="十六进制查看">
              <div className="overflow-x-auto font-mono text-xs">
                <table className="w-full">
                  <thead>
                    <tr className="text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left px-2 py-1">偏移</th>
                      {Array.from({ length: 16 }, (_, i) => (
                        <th key={i} className="text-center px-1 py-1 w-6">{i.toString(16).toUpperCase().padStart(2, '0')}</th>
                      ))}
                      <th className="text-left px-2 py-1">ASCII</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: Math.ceil(fileBuffer.length / 16) }, (_, row) => {
                      const start = row * 16
                      return (
                        <tr key={row} className="border-b border-gray-50 dark:border-gray-800/30">
                          <td className="px-2 py-0.5 text-gray-400">{start.toString(16).toUpperCase().padStart(4, '0')}</td>
                          {Array.from({ length: 16 }, (_, col) => {
                            const offset = start + col
                            const byte = offset < fileBuffer.length ? fileBuffer[offset] : null
                            const isEdited = editedOffsets.has(offset)
                            return (
                              <td key={col} className={`text-center px-1 py-0.5 ${isEdited ? 'bg-yellow-200 dark:bg-yellow-800 text-yellow-900 dark:text-yellow-200' : 'text-gray-600 dark:text-gray-400'}`}>
                                {byte !== null ? byte.toString(16).toUpperCase().padStart(2, '0') : ''}
                              </td>
                            )
                          })}
                          <td className="px-2 py-0.5 text-gray-400">
                            {Array.from({ length: 16 }, (_, col) => {
                              const offset = start + col
                              if (offset >= fileBuffer.length) return ''
                              const byte = fileBuffer[offset]
                              return byte >= 0x20 && byte <= 0x7E ? String.fromCharCode(byte) : '.'
                            }).join('')}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </Section>
          )}
        </>
      )}

      {fileBuffer && fields.length === 0 && (
        <Section>
          <div className="text-center text-gray-500 py-8">未能识别出数据字段，文件可能不是有效的存档文件</div>
        </Section>
      )}
    </ToolShell>
  )
}
