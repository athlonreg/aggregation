import { useState, useCallback, useRef } from 'react'
import ToolShell, { Section, ActionButton } from '../components/ToolShell'
import { Upload, Download, Trash2, Loader2, FileImage, FileText, Minimize2 } from 'lucide-react'
import heic2any from 'heic2any'
import { jsPDF } from 'jspdf'
import { PDFDocument } from 'pdf-lib'
import JSZip from 'jszip'

type Tab = 'heic2jpg' | 'img2pdf' | 'webp2png' | 'pdf' | 'compress'

const TABS: { id: Tab; label: string }[] = [
  { id: 'heic2jpg', label: 'HEIC → JPG' },
  { id: 'img2pdf', label: '图片 → PDF' },
  { id: 'webp2png', label: 'WebP → PNG' },
  { id: 'pdf', label: 'PDF 拆分/合并' },
  { id: 'compress', label: '图片压缩' },
]

interface FileItem {
  id: number
  file: File
  preview?: string
  isHeic?: boolean
}

let fileId = 0

function isHeicFile(f: File): boolean {
  const name = f.name.toLowerCase()
  return name.endsWith('.heic') || name.endsWith('.heif') || f.type === 'image/heic' || f.type === 'image/heif'
}

function useFileList() {
  const [files, setFiles] = useState<FileItem[]>([])
  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const items: FileItem[] = Array.from(newFiles).map(f => {
      const heic = isHeicFile(f)
      return {
        id: ++fileId,
        file: f,
        isHeic: heic,
        preview: heic ? undefined : (f.type.startsWith('image/') ? URL.createObjectURL(f) : undefined),
      }
    })
    setFiles(prev => [...prev, ...items])
    // Generate HEIC previews asynchronously
    items.filter(i => i.isHeic).forEach(async item => {
      try {
        const blob = await heic2any({ blob: item.file, toType: 'image/jpeg', quality: 0.3 })
        const result = Array.isArray(blob) ? blob[0] : blob as Blob
        const url = URL.createObjectURL(result)
        setFiles(prev => prev.map(f => f.id === item.id ? { ...f, preview: url } : f))
      } catch { /* preview failed, ignore */ }
    })
  }, [])
  const removeFile = useCallback((id: number) => {
    setFiles(prev => {
      const item = prev.find(f => f.id === id)
      if (item?.preview) URL.revokeObjectURL(item.preview)
      return prev.filter(f => f.id !== id)
    })
  }, [])
  const clearFiles = useCallback(() => {
    setFiles(prev => { prev.forEach(f => { if (f.preview) URL.revokeObjectURL(f.preview) }); return [] })
  }, [])
  return { files, addFiles, removeFile, clearFiles }
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}

function DropZone({ onDrop, accept }: { onDrop: (files: FileList) => void; accept?: string }) {
  const [over, setOver] = useState(false)
  const ref = useRef<HTMLInputElement>(null)
  return (
    <div
      className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${over ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-700 hover:border-gray-400'}`}
      onClick={() => ref.current?.click()}
      onDragOver={e => { e.preventDefault(); setOver(true) }}
      onDragLeave={() => setOver(false)}
      onDrop={e => { e.preventDefault(); setOver(false); onDrop(e.dataTransfer.files) }}
    >
      <Upload size={28} className="mx-auto mb-2 text-gray-400" />
      <div className="text-sm text-gray-500 dark:text-gray-400">拖拽文件到此处，或点击选择</div>
      {accept && <div className="text-xs text-gray-400 mt-1">支持: {accept}</div>}
      <input ref={ref} type="file" multiple accept={accept} className="hidden" onChange={e => { if (e.target.files) onDrop(e.target.files); e.target.value = '' }} />
    </div>
  )
}

function FileList({ files, onRemove }: { files: FileItem[]; onRemove: (id: number) => void }) {
  if (!files.length) return null
  return (
    <div className="mt-3 space-y-2">
      {files.map(f => (
        <div key={f.id} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
          {f.preview ? <img src={f.preview} alt="" className="w-10 h-10 rounded object-cover" /> : <FileText size={20} className="text-gray-400" />}
          <div className="flex-1 min-w-0">
            <div className="text-sm text-gray-800 dark:text-gray-200 truncate">{f.file.name}</div>
            <div className="text-xs text-gray-400">{formatSize(f.file.size)}</div>
          </div>
          <button onClick={() => onRemove(f.id)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
        </div>
      ))}
    </div>
  )
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

// ── HEIC → JPG ──────────────────────────────────────────────────

function HeicToJpg() {
  const { files, addFiles, removeFile, clearFiles } = useFileList()
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState('')

  const handleConvert = useCallback(async () => {
    if (!files.length) return
    setProcessing(true)
    try {
      for (let i = 0; i < files.length; i++) {
        setProgress(`${i + 1} / ${files.length}`)
        const blob = await heic2any({ blob: files[i].file, toType: 'image/jpeg', quality: 0.92 })
        const result = Array.isArray(blob) ? blob[0] : blob
        downloadBlob(result, files[i].file.name.replace(/\.heic$/i, '') + '.jpg')
      }
    } catch (err) {
      alert('转换失败: ' + (err as Error).message)
    } finally {
      setProcessing(false); setProgress('')
    }
  }, [files])

  return (
    <>
      <DropZone onDrop={addFiles} accept=".heic,.HEIC" />
      <FileList files={files} onRemove={removeFile} />
      <div className="flex items-center gap-3 mt-3">
        <ActionButton onClick={handleConvert} disabled={!files.length || processing}>
          {processing ? <><Loader2 size={14} className="animate-spin" /> 转换中 {progress}</> : <><FileImage size={14} /> 转换并下载</>}
        </ActionButton>
        {files.length > 0 && <ActionButton variant="secondary" onClick={clearFiles}>清空</ActionButton>}
      </div>
    </>
  )
}

// ── Image → PDF ─────────────────────────────────────────────────

function ImgToPdf() {
  const { files, addFiles, removeFile, clearFiles } = useFileList()
  const [processing, setProcessing] = useState(false)

  const handleConvert = useCallback(async () => {
    if (!files.length) return
    setProcessing(true)
    try {
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: 'a4' })
      for (let i = 0; i < files.length; i++) {
        if (i > 0) pdf.addPage()
        const img = await loadImage(files[i].file)
        const pdfW = pdf.internal.pageSize.getWidth()
        const pdfH = pdf.internal.pageSize.getHeight()
        const ratio = Math.min(pdfW / img.width, pdfH / img.height)
        const w = img.width * ratio, h = img.height * ratio
        const x = (pdfW - w) / 2, y = (pdfH - h) / 2
        const dataUrl = await fileToDataUrl(files[i].file)
        pdf.addImage(dataUrl, 'JPEG', x, y, w, h)
      }
      pdf.save('images.pdf')
    } catch (err) {
      alert('转换失败: ' + (err as Error).message)
    } finally {
      setProcessing(false)
    }
  }, [files])

  return (
    <>
      <DropZone onDrop={addFiles} accept="image/*,.heic,.HEIC,.heif,.HEIF" />
      <FileList files={files} onRemove={removeFile} />
      <div className="flex items-center gap-3 mt-3">
        <ActionButton onClick={handleConvert} disabled={!files.length || processing}>
          {processing ? <><Loader2 size={14} className="animate-spin" /> 转换中...</> : <><FileText size={14} /> 生成 PDF</>}
        </ActionButton>
        {files.length > 0 && <ActionButton variant="secondary" onClick={clearFiles}>清空</ActionButton>}
      </div>
    </>
  )
}

// ── WebP → PNG ──────────────────────────────────────────────────

function WebpToPng() {
  const { files, addFiles, removeFile, clearFiles } = useFileList()
  const [processing, setProcessing] = useState(false)

  const handleConvert = useCallback(async () => {
    if (!files.length) return
    setProcessing(true)
    try {
      for (const item of files) {
        const img = await loadImage(item.file)
        const canvas = document.createElement('canvas')
        canvas.width = img.width; canvas.height = img.height
        canvas.getContext('2d')!.drawImage(img, 0, 0)
        canvas.toBlob(blob => { if (blob) downloadBlob(blob, item.file.name.replace(/\.webp$/i, '') + '.png') }, 'image/png')
      }
    } catch (err) {
      alert('转换失败: ' + (err as Error).message)
    } finally {
      setProcessing(false)
    }
  }, [files])

  return (
    <>
      <DropZone onDrop={addFiles} accept=".webp,.WEBP" />
      <FileList files={files} onRemove={removeFile} />
      <div className="flex items-center gap-3 mt-3">
        <ActionButton onClick={handleConvert} disabled={!files.length || processing}>
          {processing ? <><Loader2 size={14} className="animate-spin" /> 转换中...</> : <><FileImage size={14} /> 转换并下载</>}
        </ActionButton>
        {files.length > 0 && <ActionButton variant="secondary" onClick={clearFiles}>清空</ActionButton>}
      </div>
    </>
  )
}

// ── PDF 拆分/合并 ───────────────────────────────────────────────

function PdfTool() {
  const [mode, setMode] = useState<'split' | 'merge'>('split')
  const { files, addFiles, removeFile, clearFiles } = useFileList()
  const [pageRange, setPageRange] = useState('')
  const [processing, setProcessing] = useState(false)

  const handleSplit = useCallback(async () => {
    if (!files.length) return
    setProcessing(true)
    try {
      const pdfBytes = await files[0].file.arrayBuffer()
      const pdf = await PDFDocument.load(pdfBytes)
      const totalPages = pdf.getPageCount()
      const pages = parsePageRange(pageRange, totalPages)
      if (!pages.length) { alert('页码范围无效'); return }
      const newPdf = await PDFDocument.create()
      const copied = await newPdf.copyPages(pdf, pages)
      copied.forEach(p => newPdf.addPage(p))
      const out = await newPdf.save()
      downloadBlob(new Blob([out as unknown as BlobPart], { type: 'application/pdf' }), 'split.pdf')
    } catch (err) {
      alert('拆分失败: ' + (err as Error).message)
    } finally {
      setProcessing(false)
    }
  }, [files, pageRange])

  const handleMerge = useCallback(async () => {
    if (files.length < 2) { alert('请选择至少两个 PDF 文件'); return }
    setProcessing(true)
    try {
      const merged = await PDFDocument.create()
      for (const item of files) {
        const bytes = await item.file.arrayBuffer()
        const doc = await PDFDocument.load(bytes)
        const copied = await merged.copyPages(doc, doc.getPageIndices())
        copied.forEach(p => merged.addPage(p))
      }
      const out = await merged.save()
      downloadBlob(new Blob([out as unknown as BlobPart], { type: 'application/pdf' }), 'merged.pdf')
    } catch (err) {
      alert('合并失败: ' + (err as Error).message)
    } finally {
      setProcessing(false)
    }
  }, [files])

  return (
    <>
      <div className="flex gap-2 mb-3">
        <button onClick={() => setMode('split')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${mode === 'split' ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>拆分</button>
        <button onClick={() => setMode('merge')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${mode === 'merge' ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>合并</button>
      </div>
      <DropZone onDrop={addFiles} accept=".pdf,.PDF" />
      <FileList files={files} onRemove={removeFile} />
      {mode === 'split' && (
        <div className="mt-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">页码范围</label>
          <input value={pageRange} onChange={e => setPageRange(e.target.value)} placeholder="如: 1-3,5,7-10" className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100" />
          <div className="text-xs text-gray-400 mt-1">留空则拆分每一页为单独文件</div>
        </div>
      )}
      <div className="flex items-center gap-3 mt-3">
        <ActionButton onClick={mode === 'split' ? handleSplit : handleMerge} disabled={!files.length || processing}>
          {processing ? <><Loader2 size={14} className="animate-spin" /> 处理中...</> : mode === 'split' ? <><FileText size={14} /> 拆分并下载</> : <><FileText size={14} /> 合并并下载</>}
        </ActionButton>
        {files.length > 0 && <ActionButton variant="secondary" onClick={clearFiles}>清空</ActionButton>}
      </div>
    </>
  )
}

// ── Image Compress ──────────────────────────────────────────────

function ImgCompress() {
  const { files, addFiles, removeFile, clearFiles } = useFileList()
  const [quality, setQuality] = useState(75)
  const [outputType, setOutputType] = useState('image/jpeg')
  const [processing, setProcessing] = useState(false)
  const [results, setResults] = useState<{ name: string; origSize: number; newSize: number; blob: Blob }[]>([])

  const handleCompress = useCallback(async () => {
    if (!files.length) return
    setProcessing(true)
    setResults([])
    try {
      const res: typeof results = []
      for (const item of files) {
        const img = await loadImage(item.file)
        const canvas = document.createElement('canvas')
        canvas.width = img.width; canvas.height = img.height
        canvas.getContext('2d')!.drawImage(img, 0, 0)
        const blob = await canvasToBlob(canvas, outputType, quality / 100)
        res.push({ name: item.file.name, origSize: item.file.size, newSize: blob.size, blob })
      }
      setResults(res)
    } catch (err) {
      alert('压缩失败: ' + (err as Error).message)
    } finally {
      setProcessing(false)
    }
  }, [files, quality, outputType])

  const downloadResult = useCallback((r: typeof results[0]) => {
    const ext = outputType === 'image/png' ? '.png' : outputType === 'image/webp' ? '.webp' : '.jpg'
    downloadBlob(r.blob, r.name.replace(/\.\w+$/, '') + '_compressed' + ext)
  }, [outputType])

  const downloadAll = useCallback(async () => {
    const ext = outputType === 'image/png' ? '.png' : outputType === 'image/webp' ? '.webp' : '.jpg'
    const zip = new JSZip()
    for (const r of results) {
      const name = r.name.replace(/\.\w+$/, '') + '_compressed' + ext
      zip.file(name, r.blob)
    }
    const out = await zip.generateAsync({ type: 'blob' })
    downloadBlob(out, 'compressed_images.zip')
  }, [results, outputType])

  return (
    <>
      <DropZone onDrop={addFiles} accept="image/*,.heic,.HEIC,.heif,.HEIF" />
      <FileList files={files} onRemove={removeFile} />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">输出格式</label>
          <select value={outputType} onChange={e => setOutputType(e.target.value)} className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100">
            <option value="image/jpeg">JPG</option>
            <option value="image/png">PNG</option>
            <option value="image/webp">WebP</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">质量: {quality}%</label>
          <input type="range" min={1} max={100} value={quality} onChange={e => setQuality(Number(e.target.value))} className="w-full mt-2" />
        </div>
      </div>
      <div className="flex items-center gap-3 mt-3">
        <ActionButton onClick={handleCompress} disabled={!files.length || processing}>
          {processing ? <><Loader2 size={14} className="animate-spin" /> 压缩中...</> : <><Minimize2 size={14} /> 压缩</>}
        </ActionButton>
        {files.length > 0 && <ActionButton variant="secondary" onClick={clearFiles}>清空</ActionButton>}
      </div>
      {results.length > 0 && (
        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">压缩结果</span>
            <button onClick={downloadAll} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">全部下载</button>
          </div>
          {results.map((r, i) => {
            const ratio = r.newSize < r.origSize ? ((1 - r.newSize / r.origSize) * 100).toFixed(1) : ((r.newSize / r.origSize - 1) * 100).toFixed(1)
            const saved = r.newSize < r.origSize
            const ext = outputType === 'image/png' ? '.png' : outputType === 'image/webp' ? '.webp' : '.jpg'
            const displayName = r.name.replace(/\.\w+$/, '') + ext
            return (
              <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                <FileImage size={16} className="text-gray-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-gray-800 dark:text-gray-200 truncate">{displayName}</div>
                  <div className="text-xs text-gray-400">{formatSize(r.origSize)} → {formatSize(r.newSize)}</div>
                </div>
                <span className={`text-xs font-medium ${saved ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>{saved ? '-' : '+'}{ratio}%</span>
                <button onClick={() => downloadResult(r)} className="p-1 text-gray-400 hover:text-blue-500"><Download size={14} /></button>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}

// ── Helpers ──────────────────────────────────────────────────────

async function loadAsBlob(file: File): Promise<Blob> {
  if (isHeicFile(file)) {
    const blob = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.92 })
    return Array.isArray(blob) ? blob[0] : blob as Blob
  }
  return file
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise(async (resolve, reject) => {
    try {
      const blob = await loadAsBlob(file)
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error('无法加载图片'))
      img.src = URL.createObjectURL(blob)
    } catch (err) {
      reject(err)
    }
  })
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => { if (blob) resolve(blob); else reject(new Error('Canvas 转 Blob 失败')) }, type, quality)
  })
}

function parsePageRange(range: string, total: number): number[] {
  if (!range.trim()) return Array.from({ length: total }, (_, i) => i)
  const pages = new Set<number>()
  for (const part of range.split(',')) {
    const trimmed = part.trim()
    if (trimmed.includes('-')) {
      const [a, b] = trimmed.split('-').map(Number)
      if (!isNaN(a) && !isNaN(b)) { for (let i = a; i <= b && i <= total; i++) { if (i >= 1) pages.add(i - 1) } }
    } else {
      const n = Number(trimmed)
      if (!isNaN(n) && n >= 1 && n <= total) pages.add(n - 1)
    }
  }
  return [...pages].sort((a, b) => a - b)
}

// ── Main Component ──────────────────────────────────────────────

export default function ImageConverter() {
  const [tab, setTab] = useState<Tab>('heic2jpg')

  const renderTab = () => {
    switch (tab) {
      case 'heic2jpg': return <HeicToJpg />
      case 'img2pdf': return <ImgToPdf />
      case 'webp2png': return <WebpToPng />
      case 'pdf': return <PdfTool />
      case 'compress': return <ImgCompress />
    }
  }

  return (
    <ToolShell title="图片转换" description="HEIC 转 JPG、图片转 PDF、WebP 转 PNG、PDF 拆分合并、图片压缩，全部在浏览器本地完成">
      <Section>
        <div className="flex gap-2 flex-wrap mb-4">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === t.id ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
              {t.label}
            </button>
          ))}
        </div>
        {renderTab()}
      </Section>
    </ToolShell>
  )
}
