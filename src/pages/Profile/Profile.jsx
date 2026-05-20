import { EditIcon } from './icons.jsx'
import './profile.scss'

export default function Profile() {
  return (
    <>
      <h3 className="page-title">Account Details</h3>

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
                        <td colSpan="2">Cloud User</td>
                      </tr>
                      <tr>
                        <td>Last Name</td>
                        <td colSpan="2">--</td>
                      </tr>
                      <tr>
                        <td>Birthday</td>
                        <td colSpan="2">--</td>
                      </tr>
                      <tr>
                        <td>E-mail</td>
                        <td colSpan="2">--</td>
                      </tr>
                      <tr>
                        <td>Whatsapp Number</td>
                        <td>0</td>
                        <td>
                          <div className="flex-wrapper justify-content-end pe-2">
                            <span className="cursor-pointer">Add</span>
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
                        <td>+917887712221</td>
                        <td>
                          <div className="flex-wrapper justify-content-end pe-2">
                            <span className="cursor-pointer ms-1">Verify</span>
                            <EditIcon />
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td>Backup Number 1</td>
                        <td>--</td>
                        <td>
                          <div className="flex-wrapper justify-content-end pe-2">
                            <span className="cursor-pointer">Add</span>
                            <EditIcon />
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td>Backup Number 2</td>
                        <td>--</td>
                        <td>
                          <div className="flex-wrapper justify-content-end pe-2">
                            <span className="cursor-pointer">Add</span>
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
                        <td>BDT</td>
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
    </>
  )
}
