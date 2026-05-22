const DIGITS = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖']
const UNITS = ['', '拾', '佰', '仟']
const BIG_UNITS = ['', '万', '亿', '兆']

export function rmbToUpper(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  if (isNaN(num)) throw new Error('无效金额')
  if (num < 0) throw new Error('金额不能为负')
  if (num > 999999999999.99) throw new Error('金额超出范围')

  if (num === 0) return '零元整'

  const [intStr, decStr] = num.toFixed(2).split('.')
  const intPart = parseInt(intStr)
  const jiao = parseInt(decStr[0])
  const fen = parseInt(decStr[1])

  let result = ''

  if (intPart > 0) {
    result = convertInteger(intPart)
    result += '元'
  }

  if (jiao === 0 && fen === 0) {
    result += '整'
  } else {
    if (jiao > 0) {
      result += DIGITS[jiao] + '角'
    } else if (intPart > 0) {
      result += '零'
    }
    if (fen > 0) {
      result += DIGITS[fen] + '分'
    }
  }

  return result
}

function convertInteger(n: number): string {
  if (n === 0) return ''

  const str = String(n)
  let result = ''
  let zeroFlag = false
  const len = str.length

  for (let i = 0; i < len; i++) {
    const digit = parseInt(str[i])
    const pos = len - i - 1
    const unitIdx = pos % 4
    const bigUnitIdx = Math.floor(pos / 4)

    if (digit === 0) {
      zeroFlag = true
      if (unitIdx === 0 && bigUnitIdx > 0) {
        result += BIG_UNITS[bigUnitIdx]
      }
    } else {
      if (zeroFlag) {
        result += '零'
        zeroFlag = false
      }
      result += DIGITS[digit] + UNITS[unitIdx]
      if (unitIdx === 0 && bigUnitIdx > 0) {
        result += BIG_UNITS[bigUnitIdx]
      }
    }
  }

  return result
}

export function rmbToLower(_text: string): number {
  throw new Error('大写转小写功能开发中')
}
