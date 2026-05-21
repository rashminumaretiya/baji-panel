import { useCallback, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { http } from '../../core/http/client.js'
import { selectToken } from '../../store/slices/authSlice.js'
import AddBackupNumberModal from './AddBackupNumberModal.jsx'
import AddWhatsAppModal from './AddWhatsAppModal.jsx'
import VerifyPrimaryNumberModal from './VerifyPrimaryNumberModal.jsx'
import { EditIcon } from './icons.jsx'
import './profile.scss'

function formatDate(value) {
  if (!value) return '--'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '--'
  return d.toLocaleDateString()
}

export default function Profile() {
  const token = useSelector(selectToken)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false)
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false)
  const [isVerifyPrimaryModalOpen, setIsVerifyPrimaryModalOpen] = useState(false)

  const fetchUser = useCallback(() => {
    if (!token) return Promise.resolve()
    return http
      .get('user', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        setUser(res.data?.data ?? null)
      })
      .finally(() => setLoading(false))
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
    <>
      <h3 className="page-title">Account Details</h3>

      {loading && <p>Loading...</p>}

      <div className="row mx-0">
        <div className="col-md-6 pe-0 ps-0">
          <div className="row mx-0">
            <div className="col-12 px-0">
              <div className="card-header">About You</div>
              <div className="card">
                <div className="card-body align-items-center">
                  <table>
                    <tbody>
                      <tr>
                        <td>First Name</td>
                        <td colSpan="2">
                          {profile.firstName || profile.userName || '--'}
                        </td>
                      </tr>
                      <tr>
                        <td>Last Name</td>
                        <td colSpan="2">{profile.lastName || '--'}</td>
                      </tr>
                      <tr>
                        <td>Birthday</td>
                        <td colSpan="2">{formatDate(profile.dateOfBirth)}</td>
                      </tr>
                      <tr>
                        <td>E-mail</td>
                        <td colSpan="2">{email.email || '--'}</td>
                      </tr>
                      <tr>
                        <td>Whatsapp Number</td>
                        <td>{whatsappNumber}</td>
                        <td>
                          <div
                            className="flex-wrapper justify-content-end pe-2 cursor-pointer"
                            onClick={() => setIsWhatsAppModalOpen(true)}
                          >
                            <span>
                              {whatsapp.phoneNumber ? 'Edit' : 'Add'}
                            </span>
                            <EditIcon />
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="col-12 px-0 mt-3">
              <div className="card-header">Address</div>
              <div className="card">
                <div className="card-body align-items-center">
                  <table>
                    <tbody>
                      <tr>
                        <td>Address</td>
                        <td colSpan="2">--</td>
                      </tr>
                      <tr>
                        <td>Town/City</td>
                        <td colSpan="2">--</td>
                      </tr>
                      <tr>
                        <td>Country</td>
                        <td colSpan="2">--</td>
                      </tr>
                      <tr>
                        <td>Country/State</td>
                        <td colSpan="2">--</td>
                      </tr>
                      <tr>
                        <td>Postcode</td>
                        <td colSpan="2">--</td>
                      </tr>
                      <tr>
                        <td>Timezone</td>
                        <td colSpan="2">IST</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-6 ps-2 pe-0">
          <div className="row mx-0 inner-row">
            <div className="col-12 px-0">
              <div className="card-header">Contact Details</div>
              <div className="card">
                <div className="card-body align-items-center">
                  <table>
                    <tbody>
                      <tr>
                        <td style={{ minWidth: '115px' }}>Primary Number</td>
                        <td>{primaryNumber}</td>
                        <td>
                          <div
                            className={`flex-wrapper justify-content-end pe-2 ${contact.isVerified ? '' : 'cursor-pointer'}`}
                            onClick={() => {
                              if (!contact.isVerified) setIsVerifyPrimaryModalOpen(true)
                            }}
                          >
                            <span className="ms-1">
                              {contact.isVerified ? 'Verified' : 'Verify'}
                            </span>
                            <EditIcon />
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td>Backup Number 1</td>
                        <td>{backupNumbers[0] || '--'}</td>
                        <td>
                          <div
                            className="flex-wrapper justify-content-end pe-2 cursor-pointer"
                            onClick={() => setIsBackupModalOpen(true)}
                          >
                            <span>
                              {backupNumbers[0] ? 'Edit' : 'Add'}
                            </span>
                            <EditIcon />
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td>Backup Number 2</td>
                        <td>{backupNumbers[1] || '--'}</td>
                        <td>
                          <div
                            className="flex-wrapper justify-content-end pe-2 cursor-pointer"
                            onClick={() => setIsBackupModalOpen(true)}
                          >
                            <span>
                              {backupNumbers[1] ? 'Edit' : 'Add'}
                            </span>
                            <EditIcon />
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="col-12 px-0 mt-3">
              <div className="card-header">Setting</div>
              <div className="card">
                <div className="card-body align-items-center">
                  <table>
                    <tbody>
                      <tr>
                        <td>Currency</td>
                        <td>{user?.currency || '--'}</td>
                      </tr>
                      <tr>
                        <td>Odds Format</td>
                        <td>--</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="col-12 px-0 mt-3">
              <div className="card-header">Commission</div>
              <div className="card">
                <div className="card-body align-items-center">
                  <table>
                    <tbody>
                      <tr>
                        <td style={{ minWidth: '115px' }}>Comm Charged</td>
                        <td>2%</td>
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
    </>
  )
}
