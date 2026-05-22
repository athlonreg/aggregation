import { useState, useCallback } from 'react'
import ToolShell, { Section, ActionButton, TextInput, Select, TextareaWithCopy } from '../components/ToolShell'
import { Download } from 'lucide-react'
import * as forge from 'node-forge'

interface CertResult {
  certPem: string
  keyPem: string
  serialNumber: string
  fingerprint: string
  validFrom: string
  validTo: string
  subject: string
  issuer: string
  sans: string[]
}

const KEY_SIZES = [
  { value: '2048', label: '2048 位' },
  { value: '4096', label: '4096 位' },
]

const HASH_ALGOS = [
  { value: 'sha256', label: 'SHA-256' },
  { value: 'sha384', label: 'SHA-384' },
  { value: 'sha512', label: 'SHA-512' },
]

export default function SelfSignedCert() {
  const [commonName, setCommonName] = useState('localhost')
  const [orgName, setOrgName] = useState('')
  const [orgUnit, setOrgUnit] = useState('')
  const [country, setCountry] = useState('')
  const [state, setState] = useState('')
  const [locality, setLocality] = useState('')
  const [sans, setSans] = useState('localhost,127.0.0.1,::1')
  const [validDays, setValidDays] = useState('365')
  const [keySize, setKeySize] = useState('2048')
  const [hashAlgo, setHashAlgo] = useState('sha256')
  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState<CertResult | null>(null)
  const [error, setError] = useState('')

  const handleGenerate = useCallback(() => {
    if (!commonName.trim()) { setError('Common Name 不能为空'); return }
    setGenerating(true)
    setError('')
    setResult(null)

    try {
      const keys = forge.pki.rsa.generateKeyPair({ bits: parseInt(keySize) })
      const cert = forge.pki.createCertificate()

      cert.publicKey = keys.publicKey
      cert.serialNumber = '01' + forge.util.bytesToHex(forge.random.getBytesSync(19))

      const now = new Date()
      cert.validity.notBefore = now
      cert.validity.notAfter = new Date(now.getTime() + parseInt(validDays) * 86400000)

      const attrs: forge.pki.CertificateField[] = []
      if (country) attrs.push({ name: 'countryName', value: country })
      if (state) attrs.push({ name: 'stateOrProvinceName', value: state })
      if (locality) attrs.push({ name: 'localityName', value: locality })
      if (orgName) attrs.push({ name: 'organizationName', value: orgName })
      if (orgUnit) attrs.push({ name: 'organizationalUnitName', value: orgUnit })
      attrs.push({ name: 'commonName', value: commonName })

      cert.setSubject(attrs)
      cert.setIssuer(attrs) // Self-signed

      // SANs
      const sanList = sans.split(/[,，\s]+/).filter(Boolean).map(s => {
        const trimmed = s.trim()
        if (/^\d{1,3}(\.\d{1,3}){3}$/.test(trimmed)) return { type: 7, ip: trimmed } // IPv4
        if (/^[\da-fA-F:]+$/.test(trimmed) && trimmed.includes(':')) return { type: 7, ip: trimmed } // IPv6
        return { type: 2, value: trimmed } // DNS
      })

      cert.setExtensions([
        { name: 'basicConstraints', cA: false },
        { name: 'keyUsage', digitalSignature: true, keyEncipherment: true },
        { name: 'extKeyUsage', serverAuth: true, clientAuth: true },
        { name: 'subjectAltName', altNames: sanList },
      ])

      const mdObj = forge.md[hashAlgo as 'sha256' | 'sha384' | 'sha512']
      cert.sign(keys.privateKey, mdObj.create())

      const certPem = forge.pki.certificateToPem(cert)
      const keyPem = forge.pki.privateKeyToPem(keys.privateKey)

      const derBytes = forge.asn1.toDer(forge.pki.certificateToAsn1(cert)).getBytes()
      const md = forge.md.sha1.create()
      md.update(derBytes)
      const fingerprint = md.digest().toHex().match(/.{2}/g)!.join(':').toUpperCase()

      setResult({
        certPem,
        keyPem,
        serialNumber: cert.serialNumber,
        fingerprint,
        validFrom: cert.validity.notBefore.toLocaleString('zh-CN'),
        validTo: cert.validity.notAfter.toLocaleString('zh-CN'),
        subject: attrs.map(a => `${a.name}=${a.value}`).join(', '),
        issuer: attrs.map(a => `${a.name}=${a.value}`).join(', '),
        sans: sanList.map(s => s.type === 7 ? (s.ip || '') : (s.value || '')),
      })
    } catch (err) {
      setError((err as Error).message || '生成失败')
    } finally {
      setGenerating(false)
    }
  }, [commonName, orgName, orgUnit, country, state, locality, sans, validDays, keySize, hashAlgo])

  const handleDownload = useCallback((content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = filename; a.click()
    URL.revokeObjectURL(url)
  }, [])

  return (
    <ToolShell title="自签证书生成" description="生成自签名 SSL/TLS 证书和私钥，用于开发测试环境">
      <Section title="证书信息">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
          <TextInput value={commonName} onChange={setCommonName} placeholder="localhost" label="Common Name (CN) *" />
          <TextInput value={orgName} onChange={setOrgName} placeholder="My Organization" label="组织名称 (O)" />
          <TextInput value={orgUnit} onChange={setOrgUnit} placeholder="Development" label="部门 (OU)" />
          <TextInput value={country} onChange={setCountry} placeholder="CN" label="国家 (C)" />
          <TextInput value={state} onChange={setState} placeholder="Beijing" label="省/州 (ST)" />
          <TextInput value={locality} onChange={setLocality} placeholder="Beijing" label="城市 (L)" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
          <TextInput value={sans} onChange={setSans} placeholder="localhost,127.0.0.1" label="SAN (逗号分隔)" />
          <TextInput value={validDays} onChange={setValidDays} placeholder="365" label="有效期 (天)" />
          <Select value={keySize} onChange={setKeySize} options={KEY_SIZES} label="密钥长度" />
          <Select value={hashAlgo} onChange={setHashAlgo} options={HASH_ALGOS} label="签名算法" />
        </div>
        <div className="flex items-center gap-3">
          <ActionButton onClick={handleGenerate} disabled={generating}>
            {generating ? '生成中...' : '生成证书'}
          </ActionButton>
          {error && <span className="text-sm text-red-500">{error}</span>}
        </div>
      </Section>

      {result && (
        <>
          <Section title="证书信息">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { label: '序列号', value: result.serialNumber },
                { label: '指纹 (SHA-1)', value: result.fingerprint },
                { label: '生效时间', value: result.validFrom },
                { label: '过期时间', value: result.validTo },
                { label: '主题', value: result.subject },
                { label: 'SAN', value: result.sans.join(', ') },
              ].map(item => (
                <div key={item.label} className="flex flex-col gap-0.5">
                  <span className="text-xs text-gray-500 dark:text-gray-400">{item.label}</span>
                  <span className="text-sm font-mono text-gray-800 dark:text-gray-200 break-all">{item.value}</span>
                </div>
              ))}
            </div>
          </Section>

          <Section title="证书 (PEM)">
            <div className="flex gap-2 mb-2">
              <button onClick={() => handleDownload(result.certPem, `${commonName}.crt`)} className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline">
                <Download size={12} /> 下载 .crt
              </button>
            </div>
            <TextareaWithCopy value={result.certPem} readOnly rows={8} />
          </Section>

          <Section title="私钥 (PEM)">
            <div className="flex gap-2 mb-2">
              <button onClick={() => handleDownload(result.keyPem, `${commonName}.key`)} className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline">
                <Download size={12} /> 下载 .key
              </button>
            </div>
            <TextareaWithCopy value={result.keyPem} readOnly rows={8} />
            <div className="mt-2 text-xs text-yellow-600 dark:text-yellow-400">
              请妥善保管私钥，切勿泄露。自签证书仅适用于开发测试环境，不建议用于生产。
            </div>
          </Section>
        </>
      )}
    </ToolShell>
  )
}
