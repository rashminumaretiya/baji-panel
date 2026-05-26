import { useEffect, useState } from 'react'
import { Overlay, Popover } from '../shared/components/primitives/Popover.jsx'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import {
  selectIsMcvYellowTheme,
  selectIsYellowTheme,
} from '../store/slices/commonSlice.js'
import {
  loadStakes,
  selectOneClickBetStakes,
  selectStakesData,
  updateStakes,
} from '../store/slices/authSlice.js'
import { setOneClickBetStake } from '../store/slices/betSlipSlice.js'
import { LOCALSTORAGE } from '../shared/types/common.js'
import { localStorageService } from '../shared/services/local-storage.js'
import { alertService, resolveApiMessage } from '../shared/services/alert.js'
import { EditIcon } from './icons.jsx'
import { cx } from '../utils/cx.js'

const STAKE_SLOTS = [1, 2, 3, 4]

function hasSeenOneClickAttention() {
  return !!localStorageService.getItem(LOCALSTORAGE.ONE_CLICK_ATTENTION)
}

export default function OneClickBet() {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const defaultStakes = useSelector(selectOneClickBetStakes)
  const stakesData = useSelector(selectStakesData)
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
    if (!stakesData?.length) dispatch(loadStakes())
  }, [dispatch, stakesData?.length])

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

  const saveOneClickStake = async () => {
    const edited = editStakes ?? defaultStakes
    const first4 = [1, 2, 3, 4].map((slot) => Number(edited[slot]))
    const rest = (stakesData ?? []).slice(4)
    try {
      const action = await dispatch(updateStakes([...first4, ...rest])).unwrap()
      // Show whatever success message the server returned, translated if
      // the i18n bundle has the key.
      const msg = resolveApiMessage(t, action, '')
      if (msg) alertService.success(msg)
    } finally {
      setIsEdit(false)
      setEditStakes(null)
      onStakeClick(activeStakeIndex)
    }
  }

  const toggleEdit = () => {
    setIsEdit(true)
    setEditStakes({ ...defaultStakes })
  }

  // Confirmation "OK" button inside the attention popover. Default = solid dark,
  // yellow-theme overrides with yellow gradient + dark text, mcw with grey
  // gradient + gold text.
  const okBtnBase =
    'block mx-auto w-[46.42857%] p-1.5 rounded-[4px] text-[12px] font-bold btn btn-primary'
  const okBtnYellow =
    'bg-gradient-to-b !from-(--md-primary-yellow) !to-[#ffa10c] !text-(--dark)'
  const okBtnMcw =
    'bg-gradient-to-b !from-[#474747] !to-[#070707] !text-[#ffd354]'

  const attentionPopover = (
    <div className="flex flex-col bg-transparent">
      <div className="px-5 pt-[5px] pb-[7px]">
        <p className="m-0">
          Stake selected will be placed immediately once you click on the market
          odds.
        </p>
        <span className="text-(--md-yellow)">
          Attention: Back/Lay at your own risk
        </span>
      </div>
      <div className="w-full border-t border-white/20 px-2.5 pt-[7px] pb-2.5">
        <button
          type="button"
          className={cx(
            okBtnBase,
            isYellowTheme && okBtnYellow,
            isMcwCasinoTheme && okBtnMcw
          )}
          onClick={popoverClose}
        >
          {t('common.ok', 'OK')}
        </button>
      </div>
    </div>
  )

  // The bottom one-click panel. Wrapper background changes per theme; SCSS had
  // .one-click-wrapper bg gradient, then .yellow-theme/.mcw-casino-theme
  // overrides which used different gradients.
  const wrapperClass = cx(
    'sticky bottom-0 z-[1010] px-2.5 shadow-[inset_0_1px_0_0_var(--shadow-primary)]',
    !isYellowTheme &&
      !isMcwCasinoTheme &&
      'bg-gradient-to-b from-(--xts-primary) to-(--mdx-primary)',
    isYellowTheme && 'bg-gradient-to-b from-[#4e9600] to-[#386a02]',
    isMcwCasinoTheme && 'bg-gradient-to-b from-[#b43807] to-[#912b06]'
  )

  // The 4-slot stake row (the curvy banner background). Default uses the green
  // banner, yellow-theme uses the yellow banner, mcw-casino uses the red one.
  const stakeRowClass = cx(
    'flex items-center justify-center absolute left-1/2 -translate-x-1/2 w-[414px] h-[31px] gap-[3px] bg-no-repeat bg-center',
    !isYellowTheme && !isMcwCasinoTheme && 'bg-[url(/img/main-bg-shape.png)]',
    isYellowTheme && 'bg-[url(/img/stake-1click.png)]',
    isMcwCasinoTheme && 'bg-[url(/img/red-stake-banner.png)]'
  )

  // Stake input — common style, then "active" highlight when not in edit mode.
  // In yellow-theme the active btn uses #ffd200 instead of var(--md-yellow).
  const stakeInputBase =
    'p-0 text-[11px] leading-[18px] h-5 w-[65px] text-center rounded-[4px] border border-(--sm-black) text-black bg-gradient-to-b from-white from-0% to-(--xs-gray) to-[89%] shadow-[inset_0_2px_0_0_rgba(var(--white-rgb),0.5)] hover:bg-gradient-to-b hover:from-(--xs-gray) hover:from-0% hover:to-white hover:to-[89%] focus:bg-(--md-yellow) focus:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none'
  const stakeInputActive = isYellowTheme
    ? 'min-w-[65px] !bg-[#ffd200] !bg-none focus:!bg-[#ffd200]'
    : 'min-w-[65px] !bg-(--md-yellow) !bg-none focus:!bg-(--md-yellow)'

  // Edit / Save button. Default "edit-btn" = transparent w/ white text,
  // "Save" = btn-secondary text white.
  const actionBtnBase =
    'min-w-[70px] py-0.5! px-1 rounded-[4px] text-[11px] font-normal! mr-2 leading-none!'
  const editBtnClass =
    'mt-0 bg-transparent shadow-[inset_0_1px_0_0_rgba(var(--white-rgb),0.5)] border border-black/50 text-white hover:underline'
  const saveBtnClass =
    'min-w-[70px] py-0.5! px-1! rounded-[4px] text-[11px] font-normal! mr-2 btn btn-secondary' // matches .btn-secondary fallback

  return (
    <>
      <div
        className={
          attentionOpen ? 'fixed inset-0 z-9 h-full w-full bg-black/30' : ''
        }
      ></div>
      <div className={wrapperClass}>
        <div ref={setAttentionTarget} />

        <Overlay
          show={attentionOpen}
          target={attentionTarget}
          placement="top"
          rootClose={false}
        >
          <div className="absolute top-full left-1/2 z-1 -translate-x-1/2 -translate-y-6 after:absolute after:-bottom-[10px] after:-left-2 after:h-0 after:w-0 after:border-t-[10px] after:border-r-[10px] after:border-l-[10px] after:border-t-black after:border-r-transparent after:border-l-transparent after:content-['']"></div>
          <Popover className="w-full max-w-[320px] -translate-y-6 overflow-visible! rounded-[10px]! bg-black/85! shadow-[0_0_8px_8px_rgba(var(--white-rgb),0.7)]!">
            <Popover.Header className="bg-transparent px-0 py-[10px]! text-center text-[15px] font-bold text-white">
              {t('header.oneClickBetOn', 'One Click Bet ON')}
            </Popover.Header>
            <Popover.Body className="border-t border-white/30 !p-0 font-[Tahoma] text-[13px] leading-[18px] text-white">
              {attentionPopover}
            </Popover.Body>
          </Popover>
        </Overlay>

        <div>
          <form
            onSubmit={(e) => {
              e.preventDefault()
            }}
          >
            <div className="flex items-center justify-between">
              <h6 className="m-0 text-[12px] leading-[31px] font-bold text-white">
                {t('header.oneClickBet', 'One Click Bet')}{' '}
                {t('header.stake.title', 'Stake')}
              </h6>
              <div className={stakeRowClass}>
                {STAKE_SLOTS.map((slot) => (
                  <div key={slot}>
                    <input
                      type={isEdit ? 'number' : 'button'}
                      className={cx(
                        stakeInputBase,
                        !isEdit && activeStakeIndex === slot && stakeInputActive
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
                  actionBtnBase,
                  isEdit ? saveBtnClass : editBtnClass
                )}
                onClick={isEdit ? saveOneClickStake : toggleEdit}
              >
                {!isEdit ? (
                  <span>
                    {t('common.edit', 'Edit')}{' '}
                    <EditIcon className="inline-flex" />
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
