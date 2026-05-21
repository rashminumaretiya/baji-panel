import { useEffect, useRef } from 'react'
import { subscribeEvents, unsubscribeEvents } from '../core/socket/client.js'

export function useEventSubscription(eventIds) {
  const prevRef = useRef(new Set())
  const idsKey = (eventIds ?? []).slice().sort().join(',')

  useEffect(() => {
    const next = new Set(eventIds ?? [])
    const prev = prevRef.current

    const toAdd = [...next].filter((id) => !prev.has(id))
    const toRemove = [...prev].filter((id) => !next.has(id))

    if (toAdd.length) subscribeEvents(toAdd)
    if (toRemove.length) unsubscribeEvents(toRemove)

    prevRef.current = next
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey])

  useEffect(() => () => {
    if (prevRef.current.size) unsubscribeEvents([...prevRef.current])
    prevRef.current = new Set()
  }, [])
}
