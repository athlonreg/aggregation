import { useState, useCallback, useRef } from 'react'
import ToolShell, { Section, ActionButton } from '../components/ToolShell'
import { Upload, Download, Loader2, QrCode, Barcode, Layers, X } from 'lucide-react'
import QRCodeLib from 'qrcode'
import JsBarcode from 'jsbarcode'
import JSZip from 'jszip'

type Tab = 'qr' | 'barcode' | 'batch'

const TABS: { id: Tab; label: string }[] = [
  { id: 'qr', label: '二维码生成' },
  { id: 'barcode', label: '条码生成' },
  { id: 'batch', label: '批量生成' },
]

type QrMode = 'url' | 'wifi' | 'vcard' | 'text'

const QR_MODES: { id: QrMode; label: string }[] = [
  { id: 'url', label: 'URL' },
  { id: 'wifi', label: 'Wi-Fi' },
  { id: 'vcard', label: 'vCard' },
  { id: 'text', label: '纯文本' },
]

const BARCODE_TYPES = [
  { value: 'CODE128', label: 'CODE128' },
  { value: 'CODE39', label: 'CODE39' },
  { value: 'EAN13', label: 'EAN-13' },
  { value: 'EAN8', label: 'EAN-8' },
  { value: 'UPC', label: 'UPC-A' },
  { value: 'ITF14', label: 'ITF-14' },
  { value: 'pharmacode', label: 'Pharmacode' },
]

const DOWNLOAD_SIZES = [
  { size: 256, label: '256×256' },
  { size: 512, label: '512×512' },
  { size: 1024, label: '1024×1024' },
  { size: 2048, label: '2048×2048' },
]

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement('a'); a.href = dataUrl; a.download = filename; a.click()
}

// ── Generate QR data string ─────────────────────────────────────

function buildQrString(mode: QrMode, fields: Record<string, string>, useSafeRedirect: boolean): string {
  switch (mode) {
    case 'url': {
      const url = fields.url || ''
      if (!url) return ''
      return useSafeRedirect ? `${window.location.origin}/redirect?url=${encodeURIComponent(url)}` : url
    }
    case 'wifi': return `WIFI:T:${fields.security || 'WPA'};S:${fields.ssid || ''};P:${fields.password || ''};H:${fields.hidden === 'true' ? 'true' : 'false'};;`
    case 'vcard':
      return [
        'BEGIN:VCARD',
        'VERSION:3.0',
        fields.name ? `FN:${fields.name}` : '',
        fields.org ? `ORG:${fields.org}` : '',
        fields.phone ? `TEL:${fields.phone}` : '',
        fields.email ? `EMAIL:${fields.email}` : '',
        fields.url ? `URL:${fields.url}` : '',
        'END:VCARD',
      ].filter(Boolean).join('\n')
    case 'text': return fields.text || ''
  }
}

// ── QR to canvas with optional logo ─────────────────────────────

async function qrToCanvas(text: string, size: number, logoFile?: File | null): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas')
  canvas.width = size; canvas.height = size
  await QRCodeLib.toCanvas(canvas, text, {
    width: size,
    margin: 2,
    errorCorrectionLevel: logoFile ? 'H' : 'M',
    color: { dark: '#000000', light: '#ffffff' },
  })
  if (logoFile) {
    const logo = await loadImage(logoFile)
    const logoSize = size * 0.2
    const x = (size - logoSize) / 2, y = (size - logoSize) / 2
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(x - 4, y - 4, logoSize + 8, logoSize + 8)
    ctx.drawImage(logo, x, y, logoSize, logoSize)
  }
  return canvas
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('图片加载失败'))
    img.src = URL.createObjectURL(file)
  })
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(b => { if (b) resolve(b); else reject(new Error('导出失败')) }, type, quality)
  })
}

// ── QR Code Tab ─────────────────────────────────────────────────

function QRTab() {
  const [mode, setMode] = useState<QrMode>('url')
  const [fields, setFields] = useState<Record<string, string>>({ url: '', ssid: '', password: '', security: 'WPA', hidden: 'false', name: '', org: '', phone: '', email: '', text: '' })
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string>('')
  const [preview, setPreview] = useState<string>('')
  const [generating, setGenerating] = useState(false)
  const [useSafeRedirect, setUseSafeRedirect] = useState(true)
  const logoInputRef = useRef<HTMLInputElement>(null)

  const setField = useCallback((k: string, v: string) => setFields(prev => ({ ...prev, [k]: v })), [])

  const handleLogo = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) { setLogoFile(f); setLogoPreview(URL.createObjectURL(f)) }
  }, [])

  const removeLogo = useCallback(() => {
    setLogoFile(null); setLogoPreview('')
    if (logoInputRef.current) logoInputRef.current.value = ''
  }, [])

  const handleGenerate = useCallback(async () => {
    const text = buildQrString(mode, fields, useSafeRedirect)
    if (!text.trim()) return
    setGenerating(true)
    try {
      const canvas = await qrToCanvas(text, 512, logoFile)
      setPreview(canvas.toDataURL('image/png'))
    } catch (err) { alert('生成失败: ' + (err as Error).message) }
    finally { setGenerating(false) }
  }, [mode, fields, logoFile])

  const handleDownload = useCallback(async (size: number) => {
    const text = buildQrString(mode, fields, useSafeRedirect)
    if (!text.trim()) return
    const canvas = await qrToCanvas(text, size, logoFile)
    downloadDataUrl(canvas.toDataURL('image/png'), `qrcode_${size}x${size}.png`)
  }, [mode, fields, logoFile])

  return (
    <>
      <div className="flex gap-2 flex-wrap mb-3">
        {QR_MODES.map(m => (
          <button key={m.id} onClick={() => setMode(m.id)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${mode === m.id ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>{m.label}</button>
        ))}
      </div>

      {mode === 'url' && (
        <div className="mb-3 space-y-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">URL 地址</label>
            <input value={fields.url} onChange={e => setField('url', e.target.value)} placeholder="https://example.com" className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100" />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={useSafeRedirect} onChange={e => setUseSafeRedirect(e.target.checked)} className="rounded border-gray-300 dark:border-gray-700" />
            <span className="text-sm text-gray-600 dark:text-gray-400">安全跳转（扫码后先提示目标地址）</span>
          </label>
        </div>
      )}

      {mode === 'wifi' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">网络名称 (SSID)</label>
            <input value={fields.ssid} onChange={e => setField('ssid', e.target.value)} placeholder="MyWiFi" className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">密码</label>
            <input value={fields.password} onChange={e => setField('password', e.target.value)} placeholder="password" className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">加密方式</label>
            <select value={fields.security} onChange={e => setField('security', e.target.value)} className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100">
              <option value="WPA">WPA/WPA2</option>
              <option value="WEP">WEP</option>
              <option value="nopass">无密码</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">隐藏网络</label>
            <select value={fields.hidden} onChange={e => setField('hidden', e.target.value)} className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100">
              <option value="false">否</option>
              <option value="true">是</option>
            </select>
          </div>
        </div>
      )}

      {mode === 'vcard' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">姓名 *</label>
            <input value={fields.name} onChange={e => setField('name', e.target.value)} placeholder="张三" className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">公司</label>
            <input value={fields.org} onChange={e => setField('org', e.target.value)} placeholder="公司名称" className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">电话</label>
            <input value={fields.phone} onChange={e => setField('phone', e.target.value)} placeholder="13800138000" className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">邮箱</label>
            <input value={fields.email} onChange={e => setField('email', e.target.value)} placeholder="email@example.com" className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">网址</label>
            <input value={fields.url} onChange={e => setField('url', e.target.value)} placeholder="https://example.com" className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100" />
          </div>
        </div>
      )}

      {mode === 'text' && (
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">文本内容</label>
          <textarea value={fields.text} onChange={e => setField('text', e.target.value)} placeholder="输入任意文本..." rows={3} className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 resize-y" />
        </div>
      )}

      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Logo（可选）</label>
        <div className="flex items-center gap-3">
          {logoPreview ? (
            <div className="relative">
              <img src={logoPreview} alt="logo" className="w-14 h-14 rounded-lg object-cover border border-gray-200 dark:border-gray-700" />
              <button onClick={removeLogo} className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center"><X size={10} /></button>
            </div>
          ) : (
            <button onClick={() => logoInputRef.current?.click()} className="w-14 h-14 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center text-gray-400 hover:border-gray-400"><Upload size={18} /></button>
          )}
          <span className="text-xs text-gray-400">添加 Logo 会降低纠错等级，建议留白</span>
          <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogo} />
        </div>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <ActionButton onClick={handleGenerate} disabled={generating}>
          {generating ? <><Loader2 size={14} className="animate-spin" /> 生成中...</> : <><QrCode size={14} /> 生成二维码</>}
        </ActionButton>
      </div>

      {preview && (
        <div className="flex flex-col sm:flex-row gap-4 items-start">
          <img src={preview} alt="QR Code" className="w-48 h-48 rounded-lg border border-gray-200 dark:border-gray-700" />
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">下载尺寸</div>
            <div className="flex flex-wrap gap-2">
              {DOWNLOAD_SIZES.map(s => (
                <button key={s.size} onClick={() => handleDownload(s.size)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                  <Download size={12} className="inline mr-1" />{s.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ── Barcode Tab ─────────────────────────────────────────────────

function BarcodeTab() {
  const [barcodeType, setBarcodeType] = useState('CODE128')
  const [barcodeText, setBarcodeText] = useState('')
  const [barcodePreview, setBarcodePreview] = useState('')
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const handleGenerate = useCallback(() => {
    if (!barcodeText.trim()) return
    try {
      const canvas = canvasRef.current!
      JsBarcode(canvas, barcodeText, { format: barcodeType, width: 2, height: 100, displayValue: true, fontSize: 14, margin: 10 })
      setBarcodePreview(canvas.toDataURL('image/png'))
    } catch (err) { alert('生成失败: ' + (err as Error).message) }
  }, [barcodeType, barcodeText])

  const handleDownload = useCallback((size: number) => {
    if (!barcodePreview) return
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ratio = size / img.width
      canvas.width = size; canvas.height = Math.round(img.height * ratio)
      const ctx = canvas.getContext('2d')!
      ctx.imageSmoothingEnabled = false
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      downloadDataUrl(canvas.toDataURL('image/png'), `barcode_${size}px.png`)
    }
    img.src = barcodePreview
  }, [barcodePreview])

  return (
    <>
      <canvas ref={canvasRef} className="hidden" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">条码类型</label>
          <select value={barcodeType} onChange={e => setBarcodeType(e.target.value)} className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100">
            {BARCODE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">内容</label>
          <input value={barcodeText} onChange={e => setBarcodeText(e.target.value)} placeholder={barcodeType === 'EAN13' ? '1234567890128' : '输入内容'} className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100" />
        </div>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <ActionButton onClick={handleGenerate} disabled={!barcodeText.trim()}>
          <Barcode size={14} /> 生成条码
        </ActionButton>
      </div>

      {barcodePreview && (
        <div className="flex flex-col sm:flex-row gap-4 items-start">
          <img src={barcodePreview} alt="Barcode" className="max-w-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white p-2" />
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">下载尺寸</div>
            <div className="flex flex-wrap gap-2">
              {[512, 1024, 2048].map(s => (
                <button key={s} onClick={() => handleDownload(s)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                  <Download size={12} className="inline mr-1" />{s}px
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ── Batch Tab ───────────────────────────────────────────────────

function BatchTab() {
  const [batchType, setBatchType] = useState<'qr' | 'barcode'>('qr')
  const [batchInput, setBatchInput] = useState('')
  const [batchBarcodeType, setBatchBarcodeType] = useState('CODE128')
  const [processing, setProcessing] = useState(false)

  const handleBatchGenerate = useCallback(async () => {
    const lines = batchInput.split('\n').map(l => l.trim()).filter(Boolean)
    if (!lines.length) return
    setProcessing(true)
    try {
      const zip = new JSZip()
      if (batchType === 'qr') {
        for (let i = 0; i < lines.length; i++) {
          const canvas = await qrToCanvas(lines[i], 512)
          const blob = await canvasToBlob(canvas, 'image/png')
          zip.file(`qrcode_${i + 1}.png`, blob)
        }
      } else {
        const canvas = document.createElement('canvas')
        for (let i = 0; i < lines.length; i++) {
          try {
            JsBarcode(canvas, lines[i], { format: batchBarcodeType, width: 2, height: 100, displayValue: true, fontSize: 14, margin: 10 })
            const blob = await canvasToBlob(canvas, 'image/png')
            zip.file(`barcode_${i + 1}.png`, blob)
          } catch { /* skip invalid entries */ }
        }
      }
      const out = await zip.generateAsync({ type: 'blob' })
      downloadBlob(out, `batch_${batchType}.zip`)
    } catch (err) { alert('批量生成失败: ' + (err as Error).message) }
    finally { setProcessing(false) }
  }, [batchType, batchInput, batchBarcodeType])

  const lines = batchInput.split('\n').map(l => l.trim()).filter(Boolean)

  return (
    <>
      <div className="flex gap-2 mb-3">
        <button onClick={() => setBatchType('qr')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${batchType === 'qr' ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>批量二维码</button>
        <button onClick={() => setBatchType('barcode')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${batchType === 'barcode' ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>批量条码</button>
      </div>

      {batchType === 'barcode' && (
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">条码类型</label>
          <select value={batchBarcodeType} onChange={e => setBatchBarcodeType(e.target.value)} className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100">
            {BARCODE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
      )}

      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">内容（每行一个）</label>
        <textarea value={batchInput} onChange={e => setBatchInput(e.target.value)} placeholder={batchType === 'qr' ? 'https://example.com\nhttps://example.org\n...' : '123456789\n987654321\n...'} rows={8} className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 font-mono resize-y" />
        {lines.length > 0 && <div className="text-xs text-gray-400 mt-1">共 {lines.length} 条</div>}
      </div>

      <ActionButton onClick={handleBatchGenerate} disabled={!lines.length || processing}>
        {processing ? <><Loader2 size={14} className="animate-spin" /> 生成中...</> : <><Layers size={14} /> 批量生成并下载 ZIP</>}
      </ActionButton>
    </>
  )
}

// ── Main Component ──────────────────────────────────────────────

export default function QRCodeGenerator() {
  const [tab, setTab] = useState<Tab>('qr')

  return (
    <ToolShell title="二维码 & 条码生成" description="支持 URL、Wi-Fi、vCard 二维码，多种条码格式，批量生成，带 Logo，多尺寸下载">
      <Section>
        <div className="flex gap-2 flex-wrap mb-4">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === t.id ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>{t.label}</button>
          ))}
        </div>
        {tab === 'qr' && <QRTab />}
        {tab === 'barcode' && <BarcodeTab />}
        {tab === 'batch' && <BatchTab />}
      </Section>
    </ToolShell>
  )
}
