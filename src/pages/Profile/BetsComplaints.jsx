import { useState } from 'react'
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
  const [complaints] = useState([])

  return (
    <div className="inner-outer-wrapper">
      <Table title="Bet Complaints" columns={columns} data={complaints} />
    </div>
  )
}
