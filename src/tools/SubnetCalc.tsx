import { useState } from 'react'
import ToolShell, { Section, ActionButton, TextInput } from '../components/ToolShell'
import { calculateSubnet, parseCidr, type SubnetResult } from '../utils/subnet'

export default function SubnetCalc() {
  const [input, setInput] = useState('192.168.1.0/24')
  const [result, setResult] = useState<SubnetResult | null>(null)
  const [error, setError] = useState('')

  const handleCalc = () => {
    setError('')
    try {
      const { ip, cidr } = parseCidr(input)
      setResult(calculateSubnet(ip, cidr))
    } catch (e) {
      setError((e as Error).message)
      setResult(null)
    }
  }

  return (
    <ToolShell title="子网掩码计算器" description="计算网络地址、广播地址、主机范围等">
      <Section>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-48">
            <TextInput value={input} onChange={setInput} placeholder="192.168.1.0/24" label="IP/CIDR" />
          </div>
          <ActionButton onClick={handleCalc}>计算</ActionButton>
        </div>
        {error && <div className="mt-2 text-sm text-red-500">{error}</div>}
      </Section>

      {result && (
        <Section title="计算结果">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              ['网络地址', result.network],
              ['广播地址', result.broadcast],
              ['子网掩码', result.mask],
              ['通配掩码', result.wildcardMask],
              ['第一个主机', result.firstHost],
              ['最后一个主机', result.lastHost],
              ['可用主机数', result.totalHosts.toLocaleString()],
              ['CIDR', `/${result.cidr}`],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <span className="text-sm text-gray-500">{label}</span>
                <span className="font-mono text-sm font-medium text-gray-900 dark:text-white">{value}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-xs text-gray-500 mb-1">二进制掩码</div>
            <div className="font-mono text-xs text-gray-700 dark:text-gray-300 break-all">{result.binaryMask}</div>
          </div>
        </Section>
      )}
    </ToolShell>
  )
}
