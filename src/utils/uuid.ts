export function generateUUIDv4(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export function generateUUIDv1(): string {
  // Simplified v1-like UUID using current timestamp
  const now = Date.now()
  const timeHex = now.toString(16).padStart(12, '0')
  const clockSeq = ((Math.random() * 0x3fff) | 0x8000).toString(16)
  const node = Array.from({ length: 6 }, () =>
    ((Math.random() * 256) | 0).toString(16).padStart(2, '0')
  ).join('')
  return `${timeHex.slice(4, 12)}-${timeHex.slice(0, 4)}-1${timeHex.slice(0, 3)}-${clockSeq}-${node}`
}

export function generateGUID(): string {
  return generateUUIDv4().toUpperCase()
}

export function generateMultiple(generator: () => string, count: number): string[] {
  return Array.from({ length: count }, generator)
}
