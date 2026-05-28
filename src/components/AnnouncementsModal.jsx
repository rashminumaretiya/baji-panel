import { useEffect, useState } from 'react'
import { http } from '../core/http/client.js'
import Modal from '../shared/components/Modal.jsx'

export default function AnnouncementsModal({ isOpen, onClose }) {
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    let cancelled = false
    setLoading(true)
    http
      .get('broadcast-message/list')
      .then((res) => {
        if (cancelled) return
        const d = res.data?.data
        const list = Array.isArray(d) ? d : Array.isArray(d?.data) ? d.data : []
        setAnnouncements(list)
      })
      .catch(() => {
        if (!cancelled) setAnnouncements([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [isOpen])

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Announcements"
      size="md"
    >
      {loading ? (
        <p className="m-0 text-center text-[13px] text-[#3b5160]">Loading...</p>
      ) : announcements.length === 0 ? (
        <p className="m-0 text-center text-[13px] text-[#3b5160]">
          No Annoucements Found.
        </p>
      ) : (
        <ul className="m-0 list-none p-0">
          {announcements.map((a, i) => (
            <li
              key={a._id ?? a.id ?? i}
              className="border-b border-[#e5e5e5] py-2 text-[13px] text-[#1e1e1e] last:border-b-0"
              dangerouslySetInnerHTML={{
                __html: a.message ?? a.text ?? a.title ?? '',
              }}
            />
          ))}
        </ul>
      )}
    </Modal>
  )
}
