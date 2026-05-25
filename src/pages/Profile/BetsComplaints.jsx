import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { http } from '../../core/http/client.js'
import { selectToken } from '../../store/slices/authSlice.js'
import Table from '../../shared/Table.jsx'

export default function BetsComplaints() {
  const { t } = useTranslation()
  const token = useSelector(selectToken)
  const [complaints, setComplaints] = useState([])

  const columns = useMemo(
    () => [
      { key: 'eventId', label: t('myBets.eventId', 'Event Id') },
      { key: 'marketId', label: t('myBets.marketId', 'Market Id') },
      { key: 'eventType', label: t('myBets.eventType', 'Event Type') },
      { key: 'sport', label: t('myBets.sport', 'Sport') },
      { key: 'eventTitle', label: t('myBets.eventTitle', 'Event Title') },
      { key: 'selectionName', label: t('myBets.selection', 'Selection Name') },
      { key: 'complaint', label: t('myBets.complaint', 'Complaint') },
    ],
    [t]
  )

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
    <div className="max-h-[calc(100svh-240px)] overflow-x-hidden overflow-y-auto">
      <Table
        title={t('common.betsComplaints', 'Bet Complaints')}
        columns={columns}
        data={complaints}
        emptyMessage={t('table.noData.default', 'No Data Found')}
      />
    </div>
  )
}
