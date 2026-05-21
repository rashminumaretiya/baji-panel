import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { http } from '../../core/http/client.js'
import { selectToken } from '../../store/slices/authSlice.js'
import Table from '../../shared/Table.jsx'

const columns = [
  { key: 'eventId', label: 'Event Id' },
  { key: 'marketId', label: 'Market Id' },
  { key: 'eventType', label: 'Event Type' },
  { key: 'sport', label: 'Sport' },
  { key: 'eventTitle', label: 'Event Title' },
  { key: 'selectionName', label: 'Selection Name' },
  { key: 'complaint', label: 'Complaint' },
]

export default function BetsComplaints() {
  const token = useSelector(selectToken)
  const [complaints, setComplaints] = useState([])

  useEffect(() => {
    if (!token) return
    let cancelled = false
    http
      .get('bet/unsettled-bets-complains', {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        if (!cancelled) setComplaints(res.data?.data ?? [])
      })
    return () => {
      cancelled = true
    }
  }, [token])

  return (
    <div className="inner-outer-wrapper">
      <Table
        title="Bet Complaints"
        columns={columns}
        data={complaints}
        emptyMessage="No data found"
      />
    </div>
  )
}
