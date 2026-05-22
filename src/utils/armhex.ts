export function hexToBytes(hex: string): number[] {
  const clean = hex.replace(/[\s,]/g, '').replace(/^0x/i, '')
  if (clean.length % 2 !== 0) throw new Error('HEX 字符串长度必须为偶数')
  return clean.match(/.{2}/g)!.map(b => parseInt(b, 16))
}

export function bytesToHex(bytes: number[]): string {
  return bytes.map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ')
}

export function hexToBinary(hex: string): string {
  return hexToBytes(hex)
    .map(b => b.toString(2).padStart(8, '0'))
    .join(' ')
}

export function reverseEndian(hex: string): string {
  const bytes = hexToBytes(hex)
  return bytes.reverse().map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ')
}

export function intToHex(value: number, bytes: number = 4): string {
  const arr: number[] = []
  for (let i = 0; i < bytes; i++) {
    arr.push((value >> (i * 8)) & 0xff)
  }
  return arr.map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ')
}

export function hexToInt(hex: string, signed = false): number {
  const bytes = hexToBytes(hex)
  let result = 0
  for (let i = bytes.length - 1; i >= 0; i--) {
    result = (result << 8) | bytes[i]
  }
  if (signed && bytes.length > 0 && (bytes[bytes.length - 1] & 0x80)) {
    result -= 1 << (bytes.length * 8)
  }
  return result
}

// ARM instruction decoder (basic)
export function decodeArmInstruction(hex: string): string {
  const bytes = hexToBytes(hex)
  if (bytes.length !== 4) return '需要 4 字节 ARM 指令'

  const word = (bytes[3] << 24) | (bytes[2] << 16) | (bytes[1] << 8) | bytes[0]
  const cond = (word >>> 28) & 0xf
  const condStr = ['EQ','NE','CS','CC','MI','PL','VS','VC','HI','LS','GE','LT','GT','LE','AL','NV'][cond]

  // Check if it's a branch
  if (((word >>> 24) & 0x0f) === 0x0a) {
    let offset = word & 0x00ffffff
    if (offset & 0x800000) offset |= 0xff000000 // sign extend
    const signedOffset = (offset << 2)
    return `B${condStr} (offset: ${signedOffset >= 0 ? '+' : ''}${signedOffset})`
  }

  return `ARM 指令 (条件: ${condStr}, 原始: 0x${hex.replace(/\s/g, '')})`
}
