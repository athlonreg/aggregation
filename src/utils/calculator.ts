export type Base = 2 | 8 | 10 | 16

export function convertBase(value: string, fromBase: Base, toBase: Base): string {
  const num = parseInt(value, fromBase)
  if (isNaN(num)) throw new Error('无效输入')
  return num.toString(toBase).toUpperCase()
}

export function calculate(a: string, op: string, b: string, base: Base): string {
  const na = parseInt(a, base)
  const nb = parseInt(b, base)
  if (isNaN(na) || isNaN(nb)) throw new Error('无效输入')

  let result: number
  switch (op) {
    case '+': result = na + nb; break
    case '-': result = na - nb; break
    case '*': result = na * nb; break
    case '/':
      if (nb === 0) throw new Error('除数不能为零')
      result = Math.trunc(na / nb)
      break
    case '%':
      if (nb === 0) throw new Error('除数不能为零')
      result = na % nb
      break
    default: throw new Error('不支持的运算符')
  }
  return result.toString(base).toUpperCase()
}
