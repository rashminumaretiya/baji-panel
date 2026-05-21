import { useEffect, useState } from 'react'
import { Overlay, Popover } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import {
  selectIsMcvYellowTheme,
  selectIsYellowTheme,
} from '../store/slices/commonSlice.js'
import { selectOneClickBetStakes } from '../store/slices/authSlice.js'
import { setOneClickBetStake } from '../store/slices/betSlipSlice.js'
import { LOCALSTORAGE } from '../shared/types/common.js'
import { localStorageService } from '../shared/services/local-storage.js'
import SvgIcon from './SvgIcon.jsx'
import './oneClickBet.scss'

const STAKE_SLOTS = [1, 2, 3, 4]

function cx(...classes) {
  return classes.filter(Boolean).join(' ')
}

function hasSeenOneClickAttention() {
  return !!localStorageService.getItem(LOCALSTORAGE.ONE_CLICK_ATTENTION)
}

export default function OneClickBet() {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const defaultStakes = useSelector(selectOneClickBetStakes)
  const isYellowTheme = useSelector(selectIsYellowTheme)
  const isMcwCasinoTheme = useSelector(selectIsMcvYellowTheme)

  const [attentionTarget, setAttentionTarget] = useState(null)
  const [attentionOpen, setAttentionOpen] = useState(
    () => !hasSeenOneClickAttention()
  )
  const [stakesDisabled, setStakesDisabled] = useState(
    () => !hasSeenOneClickAttention()
  )
  const [isEdit, setIsEdit] = useState(false)
  const [activeStakeIndex, setActiveStakeIndex] = useState(4)
  const [editStakes, setEditStakes] = useState(null)

  const stakes = isEdit && editStakes ? editStakes : defaultStakes

  useEffect(() => {
    dispatch(setOneClickBetStake(defaultStakes[activeStakeIndex]))
  }, [activeStakeIndex, defaultStakes, dispatch])

  const popoverClose = () => {
    localStorageService.setItem(LOCALSTORAGE.ONE_CLICK_ATTENTION, 1)
    setStakesDisabled(false)
    setAttentionOpen(false)
  }

  const onStakeClick = (index) => {
    setActiveStakeIndex(index)
    dispatch(setOneClickBetStake(stakes[index]))
  }

  const updateStake = (index, value) => {
    setEditStakes((prev) => ({ ...(prev ?? defaultStakes), [index]: value }))
  }

  const saveOneClickStake = () => {
    setIsEdit(false)
    setEditStakes(null)
    onStakeClick(activeStakeIndex)
  }

  const toggleEdit = () => {
    setIsEdit(true)
    setEditStakes({ ...defaultStakes })
  }

  const attentionPopover = (
    <div className="d-flex flex-column one-click-attention">
      <div className="content">
        <p className="m-0">
          Stake selected will be placed immediately once you click on the market
          odds.
        </p>
        <span>Attention: Back/Lay at your own risk</span>
      </div>
      <div className="btn-wrapper">
        <button
          type="button"
          className={cx(
            'btn btn-primary',
            isYellowTheme && 'yellow-btn',
            isMcwCasinoTheme && 'mcw-btn'
          )}
          onClick={popoverClose}
        >
          {t('common.ok', 'OK')}
        </button>
      </div>
    </div>
  )

  return (
    <>
      <div className={attentionOpen ? 'overlay' : ''}> </div>
      <div
        className={cx(
          'position-sticky bottom-0 one-click-wrapper',
          isYellowTheme && 'yellow-theme',
          isMcwCasinoTheme && 'mcw-casino-theme'
        )}
      >
        <div ref={setAttentionTarget} />

        <Overlay
          show={attentionOpen}
          target={attentionTarget}
          placement="top"
          rootClose={false}
        >
          <Popover className="attention-popover">
            <Popover.Header as="h3" className="popover-header">
              {t('header.oneClickBetOn', 'One Click Bet ON')}
            </Popover.Header>
            <Popover.Body>{attentionPopover}</Popover.Body>
          </Popover>
        </Overlay>

        <div>
          <form
            onSubmit={(e) => {
              e.preventDefault()
            }}
          >
            <div className="d-flex align-items-center justify-content-between">
              <h6 className="m-0 text-white">
                {t('header.oneClickBet', 'One Click Bet')}{' '}
                {t('header.stake.title', 'Stake')}
              </h6>
              <div
                className={cx(
                  'd-flex align-items-center justify-content-center one-click-stake',
                  isYellowTheme && 'yellow-label'
                )}
              >
                {STAKE_SLOTS.map((slot) => (
                  <div key={slot} className="btns">
                    <input
                      type={isEdit ? 'number' : 'button'}
                      className={cx(
                        'form-control text-center',
                        !isEdit && activeStakeIndex === slot && 'btn btn-yellow'
                      )}
                      value={stakes[slot]}
                      disabled={stakesDisabled}
                      onChange={(e) =>
                        isEdit && updateStake(slot, e.target.value)
                      }
                      onClick={() => !isEdit && onStakeClick(slot)}
                    />
                  </div>
                ))}
              </div>
              <button
                type="button"
                disabled={attentionOpen}
                className={cx(
                  'btn me-2',
                  isEdit ? 'btn-secondary' : 'edit-btn'
                )}
                onClick={isEdit ? saveOneClickStake : toggleEdit}
              >
                {!isEdit ? (
                  <span>
                    {t('common.edit', 'Edit')} <SvgIcon name="editIcon" />
                  </span>
                ) : (
                  <p className="m-0">{t('common.save', 'Save')}</p>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
