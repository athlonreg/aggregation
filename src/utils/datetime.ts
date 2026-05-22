export function now(): Date {
  return new Date()
}

export function dateToTimestamp(date: Date, unit: 's' | 'ms' = 's'): number {
  return unit === 's' ? Math.floor(date.getTime() / 1000) : date.getTime()
}

export function timestampToDate(ts: number): Date {
  // Auto-detect seconds vs milliseconds
  if (ts < 1e12) ts *= 1000
  return new Date(ts)
}

export function formatDate(date: Date, format: string): string {
  const pad = (n: number, len = 2) => String(n).padStart(len, '0')
  const map: Record<string, string> = {
    'YYYY': String(date.getFullYear()),
    'MM': pad(date.getMonth() + 1),
    'DD': pad(date.getDate()),
    'HH': pad(date.getHours()),
    'mm': pad(date.getMinutes()),
    'ss': pad(date.getSeconds()),
    'SSS': pad(date.getMilliseconds(), 3),
  }
  let result = format
  for (const [token, val] of Object.entries(map)) {
    result = result.replace(token, val)
  }
  return result
}

export function parseDate(str: string): Date {
  const d = new Date(str)
  if (isNaN(d.getTime())) throw new Error('无效的日期格式')
  return d
}

export const FORMATS = [
  { label: 'ISO 8601', value: "YYYY-MM-DDTHH:mm:ss.SSSZ" },
  { label: '日期时间', value: "YYYY-MM-DD HH:mm:ss" },
  { label: '仅日期', value: "YYYY-MM-DD" },
  { label: '仅时间', value: "HH:mm:ss" },
  { label: '中文', value: "YYYY年MM月DD日 HH:mm:ss" },
]
