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
  if (!socket || !eventIds?.length) return
  socket.emit('subscribe', { eventIds })
}

export function unsubscribeEvents(eventIds) {
  if (!socket || !eventIds?.length) return
  socket.emit('unsubscribe', { eventIds })
}
