export function base64Encode(text: string): string {
  return btoa(unescape(encodeURIComponent(text)))
}

export function base64Decode(text: string): string {
  return decodeURIComponent(escape(atob(text)))
}

export function hexEncode(text: string): string {
  return Array.from(new TextEncoder().encode(text))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

export function hexDecode(hex: string): string {
  const bytes = new Uint8Array(hex.match(/.{1,2}/g)!.map(b => parseInt(b, 16)))
  return new TextDecoder().decode(bytes)
}

export function unicodeEncode(text: string): string {
  return Array.from(text)
    .map(c => `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`)
    .join('')
}

export function unicodeDecode(text: string): string {
  return text.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) =>
    String.fromCharCode(parseInt(hex, 16))
  )
}
