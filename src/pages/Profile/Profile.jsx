import { useCallback, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { http } from '../../core/http/client.js'
import { useIsMobile } from '../../hooks/useMediaQuery.js'
import { selectToken } from '../../store/slices/authSlice.js'
import AddBackupNumberModal from './AddBackupNumberModal.jsx'
import AddWhatsAppModal from './AddWhatsAppModal.jsx'
import VerifyPrimaryNumberModal from './VerifyPrimaryNumberModal.jsx'
import { EditIcon } from './icons.jsx'

function formatDate(value) {
  if (!value) return '--'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '--'
  return d.toLocaleDateString()
}

// Tailwind-only port of profile.scss. Rebuilds the 2-column Bootstrap grid
// (col-md-6) with flex on >=768 and stacks on mobile.
const cardHeaderClass =
  'bg-[var(--text-color)] border-b border-[var(--sm-text-color)] text-white leading-6 font-bold px-2.5 mb-0 text-[12px]'

const tableClass = 'w-full border-collapse'

// Row + last-row border colours match the original .profile-container table tr
// rules. Last-of-type uses #7e97a7 (var(--sm-text-color)).
const trClass =
  'bg-white border-b border-[var(--xs-lightGray)] last:border-b-[#7e97a7]'

// Padding/font/line-height ported from .profile-container table td.
// SCSS: `padding: 7px; font-size: 11px; line-height: 16px; vertical-align: top;`
const tdLabelClass =
  'p-[7px] text-[11px] leading-4 align-top w-[22%] min-w-[115px] max-mobile:min-w-[80px]'
const tdValueClass = 'p-[7px] text-[11px] leading-4 align-top'

function ActionCell({ children, onClick }) {
  return (
    <td className={tdValueClass}>
      <div
        className="flex items-center justify-end cursor-pointer gap-1"
        onClick={onClick}
      >
        {children}
      </div>
    </td>
  )
}

export default function Profile() {
  const token = useSelector(selectToken)
  const isMobile = useIsMobile()
  const [user, setUser] = useState(null)
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false)
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false)
  const [isVerifyPrimaryModalOpen, setIsVerifyPrimaryModalOpen] =
    useState(false)

  const fetchUser = useCallback(() => {
    if (!token) return Promise.resolve()
    return http
      .get('user', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        setUser(res.data?.data ?? null)
      })
  }, [token])

  const openVerifyPrimaryModal = useCallback(async () => {
    if (!token) return
    try {
      await http.post(
        'user/send-otp-primary-number',
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setIsVerifyPrimaryModalOpen(true)
    } catch {
      // send-otp failed (e.g. 400) — keep modal closed; error toast handled by interceptor.
    }
  }, [token])

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  const profile = user?.profileDetails || {}
  const contact = user?.contactInfo || {}
  const whatsapp = user?.whatsappInfo || {}
  const email = user?.emailInfo || {}
  const backupNumbers = user?.backupMobileAccounts?.numbers || []

  const primaryNumber = contact.phoneNumber
    ? `${contact.countryCode || ''}${contact.phoneNumber}`
    : '--'
  const whatsappNumber = whatsapp.phoneNumber
    ? `${whatsapp.countryCode || ''}${whatsapp.phoneNumber}`
    : '0'

  return (
    <div>
      <h3 className="text-[#1e1e1e] font-bold text-[13px] leading-5 pt-1.5 mb-1.5">
        Account Details
      </h3>

      <div className="flex flex-wrap mx-0">
        {/* Left column (col-md-6) */}
        <div className="w-full md:w-1/2 px-0">
          <div className="flex flex-wrap mx-0">
            <div className="w-full px-0">
              <div className={cardHeaderClass}>About You</div>
              <div>
                <div className="bg-white p-0 flex items-center">
                  <table className={tableClass}>
                    <tbody>
                      <tr className={trClass}>
                        <td className={tdLabelClass}>First Name</td>
                        <td className={tdValueClass} colSpan="2">
                          {profile.firstName || profile.userName || '--'}
                        </td>
                      </tr>
                      <tr className={trClass}>
                        <td className={tdLabelClass}>Last Name</td>
                        <td className={tdValueClass} colSpan="2">
                          {profile.lastName || '--'}
                        </td>
                      </tr>
                      <tr className={trClass}>
                        <td className={tdLabelClass}>Birthday</td>
                        <td className={tdValueClass} colSpan="2">
                          {formatDate(profile.dateOfBirth)}
                        </td>
                      </tr>
                      <tr className={trClass}>
                        <td className={tdLabelClass}>E-mail</td>
                        <td className={tdValueClass} colSpan="2">
                          {email.email || '--'}
                        </td>
                      </tr>
                      <tr className={trClass}>
                        <td className={tdLabelClass}>Whatsapp Number</td>
                        <td className={tdValueClass}>{whatsappNumber}</td>
                        <ActionCell
                          onClick={() => setIsWhatsAppModalOpen(true)}
                        >
                          <span className="cursor-pointer">
                            {whatsapp.phoneNumber ? 'Edit ' : 'Add '}
                          </span>
                          <EditIcon />
                        </ActionCell>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="w-full px-0 mt-3">
              <div className={cardHeaderClass}>Address</div>
              <div>
                <div className="bg-white p-0 flex items-center">
                  <table className={tableClass}>
                    <tbody>
                      <tr className={trClass}>
                        <td className={tdLabelClass}>Address</td>
                        <td className={tdValueClass} colSpan="2">
                          --
                        </td>
                      </tr>
                      <tr className={trClass}>
                        <td className={tdLabelClass}>Town/City</td>
                        <td className={tdValueClass} colSpan="2">
                          --
                        </td>
                      </tr>
                      <tr className={trClass}>
                        <td className={tdLabelClass}>Country</td>
                        <td className={tdValueClass} colSpan="2">
                          --
                        </td>
                      </tr>
                      <tr className={trClass}>
                        <td className={tdLabelClass}>Country/State</td>
                        <td className={tdValueClass} colSpan="2">
                          --
                        </td>
                      </tr>
                      <tr className={trClass}>
                        <td className={tdLabelClass}>Postcode</td>
                        <td className={tdValueClass} colSpan="2">
                          --
                        </td>
                      </tr>
                      <tr className={trClass}>
                        <td className={tdLabelClass}>Timezone</td>
                        <td className={tdValueClass} colSpan="2">
                          IST
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right column (col-md-6) */}
        <div className="w-full md:w-1/2 md:pl-2 px-0">
          <div
            className={`flex flex-wrap mx-0 ${isMobile ? 'p-0' : 'pl-3'}`}
          >
            <div className="w-full px-0">
              <div className={cardHeaderClass}>Contact Details</div>
              <div>
                <div className="bg-white p-0 flex items-center">
                  <table className={tableClass}>
                    <tbody>
                      <tr className={trClass}>
                        <td className={tdLabelClass}>Primary Number</td>
                        <td className={tdValueClass}>{primaryNumber}</td>
                        <ActionCell onClick={openVerifyPrimaryModal}>
                          <span className="cursor-pointer ml-1">Verify </span>
                          <EditIcon />
                        </ActionCell>
                      </tr>
                      <tr className={trClass}>
                        <td className={tdLabelClass}>Backup Number 1</td>
                        <td className={tdValueClass}>
                          {backupNumbers[0] || '--'}
                        </td>
                        <ActionCell
                          onClick={() => setIsBackupModalOpen(true)}
                        >
                          <span className="cursor-pointer">
                            {backupNumbers[0] ? 'Edit ' : 'Add '}
                          </span>
                          <EditIcon />
                        </ActionCell>
                      </tr>
                      <tr className={trClass}>
                        <td className={tdLabelClass}>Backup Number 2</td>
                        <td className={tdValueClass}>
                          {backupNumbers[1] || '--'}
                        </td>
                        <ActionCell
                          onClick={() => setIsBackupModalOpen(true)}
                        >
                          <span className="cursor-pointer">
                            {backupNumbers[1] ? 'Edit ' : 'Add '}
                          </span>
                          <EditIcon />
                        </ActionCell>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="w-full px-0 mt-3">
              <div className={cardHeaderClass}>Setting</div>
              <div>
                <div className="bg-white p-0 flex items-center">
                  <table className={tableClass}>
                    <tbody>
                      <tr className={trClass}>
                        <td className={tdLabelClass}>Currency</td>
                        <td className={tdValueClass}>
                          {user?.currency || '--'}
                        </td>
                      </tr>
                      <tr className={trClass}>
                        <td className={tdLabelClass}>Odds Format</td>
                        <td className={tdValueClass}>--</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="w-full px-0 mt-3">
              <div className={cardHeaderClass}>Commission</div>
              <div>
                <div className="bg-white p-0 flex items-center">
                  <table className={tableClass}>
                    <tbody>
                      <tr className={trClass}>
                        <td className={tdLabelClass}>Comm Charged</td>
                        <td className={tdValueClass}>2%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AddWhatsAppModal
        isOpen={isWhatsAppModalOpen}
        onClose={() => setIsWhatsAppModalOpen(false)}
        onSuccess={fetchUser}
      />
      <AddBackupNumberModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        onSuccess={fetchUser}
      />
      <VerifyPrimaryNumberModal
        isOpen={isVerifyPrimaryModalOpen}
        onClose={() => setIsVerifyPrimaryModalOpen(false)}
        onSuccess={fetchUser}
      />
    </div>
  )
}
