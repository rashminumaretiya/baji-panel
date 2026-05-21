import { io } from 'socket.io-client'
import { environment } from '../../environments/environment.js'

let socket = null
let _onOddsUpdate = null

function ensureSocket() {
  if (socket) return socket
  socket = io(environment.socketUrl, {
    transports: ['websocket'],
    autoConnect: true,
    reconnection: true,
  })
  socket.on('odds_update', (payload) => _onOddsUpdate?.(payload))
  return socket
}

export function bindSocketHandlers({ onOddsUpdate }) {
  _onOddsUpdate = onOddsUpdate
  ensureSocket()
}

export function getSocket() {
  return socket
}

export function subscribeEvents(eventIds) {
  const s = ensureSocket()
  if (!eventIds?.length) return
  s.emit('subscribe', { eventIds })
}

export function unsubscribeEvents(eventIds) {
  if (!socket || !eventIds?.length) return
  socket.emit('unsubscribe', { eventIds })
}

export function emitSocket(eventName, payload) {
  if (!eventName) return
  const s = ensureSocket()
  s.emit(eventName, payload)
}

export function listenSocket(eventName, handler) {
  if (!eventName || typeof handler !== 'function') return () => {}
  const s = ensureSocket()
  s.on(eventName, handler)
  return () => s.off(eventName, handler)
}

export function onReconnect(handler) {
  if (typeof handler !== 'function') return () => {}
  const s = ensureSocket()
  s.on('reconnect', handler)
  return () => s.off('reconnect', handler)
}
