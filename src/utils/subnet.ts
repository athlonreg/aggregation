export interface SubnetResult {
  network: string
  broadcast: string
  firstHost: string
  lastHost: string
  totalHosts: number
  mask: string
  wildcardMask: string
  cidr: number
  binaryMask: string
}

export function calculateSubnet(ip: string, cidr: number): SubnetResult {
  const ipParts = ip.split('.').map(Number)
  if (ipParts.length !== 4 || ipParts.some(p => p < 0 || p > 255)) {
    throw new Error('无效的 IP 地址')
  }
  if (cidr < 0 || cidr > 32) throw new Error('CIDR 必须在 0-32 之间')

  const ipNum = ((ipParts[0] << 24) | (ipParts[1] << 16) | (ipParts[2] << 8) | ipParts[3]) >>> 0
  const maskNum = cidr === 0 ? 0 : (~0 << (32 - cidr)) >>> 0
  const wildcardNum = (~maskNum) >>> 0
  const networkNum = (ipNum & maskNum) >>> 0
  const broadcastNum = (networkNum | wildcardNum) >>> 0

  const toIp = (n: number) => `${(n >>> 24) & 255}.${(n >>> 16) & 255}.${(n >>> 8) & 255}.${n & 255}`

  const totalHosts = cidr >= 31 ? (cidr === 31 ? 2 : 1) : (wildcardNum - 1)

  return {
    network: toIp(networkNum),
    broadcast: toIp(broadcastNum),
    firstHost: cidr >= 31 ? toIp(networkNum) : toIp(networkNum + 1),
    lastHost: cidr >= 31 ? toIp(broadcastNum) : toIp(broadcastNum - 1),
    totalHosts,
    mask: toIp(maskNum),
    wildcardMask: toIp(wildcardNum),
    cidr,
    binaryMask: maskNum.toString(2).padStart(32, '0').match(/.{8}/g)!.join('.'),
  }
}

export function parseCidr(input: string): { ip: string; cidr: number } {
  const match = input.match(/^(\d+\.\d+\.\d+\.\d+)(?:\/(\d+))?$/)
  if (!match) throw new Error('格式: IP/CIDR, 例如 192.168.1.0/24')
  return { ip: match[1], cidr: parseInt(match[2] ?? '32') }
}
