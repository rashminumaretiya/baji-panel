// Ported from sbex-user-fe/src/app/shared/services/local-storage.ts
import CryptoJS from 'crypto-js'
import { environment } from '../../environments/environment.js'

function encryptKey(key) {
  return CryptoJS.AES.encrypt(
    JSON.stringify(key),
    CryptoJS.enc.Utf8.parse(environment.cryptoSecret),
    { mode: CryptoJS.mode.ECB },
  ).toString()
}

function encryptValue(value) {
  return CryptoJS.AES.encrypt(
    JSON.stringify(value),
    CryptoJS.enc.Utf8.parse(environment.cryptoSecret),
    { mode: CryptoJS.mode.ECB },
  ).toString()
}

function decryptValue(value) {
  try {
    const bytes = CryptoJS.AES.decrypt(
      value,
      CryptoJS.enc.Utf8.parse(environment.cryptoSecret),
      { mode: CryptoJS.mode.ECB },
    )
    return JSON.parse(bytes.toString(CryptoJS.enc.Utf8))
  } catch {
    return null
  }
}

export function setItem(key, data) {
  localStorage.setItem(encryptKey(key), encryptValue(data))
}

export function getItem(key) {
  const raw = localStorage.getItem(encryptKey(key))
  return raw === null ? null : decryptValue(raw)
}

export function removeItem(key) {
  localStorage.removeItem(encryptKey(key))
}

export function encryptPayload(data) {
  const str = typeof data === 'string' ? data : JSON.stringify(data ?? {})
  return CryptoJS.AES.encrypt(str, environment.cryptoSecretforPayload).toString()
}

export const localStorageService = {
  setItem,
  getItem,
  removeItem,
  encryptPayload,
}
