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
      closeOnBackdrop
      closeOnEscape
    >
      {loading ? (
        <p className="text-center text-[13px] text-[#3b5160] m-0">Loading...</p>
      ) : announcements.length === 0 ? (
        <p className="text-center text-[13px] text-[#3b5160] m-0">
          No Annoucements Found.
        </p>
      ) : (
        <ul className="list-none m-0 p-0">
          {announcements.map((a, i) => (
            <li
              key={a._id ?? a.id ?? i}
              className="text-[13px] text-[#1e1e1e] py-2 border-b border-[#e5e5e5] last:border-b-0"
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
