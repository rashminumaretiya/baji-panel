/* eslint-disable react/prop-types */
import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Overlay, Popover } from 'react-bootstrap'
import SvgIcon from './SvgIcon.jsx'
import Stake from './Stake.jsx'
import './sub-header.scss'

const PAGES = [
  { label: 'Home', url: '/highlight' },
  { label: 'In-Play', url: '/in-play' },
  { label: 'Multi Markets', url: '/multi-markets', isHidden: true },
  { label: 'Cricket', url: '/cricket', isCount: true, count: 20 },
  { label: 'Soccer', url: '/soccer', isCount: true, count: 0 },
  { label: 'Tennis', url: '/tennis', isCount: true, count: 4 },
  { label: 'IPL Winner', url: '/ipl-winner' },
  { label: 'Result', url: '/result' },
]

export default function SubHeader({ isAuthenticated = true, isYellowTheme = false }) {
  const [oneClickBet, setOneClickBet] = useState(false)
  const [stakeOpen, setStakeOpen] = useState(false)
  const [stakeTarget, setStakeTarget] = useState(null)

  const openStake = (e) => {
    if (!isAuthenticated) return
    setStakeTarget(e.currentTarget)
    setStakeOpen(true)
  }

  return (
    <div className="sub-header">
      <div className="d-flex align-items-center tabs-header">
        <ul>
          {PAGES.filter((p) => !p.isHidden).map((page) => (
            <li key={page.url}>
              <NavLink
                to={page.url}
                end={page.url === '/highlight'}
                className={({ isActive }) => (isActive ? 'active' : '')}
              >
                {page.label}
                {page.isCount && isAuthenticated && (
                  <div className="live-chip">
                    <div className="icon-out" />
                    <p className="number">{page.count}</p>
                  </div>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
        <div className="right-inner-header">
          {!isYellowTheme && (
            <div className="time-zone">
              <span>Timezone: </span>
              <p className="mb-0 ms-1">GMT+5:30</p>
            </div>
          )}
          <div className={`bet-check${oneClickBet ? ' bet-check-active' : ''}`}>
            <div className="form-check">
              <input
                id="oneClickBet"
                type="checkbox"
                className="form-check-input cursor-pointer"
                checked={oneClickBet}
                onChange={(e) => setOneClickBet(e.target.checked)}
              />
              <label htmlFor="oneClickBet" className="form-check-label cursor-pointer">
                One Click Bet
              </label>
            </div>
          </div>
          <div
            className="setting d-inline-flex align-items-center cursor-pointer"
            onClick={openStake}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && openStake(e)}
          >
            <p className="mb-0">Settings</p>
            <SvgIcon name="settingIcon" />
          </div>
        </div>
      </div>

      <Overlay
        show={stakeOpen}
        target={stakeTarget}
        placement="bottom-end"
        rootClose
        onHide={() => setStakeOpen(false)}
      >
        <Popover className="stake-popup-container">
          <Popover.Body className="p-0">
            <Stake onCancel={() => setStakeOpen(false)} />
          </Popover.Body>
        </Popover>
      </Overlay>
    </div>
  )
}
