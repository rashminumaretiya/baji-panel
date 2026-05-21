import { useState } from 'react'
import { useSelector } from 'react-redux'
import {
  selectIsMcvYellowTheme,
  selectIsYellowTheme,
} from '../store/slices/commonSlice.js'
import SvgIcon from './SvgIcon.jsx'
import './Stake.scss'

const QUICK_STAKE_SLOTS = [1, 2, 3, 4, 5, 6, 7, 8]

function cx(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function Stake({
  isMobile = false,
  onCancel,
  isYellowTheme: isYellowThemeProp,
  isMcwCasinoTheme: isMcwCasinoThemeProp,
}) {
  const isYellowThemeFromStore = useSelector(selectIsYellowTheme)
  const isMcwCasinoThemeFromStore = useSelector(selectIsMcvYellowTheme)
  const isYellowTheme = isYellowThemeProp ?? isYellowThemeFromStore
  const isMcwCasinoTheme = isMcwCasinoThemeProp ?? isMcwCasinoThemeFromStore

  const [defaultStake, setDefaultStake] = useState(0)
  const [availableStake, setAvailableStake] = useState(
    Object.fromEntries(QUICK_STAKE_SLOTS.map((n) => [n, '']))
  )
  const [isHighlighted, setIsHighlighted] = useState(false)
  const [fancyBetAcceptAnyOdds, setFancyBetAcceptAnyOdds] = useState(false)
  const [isStakeEditable, setIsStakeEditable] = useState(false)

  const stakesLocked = !isStakeEditable

  const wrapperClass = cx(
    'stake-body-wrapper',
    isYellowTheme && 'yellow-theme',
    isMcwCasinoTheme && 'mcw-casino-theme'
  )

  const mobileHeaderClass = cx(
    'stake-mobile-header',
    isYellowTheme && 'yellow-theme',
    isMcwCasinoTheme && 'mcw-casino-theme'
  )

  const toggleStakeEdit = () => setIsStakeEditable((prev) => !prev)

  const updateQuickStake = (slot, value) => {
    setAvailableStake((prev) => ({ ...prev, [slot]: value }))
  }

  return (
    <div className={wrapperClass}>
      <div className="stake-popup">
        <form
          onSubmit={(e) => {
            e.preventDefault()
          }}
        >
          {isMobile ? (
            <>
              <div className={mobileHeaderClass}>
                <div className="d-flex align-items-center setting">
                  <SvgIcon name="settingIcon" />
                  <span>Setting</span>
                </div>
                <SvgIcon
                  name="closePopover"
                  className="close"
                  role="button"
                  tabIndex={0}
                  onClick={onCancel}
                  onKeyDown={(e) => e.key === 'Enter' && onCancel?.()}
                />
              </div>
              <h3 className="blue-header mb-0">Stake</h3>
            </>
          ) : (
            <h6 className="d-block d-md-none card-header">Stake</h6>
          )}

          <div className="stake-section-wrapper">
            <div className="d-flex align-items-center stake-title">
              <label htmlFor="stake-default">Default Stake</label>
              <input
                id="stake-default"
                type="number"
                className="form-control"
                min={0}
                value={defaultStake}
                onChange={(e) => setDefaultStake(e.target.value)}
              />
            </div>
          </div>

          <div className="stake-body">
            <div className="stake-section-wrapper">
              <div className="quick-stake">
                <h6
                  className={cx('d-block d-md-none title', isMobile && 'odds')}
                >
                  Quick Stakes
                </h6>
                <h6 className="d-md-block d-none title">Stake</h6>
                <div className="d-block d-md-flex">
                  <div>
                    <div className="number-box-main">
                      {QUICK_STAKE_SLOTS.map((slot) => (
                        <div key={slot} className="number-box">
                          <input
                            type="text"
                            className="form-control"
                            value={availableStake[slot]}
                            disabled={stakesLocked}
                            onChange={(e) =>
                              updateQuickStake(slot, e.target.value)
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                  <button
                    type="button"
                    className={cx('btn edit-btn', !stakesLocked && 'ok-btn')}
                    onClick={toggleStakeEdit}
                  >
                    {stakesLocked ? (
                      <>
                        <span>Edit</span>
                        <div className="edit-icon" />
                      </>
                    ) : (
                      'OK'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="custom-switch stake-section-wrapper">
            <h6 className="title">Odds</h6>
            <div className="d-flex align-items-center justify-content-between justify-content-md-start mb-md-2 reverse">
              {isMobile ? (
                <>
                  <label className="m-0 ms-1 switch" htmlFor="highlight">
                    <input
                      type="checkbox"
                      id="highlight"
                      checked={isHighlighted}
                      onChange={(e) => setIsHighlighted(e.target.checked)}
                    />
                    <span className="slider" />
                  </label>
                  <span>Highlight when odds change</span>
                </>
              ) : (
                <>
                  <input
                    type="checkbox"
                    id="highlight"
                    checked={isHighlighted}
                    onChange={(e) => setIsHighlighted(e.target.checked)}
                  />
                  <label className="m-0 ms-1" htmlFor="highlight">
                    Highlight when odds change
                  </label>
                </>
              )}
            </div>
          </div>

          <div className="custom-switch stake-section-wrapper">
            <h6 className="title">Fancy Bet</h6>
            <div className="d-flex align-items-center justify-content-between justify-content-md-start mb-md-2 reverse">
              {isMobile ? (
                <>
                  <label className="m-0 ms-1 switch" htmlFor="fancyBet">
                    <input
                      type="checkbox"
                      id="fancyBet"
                      checked={fancyBetAcceptAnyOdds}
                      onChange={(e) =>
                        setFancyBetAcceptAnyOdds(e.target.checked)
                      }
                    />
                    <span className="slider" />
                  </label>
                  <span className="m-0 ms-1">Accept Any Odds</span>
                </>
              ) : (
                <>
                  <input
                    type="checkbox"
                    id="fancyBet"
                    checked={fancyBetAcceptAnyOdds}
                    onChange={(e) => setFancyBetAcceptAnyOdds(e.target.checked)}
                  />
                  <label className="m-0 ms-1" htmlFor="fancyBet">
                    Accept Any Odds
                  </label>
                </>
              )}
            </div>
          </div>

          <div className="custom-switch stake-section-wrapper">
            <h6 className="title">Sportsbook</h6>
            <div className="d-flex align-items-center justify-content-between justify-content-md-start mb-md-2 reverse" />
          </div>

          <div className="custom-switch stake-section-wrapper">
            <h6 className="title">Win Selection Forecast</h6>
            <div className="d-flex align-items-center justify-content-between justify-content-md-start mb-md-2 reverse" />
          </div>

          <div className="d-flex justify-content-center gap-md-0 stake-footer">
            <div className="btn-wrapper">
              <button
                type="button"
                className="btn btn-white me-md-2"
                onClick={onCancel}
                disabled={!stakesLocked}
              >
                Cancel
              </button>
            </div>
            <div className="btn-wrapper text-end">
              <button
                type="button"
                className="btn btn-primary"
                disabled={!stakesLocked}
              >
                Save
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
