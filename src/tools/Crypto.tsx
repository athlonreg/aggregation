import { useState } from 'react'
import ToolShell, { Section, TextareaWithCopy, ActionButton, Select, TextInput } from '../components/ToolShell'
import { md5, sha1, sha256, sha512, aesEncrypt, aesDecrypt, desEncrypt, desDecrypt, tripleDesEncrypt, tripleDesDecrypt } from '../utils/crypto'

type HashAlg = 'md5' | 'sha1' | 'sha256' | 'sha512'
type SymAlg = 'aes' | 'des' | '3des'

export default function CryptoTool() {
  // Hash
  const [hashInput, setHashInput] = useState('')
  const [hashAlg, setHashAlg] = useState<HashAlg>('md5')
  const [hashResult, setHashResult] = useState('')

  // Symmetric
  const [symInput, setSymInput] = useState('')
  const [symKey, setSymKey] = useState('')
  const [symAlg, setSymAlg] = useState<SymAlg>('aes')
  const [symDirection, setSymDirection] = useState<'encrypt' | 'decrypt'>('encrypt')
  const [symResult, setSymResult] = useState('')
  const [symError, setSymError] = useState('')

  const handleHash = () => {
    const fn = { md5, sha1, sha256, sha512 }
    setHashResult(fn[hashAlg](hashInput))
  }

  const handleSym = () => {
    setSymError('')
    try {
      const fns = {
        aes: { encrypt: aesEncrypt, decrypt: aesDecrypt },
        des: { encrypt: desEncrypt, decrypt: desDecrypt },
        '3des': { encrypt: tripleDesEncrypt, decrypt: tripleDesDecrypt },
      }
      setSymResult(fns[symAlg][symDirection](symInput, symKey))
    } catch (e) {
      setSymError((e as Error).message)
      setSymResult('')
    }
  }

  return (
    <ToolShell title="哈希 / 加解密" description="哈希计算与对称加密解密">
      <Section title="哈希计算">
        <div className="flex flex-wrap gap-3 items-end mb-3">
          <Select value={hashAlg} onChange={v => setHashAlg(v as HashAlg)} options={[
            { value: 'md5', label: 'MD5' },
            { value: 'sha1', label: 'SHA-1' },
            { value: 'sha256', label: 'SHA-256' },
            { value: 'sha512', label: 'SHA-512' },
          ]} label="算法" />
          <ActionButton onClick={handleHash}>计算</ActionButton>
        </div>
        <TextareaWithCopy value={hashInput} onChange={setHashInput} placeholder="输入要计算哈希的文本..." label="输入" />
        {hashResult && <div className="mt-3"><TextareaWithCopy value={hashResult} readOnly label="哈希值" /></div>}
      </Section>

      <Section title="对称加密 / 解密">
        <div className="flex flex-wrap gap-3 items-end mb-3">
          <Select value={symAlg} onChange={v => setSymAlg(v as SymAlg)} options={[
            { value: 'aes', label: 'AES' },
            { value: 'des', label: 'DES' },
            { value: '3des', label: '3DES' },
          ]} label="算法" />
          <Select value={symDirection} onChange={v => setSymDirection(v as 'encrypt' | 'decrypt')} options={[
            { value: 'encrypt', label: '加密' },
            { value: 'decrypt', label: '解密' },
          ]} label="方向" />
          <ActionButton onClick={handleSym}>{symDirection === 'encrypt' ? '加密' : '解密'}</ActionButton>
        </div>
        <TextInput value={symKey} onChange={setSymKey} placeholder="输入密钥" label="密钥" />
        <div className="mt-3">
          <TextareaWithCopy value={symInput} onChange={setSymInput} placeholder={symDirection === 'encrypt' ? '输入明文...' : '输入密文...'} label="输入" />
        </div>
        {symError && <div className="mt-2 text-sm text-red-500">{symError}</div>}
        {symResult && <div className="mt-3"><TextareaWithCopy value={symResult} readOnly label="结果" /></div>}
      </Section>
    </ToolShell>
  )
}
