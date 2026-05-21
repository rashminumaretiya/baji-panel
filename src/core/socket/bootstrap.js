import { store } from '../../store/store.js'
import { mergeOddsUpdate } from '../../store/slices/sportSlice.js'
import { bindSocketHandlers } from './client.js'

export function bootstrapSocket() {
  bindSocketHandlers({
    onOddsUpdate: (payload) => store.dispatch(mergeOddsUpdate(payload)),
  })
}
