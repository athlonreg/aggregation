import CryptoJS from 'crypto-js'

export function md5(text: string): string {
  return CryptoJS.MD5(text).toString()
}

export function sha1(text: string): string {
  return CryptoJS.SHA1(text).toString()
}

export function sha256(text: string): string {
  return CryptoJS.SHA256(text).toString()
}

export function sha512(text: string): string {
  return CryptoJS.SHA512(text).toString()
}

export function aesEncrypt(text: string, key: string): string {
  return CryptoJS.AES.encrypt(text, key).toString()
}

export function aesDecrypt(cipher: string, key: string): string {
  const bytes = CryptoJS.AES.decrypt(cipher, key)
  return bytes.toString(CryptoJS.enc.Utf8)
}

export function desEncrypt(text: string, key: string): string {
  return CryptoJS.DES.encrypt(text, key).toString()
}

export function desDecrypt(cipher: string, key: string): string {
  const bytes = CryptoJS.DES.decrypt(cipher, key)
  return bytes.toString(CryptoJS.enc.Utf8)
}

export function tripleDesEncrypt(text: string, key: string): string {
  return CryptoJS.TripleDES.encrypt(text, key).toString()
}

export function tripleDesDecrypt(cipher: string, key: string): string {
  const bytes = CryptoJS.TripleDES.decrypt(cipher, key)
  return bytes.toString(CryptoJS.enc.Utf8)
}
