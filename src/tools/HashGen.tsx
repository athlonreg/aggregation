import { useState } from 'react'
import ToolShell, { Section, ActionButton, TextareaWithCopy } from '../components/ToolShell'

// Lightweight MD5 implementation (RFC 1321)
function md5(input: string): string {
  function rotateLeft(v: number, s: number) { return (v << s) | (v >>> (32 - s)) }
  function addUnsigned(a: number, b: number) {
    const lsw = (a & 0xffff) + (b & 0xffff)
    const msw = (a >> 16) + (b >> 16) + (lsw >> 16)
    return (msw << 16) | (lsw & 0xffff)
  }
  function md5cmn(q: number, a: number, b: number, x: number, s: number, t: number) {
    return addUnsigned(rotateLeft(addUnsigned(addUnsigned(a, q), addUnsigned(x, t)), s), b)
  }
  function md5ff(a: number, b: number, c: number, d: number, x: number, s: number, t: number) { return md5cmn((b & c) | (~b & d), a, b, x, s, t) }
  function md5gg(a: number, b: number, c: number, d: number, x: number, s: number, t: number) { return md5cmn((b & d) | (c & ~d), a, b, x, s, t) }
  function md5hh(a: number, b: number, c: number, d: number, x: number, s: number, t: number) { return md5cmn(b ^ c ^ d, a, b, x, s, t) }
  function md5ii(a: number, b: number, c: number, d: number, x: number, s: number, t: number) { return md5cmn(c ^ (b | ~d), a, b, x, s, t) }

  function convertToWordArray(str: string) {
    const lWordCount = Math.ceil(str.length / 4)
    const lWordArray = new Array<number>(lWordCount + 15).fill(0)
    for (let i = 0; i < str.length; i++) lWordArray[i >> 2] |= str.charCodeAt(i) << ((i % 4) * 8)
    lWordArray[str.length >> 2] |= 0x80 << ((str.length % 4) * 8)
    lWordArray[lWordArray.length - 2] = str.length << 3
    return lWordArray
  }

  function wordToHex(val: number) {
    let hex = ''
    for (let j = 0; j <= 3; j++) {
      const byte = (val >>> (j * 8)) & 0xff
      hex += ('0' + byte.toString(16)).slice(-2)
    }
    return hex
  }

  let a = 0x67452301, b = 0xefcdab89, c = 0x98badcfe, d = 0x10325476
  const x = convertToWordArray(input)

  for (let k = 0; k < x.length; k += 16) {
    const aa = a, bb = b, cc = c, dd = d
    a = md5ff(a, b, c, d, x[k], 7, -680876936); d = md5ff(d, a, b, c, x[k+1], 12, -389564586); c = md5ff(c, d, a, b, x[k+2], 17, 606105819); b = md5ff(b, c, d, a, x[k+3], 22, -1044525330)
    a = md5ff(a, b, c, d, x[k+4], 7, -176418897); d = md5ff(d, a, b, c, x[k+5], 12, 1200080426); c = md5ff(c, d, a, b, x[k+6], 17, -1473231341); b = md5ff(b, c, d, a, x[k+7], 22, -45705983)
    a = md5ff(a, b, c, d, x[k+8], 7, 1770035416); d = md5ff(d, a, b, c, x[k+9], 12, -1958414417); c = md5ff(c, d, a, b, x[k+10], 17, -42063); b = md5ff(b, c, d, a, x[k+11], 22, -1990404162)
    a = md5ff(a, b, c, d, x[k+12], 7, 1804603682); d = md5ff(d, a, b, c, x[k+13], 12, -40341101); c = md5ff(c, d, a, b, x[k+14], 17, -1502002290); b = md5ff(b, c, d, a, x[k+15], 22, 1236535329)
    a = md5gg(a, b, c, d, x[k+1], 5, -165796510); d = md5gg(d, a, b, c, x[k+6], 9, -1069501632); c = md5gg(c, d, a, b, x[k+11], 14, 643717713); b = md5gg(b, c, d, a, x[k], 20, -373897302)
    a = md5gg(a, b, c, d, x[k+5], 5, -701558691); d = md5gg(d, a, b, c, x[k+10], 9, 38016083); c = md5gg(c, d, a, b, x[k+15], 14, -660478335); b = md5gg(b, c, d, a, x[k+4], 20, -405537848)
    a = md5gg(a, b, c, d, x[k+9], 5, 568446438); d = md5gg(d, a, b, c, x[k+14], 9, -1019803690); c = md5gg(c, d, a, b, x[k+3], 14, -187363961); b = md5gg(b, c, d, a, x[k+8], 20, 1163531501)
    a = md5gg(a, b, c, d, x[k+13], 5, -1444681467); d = md5gg(d, a, b, c, x[k+2], 9, -51403784); c = md5gg(c, d, a, b, x[k+7], 14, 1735328473); b = md5gg(b, c, d, a, x[k+12], 20, -1926607734)
    a = md5hh(a, b, c, d, x[k+5], 4, -378558); d = md5hh(d, a, b, c, x[k+8], 11, -2022574463); c = md5hh(c, d, a, b, x[k+11], 16, 1839030562); b = md5hh(b, c, d, a, x[k+14], 23, -35309556)
    a = md5hh(a, b, c, d, x[k+1], 4, -1530992060); d = md5hh(d, a, b, c, x[k+4], 11, 1272893353); c = md5hh(c, d, a, b, x[k+7], 16, -155497632); b = md5hh(b, c, d, a, x[k+10], 23, -1094730640)
    a = md5hh(a, b, c, d, x[k+13], 4, 681279174); d = md5hh(d, a, b, c, x[k], 11, -358537222); c = md5hh(c, d, a, b, x[k+3], 16, -722521979); b = md5hh(b, c, d, a, x[k+6], 23, 76029189)
    a = md5hh(a, b, c, d, x[k+9], 4, -640364487); d = md5hh(d, a, b, c, x[k+12], 11, -421815835); c = md5hh(c, d, a, b, x[k+15], 16, 530742520); b = md5hh(b, c, d, a, x[k+2], 23, -995338651)
    a = md5ii(a, b, c, d, x[k], 6, -198630844); d = md5ii(d, a, b, c, x[k+7], 10, 1126891415); c = md5ii(c, d, a, b, x[k+14], 15, -1416354905); b = md5ii(b, c, d, a, x[k+5], 21, -57434055)
    a = md5ii(a, b, c, d, x[k+12], 6, 1700485571); d = md5ii(d, a, b, c, x[k+3], 10, -1894986606); c = md5ii(c, d, a, b, x[k+10], 15, -1051523); b = md5ii(b, c, d, a, x[k+1], 21, -2054922799)
    a = md5ii(a, b, c, d, x[k+8], 6, 1873313359); d = md5ii(d, a, b, c, x[k+15], 10, -30611744); c = md5ii(c, d, a, b, x[k+6], 15, -1560198380); b = md5ii(b, c, d, a, x[k+13], 21, 1309151649)
    a = md5ii(a, b, c, d, x[k+4], 6, -145523070); d = md5ii(d, a, b, c, x[k+11], 10, -1120210379); c = md5ii(c, d, a, b, x[k+2], 15, 718787259); b = md5ii(b, c, d, a, x[k+9], 21, -343485551)
    a = addUnsigned(a, aa); b = addUnsigned(b, bb); c = addUnsigned(c, cc); d = addUnsigned(d, dd)
  }
  return wordToHex(a) + wordToHex(b) + wordToHex(c) + wordToHex(d)
}

async function sha(algorithm: string, data: string): Promise<string> {
  const encoder = new TextEncoder()
  const buffer = await crypto.subtle.digest(algorithm, encoder.encode(data))
  return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('')
}

async function shaFromFile(algorithm: string, file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  const hash = await crypto.subtle.digest(algorithm, buffer)
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('')
}

type Algorithm = 'MD5' | 'SHA-1' | 'SHA-256' | 'SHA-512'

export default function HashGen() {
  const [input, setInput] = useState('')
  const [results, setResults] = useState<Record<string, string>>({})
  const [mode, setMode] = useState<'text' | 'file'>('text')
  const [fileName, setFileName] = useState('')

  const computeHash = async (alg: Algorithm) => {
    try {
      let hex: string
      if (mode === 'file' && (window as any).__hashFile) {
        if (alg === 'MD5') {
          const text = await (window as any).__hashFile.text()
          hex = md5(text)
        } else {
          hex = await shaFromFile(alg, (window as any).__hashFile)
        }
      } else {
        if (alg === 'MD5') {
          hex = md5(input)
        } else {
          hex = await sha(alg, input)
        }
      }
      setResults(prev => ({ ...prev, [alg]: hex }))
    } catch {
      setResults(prev => ({ ...prev, [alg]: '计算失败' }))
    }
  }

  const handleAll = async () => {
    for (const alg of ['MD5', 'SHA-1', 'SHA-256', 'SHA-512'] as Algorithm[]) {
      await computeHash(alg)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      ;(window as any).__hashFile = file
      setFileName(file.name)
      setMode('file')
      setResults({})
    }
  }

  const handleSwitchToText = () => {
    setMode('text')
    setFileName('')
    delete (window as any).__hashFile
    setResults({})
  }

  return (
    <ToolShell title="哈希生成" description="计算文本或文件的 MD5 / SHA 哈希值">
      <Section title="输入">
        <div className="flex gap-2 mb-3">
          <ActionButton variant={mode === 'text' ? 'primary' : 'secondary'} onClick={handleSwitchToText}>文本输入</ActionButton>
          <label className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors ${mode === 'file' ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
            文件输入
            <input type="file" className="hidden" onChange={handleFileChange} />
          </label>
        </div>
        {mode === 'text' ? (
          <TextareaWithCopy value={input} onChange={setInput} placeholder="输入要计算哈希的文本..." rows={4} />
        ) : (
          <div className="text-sm text-gray-600 dark:text-gray-400">已选择文件: <span className="font-medium">{fileName}</span></div>
        )}
      </Section>
      <Section title="算法">
        <div className="flex flex-wrap gap-2">
          {(['MD5', 'SHA-1', 'SHA-256', 'SHA-512'] as Algorithm[]).map(alg => (
            <ActionButton key={alg} onClick={() => computeHash(alg)}>{alg}</ActionButton>
          ))}
          <ActionButton onClick={handleAll} variant="secondary">全部计算</ActionButton>
        </div>
      </Section>
      {Object.keys(results).length > 0 && (
        <Section title="结果">
          <div className="space-y-3">
            {Object.entries(results).map(([alg, hash]) => (
              <TextareaWithCopy key={alg} value={hash} readOnly label={alg} rows={2} />
            ))}
          </div>
        </Section>
      )}
    </ToolShell>
  )
}
