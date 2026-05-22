// Fancy "Book" modal — shows the per-selection / per-run P/L breakdown for a
// fancy market where the user already has placed bets. Mounted only while a
// fancy "Book" button is active, so each open is a fresh instance and the
// previous selection's data never leaks across openings.
//
// Endpoint mirrors sbex-user-fe's Exposure service:
//   GET bet/fancy-post-exposure/${eventId}/${selectionId}
// Response shape:
//   { selectionId, gtype, exposure, selectionName, selections: [{ name, exposure }] }
//
// Visual styling mirrors baji-exchange-frontend's `.book-fancy` component:
//   - Dark navy table header with yellow column labels
//   - Light-blue rows for profit (>= 0), light-pink for liability (< 0)
//   - Signed decimal format (e.g. `1.00`, `-1.00`) — not parenthesised
//   - Full-width white/grey-gradient OK button

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Modal from '../../shared/components/Modal.jsx'
import Loader from '../../shared/components/Loader.jsx'
import { http } from '../../core/http/client.js'

const numberFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  signDisplay: 'auto',
})

export default function BookFancyModal({
  eventId,
  selectionId,
  runnerName,
  onClose,
}) {
  const { t } = useTranslation()
  const [data, setData] = useState(null)
  // Fresh instance per open ⇒ start in the loading state directly so the
  // first paint shows the spinner (no empty-table flash).
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!eventId || !selectionId) return undefined
    let cancelled = false
    http
      .get(`bet/fancy-post-exposure/${eventId}/${selectionId}`)
      .then((res) => {
        if (cancelled) return
        setData(res?.data?.data ?? null)
      })
      .catch(() => {
        if (cancelled) return
        setData(null)
      })
      .finally(() => {
        if (cancelled) return
        setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [eventId, selectionId])

  const title = data?.selectionName || runnerName || ''
  const selections = Array.isArray(data?.selections) ? data.selections : []
  const isOddEven = data?.gtype === 'ODD_EVEN'

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={title}
      size="md"
      closeOnEscape
      closeOnBackdrop
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-6">
          <Loader show message="common.loader.loading" fallback="Loading..." />
        </div>
      ) : (
        <table className="mx-auto text-[14px] leading-[1.3] max-md:text-[3.46vw]">
          <thead>
            <tr>
              {[
                t('markets.runs', 'Runs'),
                t('markets.position', 'Position'),
              ].map((label) => (
                <th
                  key={label}
                  className="w-[271px] h-8 text-center font-semibold bg-[rgb(34,34,34)] border border-[rgb(34,34,34)] text-[rgb(255,184,12)] max-md:h-[11vw]"
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {selections.length === 0 && (
              <tr>
                <td
                  colSpan={2}
                  className="h-8 text-center border border-black bg-white font-semibold max-md:h-[11vw]"
                >
                  {t('common.noData', 'No data')}
                </td>
              </tr>
            )}
            {selections.map((item, idx) => {
              const exp = Number(item?.exposure) || 0
              const rowBg =
                exp >= 0
                  ? 'bg-[rgb(189,218,238)]'
                  : 'bg-[rgba(250,170,186,0.51)]'
              const name = isOddEven
                ? item?.name === 'Yes'
                  ? t('markets.even', 'Even')
                  : t('markets.odd', 'Odd')
                : (item?.name ?? '')
              return (
                <tr key={`${name}-${idx}`} className={rowBg}>
                  <td className="h-8 text-center border border-black font-semibold max-md:h-[11vw]">
                    {name}
                  </td>
                  <td className="h-8 text-center border border-black font-semibold max-md:h-[11vw]">
                    {numberFormatter.format(exp)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
      <div className="p-[10px] max-md:p-[1.86vw]">
        <button
          type="button"
          className="w-full px-[10px] py-[4px] rounded-[4px] border border-[#aaa] bg-[linear-gradient(-180deg,#fff_0%,#eee_89%)] text-[14px] font-bold leading-[1.6] text-[#1e1e1e] cursor-pointer hover:opacity-90 max-md:rounded-[1.6vw] max-md:text-[4vw] max-md:leading-[2.6] max-md:p-0"
          onClick={onClose}
        >
          {t('common.ok', 'OK')}
        </button>
      </div>
    </Modal>
  )
}
