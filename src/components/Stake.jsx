import SvgIcon from './SvgIcon.jsx'

const STAKE_KEYS = ['stake1', 'stake2', 'stake3', 'stake4', 'stake5', 'stake6']

export default function Stake({ onCancel, isMobile = false }) {
  return (
    <div className="stake-body-wrapper">
      {isMobile && (
        <div className="page-head">
          <p>
            <SvgIcon name="settingIcon" />
            Settings
          </p>
          <span role="button" tabIndex={0} onClick={onCancel} onKeyDown={(e) => e.key === 'Enter' && onCancel()}>
            <SvgIcon name="cross" />
          </span>
        </div>
      )}
      <div className="stake-popup">
        <form onSubmit={(e) => e.preventDefault()}>
          <h6 className="card-header d-block d-md-none">Stake Settings</h6>
          <div className="stake-body pb-1">
            <div className="quick-stake">
              <h6 className="title d-md-none d-block">Quick Stakes</h6>
              <h6 className="title d-none d-md-block">Stake Settings</h6>
              <div className="d-block d-md-flex">
                <div>
                  <div className="number-box-main">
                    {STAKE_KEYS.map((key) => (
                      <div key={key} className="number-box">
                        <input type="text" className="form-control" defaultValue="" readOnly />
                      </div>
                    ))}
                  </div>
                </div>
                <button type="button" className="btn btn-secondary edit-btn">
                  Edit
                </button>
              </div>
            </div>
          </div>
          <div className="stake-footer d-flex justify-content-center">
            <button type="button" className="btn btn-cancel me-2" onClick={onCancel}>
              Cancel
            </button>
            <button type="button" className="btn btn-save" disabled>
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
