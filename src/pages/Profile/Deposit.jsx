import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  fetchDepositPaymentMethods,
  fetchPromotion,
  resetDepositSubmit,
  selectDepositPaymentMethods,
  selectDepositSubmit,
  selectPromotion,
  submitDeposit,
} from '../../store/slices/accountSlice.js'
import { selectCurrency } from '../../store/slices/authSlice.js'
import {
  CURRENCY_TYPE,
  PAYMENT_LIST,
  PAYMENT_TYPE,
  onlyDigitsRegex,
} from '../../shared/types/common.js'
import { Icon } from './depositIcons.jsx'

// Mirrors Angular's `| date : 'YYYY-MM-dd HH:mm:ss'` pipe.
function formatDate(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

// Mirrors Angular's `| titlecase` pipe.
function titleCase(value) {
  if (!value) return ''
  return String(value)
    .toLowerCase()
    .split(/\s+/)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : ''))
    .join(' ')
}

// ─── Tailwind class strings ported from deposit.scss ─────────────────────────
// Promotion-item container (used both inline and in the modal list).
// `.promotion-item` from deposit.scss: bg sm-dark, padding 16, gap row, etc.
const promoItemBase =
  'bg-[var(--sm-dark)] rounded-lg p-4 flex justify-between items-center cursor-pointer transition-colors duration-200 border-[3px] border-transparent min-w-[calc(33.33%-7px)] max-md:max-w-full max-md:py-[25px] max-md:px-[15px]'
const promoItemActive =
  'border-[var(--primary)] [&_.radio-button]:border-[5px] [&_.radio-button]:border-[var(--primary)] [&_.radio-button]:bg-white'
const promoItemDisabled = 'opacity-70 pointer-events-none'

// Stable component reference — defined at module scope so React reuses the
// same `<div class="promotion-list">` DOM node across re-renders. If this
// were declared inside Deposit(), every state change would unmount/remount
// the list and reset its horizontal scrollLeft to 0.
function PromotionListItems({ promotions, activeId, onClick }) {
  return (
    // .promotion-list: row flex with horizontal scroll on desktop,
    // column with vertical scroll on mobile (max-h calc(100vh-145px)).
    <div className="flex flex-row gap-[10px] overflow-auto max-md:max-h-[calc(100vh-145px)] max-md:flex-col max-md:gap-4 max-md:my-0 max-md:mx-4 max-md:mb-4">
      {promotions.map((p) => {
        const isDisabled = p.promotionType === 'deposit_refund_interval_bonus'
        const active = activeId === p._id
        return (
          <div
            key={p._id}
            className={`${promoItemBase}${active ? ` ${promoItemActive}` : ''}${
              isDisabled ? ` ${promoItemDisabled}` : ''
            }`}
            onClick={() => !isDisabled && onClick(p)}
            role="button"
            tabIndex={isDisabled ? -1 : 0}
            onKeyDown={(e) => e.key === 'Enter' && !isDisabled && onClick(p)}
          >
            <div className="flex-1">
              <h3 className="mb-2 text-[var(--sm-gray-30)] font-semibold text-[16px] max-md:text-[20px] max-md:mb-[10px]">
                {p.title}
              </h3>
              <p className="text-[var(--sm-gray-30)] mb-[13px] text-[14px] max-md:text-[16px] max-md:mb-[10px]">
                {titleCase(p.category)}
              </p>
              {p.promotionTimeline && (
                <p className="text-[14px] text-[var(--sm-gray-30)] mb-0 font-semibold">
                  {formatDate(p.promotionTimeline.startDate)}~
                  {formatDate(p.promotionTimeline.endDate)}
                </p>
              )}
            </div>
            {/* .radio-button — width/height 18px, border 2 #918e8e, rounded full */}
            <div className="radio-button w-[18px] h-[18px] bg-black border-2 border-[#918e8e] rounded-full flex items-center justify-center mt-1 box-border">
              <div className="w-[10px] h-[10px] rounded-full" />
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Flatten /self-deposit/payment-methods.paymentMethods[].types[] into a
// lowercase set of usable type slugs (agent / merchant / personal).
function buildAllowedMethods(paymentMethods) {
  const set = new Set()
  ;(paymentMethods || []).forEach((m) => {
    ;(m.types || []).forEach((t) => {
      if (t.status === 'Active' && t.is_available) {
        set.add(String(t.type).toLowerCase())
      }
    })
  })
  return set
}

// Inputs/labels reused inside the deposit form (mirrors deposit.scss
// `.form-group label / .form-control`).
const formLabelClass = 'block text-[14px] mb-[3px]'
const formLabelRequiredClass = `${formLabelClass} after:content-['*'] after:text-red-500 after:ml-1`
const formControlClass =
  'block w-full px-3 py-[6px] text-[14px] leading-[1.5] text-[#212529] bg-white border border-[#ced4da] rounded focus:outline-none focus:border-[var(--light-gray)]'
const errorTextClass = 'block text-[12px] text-[var(--red)] mt-1'

// `.conversation-text` block.
const conversationTextClass =
  'text-center mb-3 p-2 bg-[var(--dark-green)] text-white text-[16px] rounded-md border-2 border-white shadow-[0_10px_10px_var(--xs-gray)]'

// `.method-box` payment thumbnail tile.
const methodBoxBase =
  'rounded-lg m-[5px] cursor-pointer border-2 border-transparent box-border'
const methodBoxActive = 'border-[var(--primary-yellow)]'

// Make Payment submit button.
const makePaymentBtnClass =
  'inline-flex items-center gap-1 mt-3 px-3 py-[6px] text-white bg-[var(--primary)] hover:bg-[var(--lg-primary)] rounded text-[14px] font-medium [&_i_svg]:h-[18px] [&_i_svg]:w-[18px] [&_i]:mr-[2px] disabled:opacity-65 disabled:cursor-not-allowed'

// Promotion-card (small inline summary that opens the modal).
const promotionCardBase =
  'flex items-center bg-[var(--sm-dark)] border-2 border-transparent rounded-[5px] px-[15px] py-[23px] mb-[7px] cursor-pointer transition-colors duration-200'
const promotionCardActive = 'border-[var(--primary-yellow)]'

export default function Deposit({ showTitle = true }) {
  const dispatch = useDispatch()
  const methods = useSelector(selectDepositPaymentMethods)
  const promotion = useSelector(selectPromotion)
  const submit = useSelector(selectDepositSubmit)
  const currency = useSelector(selectCurrency) || CURRENCY_TYPE.BDT

  const [values, setValues] = useState({
    amount: '',
    paymentType: '',
    promotionId: null,
  })
  const [touched, setTouched] = useState({})
  // Mirrors Angular's selectedPromotion + isShowPromoions signals — used by
  // the !showTitle (modal) flow to defer commit until "Confirm" is clicked.
  const [draftPromotion, setDraftPromotion] = useState(null)
  const [showPromotionModal, setShowPromotionModal] = useState(false)

  // useMemo on the raw API field so the empty-fallback array gets a stable
  // identity across renders — otherwise allowedMethods recomputes every time.
  const paymentMethods = useMemo(
    () => methods.data?.paymentMethods || [],
    [methods.data]
  )
  const allowedMethods = useMemo(
    () => buildAllowedMethods(paymentMethods),
    [paymentMethods]
  )
  // Hide merchant if not allowed (mirrors Angular's only specific case).
  // Other PAYMENT_LIST entries (agent / personal) are always shown.
  const visiblePaymentList = useMemo(
    () =>
      PAYMENT_LIST.filter((item) => {
        if (item.isHidden) return false
        if (item.name === 'merchant' && !allowedMethods.has('merchant'))
          return false
        return true
      }),
    [allowedMethods]
  )

  const promotions = promotion.data || []
  const selectedPromotion =
    promotions.find((p) => p._id === values.promotionId) || null

  useEffect(() => {
    dispatch(fetchDepositPaymentMethods())
    dispatch(fetchPromotion())
    // Note: /self-payment/PBU isn't available on api.mcv88.live (404 ROUTE_NOT_FOUND).
    // baji-exchange-frontend points at api.1ten365.live where it exists; here we
    // skip the conversion call entirely. BDT-only wallets don't need it, and
    // non-BDT support can re-enable fetchAmount once the backend ships it.
    return () => {
      dispatch(resetDepositSubmit())
    }
  }, [dispatch])

  // Auto-select the only allowed method when exactly one is returned —
  // derived (not stored) so we don't violate React's "you might not need an
  // effect" rule. Submit / active-state checks read `effectivePaymentType`.
  const autoSelectedPaymentType = useMemo(() => {
    if (allowedMethods.size !== 1) return ''
    const [only] = [...allowedMethods]
    return String(only).toUpperCase()
  }, [allowedMethods])

  const effectivePaymentType = values.paymentType || autoSelectedPaymentType

  // Redirect to the gateway once the payment URL lands.
  useEffect(() => {
    const url = submit.data?.payment_url
    const status = submit.data?.status
    if (submit.status === 'succeeded' && status && url) {
      window.location.href = url
    }
  }, [submit])

  const setField = (key, value) =>
    setValues((prev) => ({ ...prev, [key]: value }))

  const markTouched = (key) => setTouched((prev) => ({ ...prev, [key]: true }))

  // Form-control style errors (mirrors Angular's Validators.required / min / pattern).
  const amountValue = String(values.amount ?? '').trim()
  const amountErrors = {
    required: !amountValue,
    pattern: amountValue && !onlyDigitsRegex.test(amountValue),
    min: amountValue && Number(amountValue) < 1,
  }

  // Promotion deposit-limit error (Angular: managePbuPrice → showError signal).
  // PBU endpoint isn't available here, so non-BDT users fall back to the raw
  // amount until the backend ships /self-payment/PBU.
  const promotionLimitError = useMemo(() => {
    if (!selectedPromotion) return null
    const n = Number(values.amount)
    if (!n) return null
    const min = selectedPromotion.depositLimit?.min
    const max = selectedPromotion.depositLimit?.max
    if ((min && n < min) || (max && n > max)) return selectedPromotion
    return null
  }, [selectedPromotion, values.amount])

  const submitting = submit.status === 'loading'

  // Click handler shared by inline list (showTitle) AND modal list (!showTitle).
  const onPromotionItemClick = (p) => {
    if (showTitle) {
      // Inline list: commit immediately.
      setField('promotionId', values.promotionId === p._id ? null : p._id)
    } else {
      // Modal list: stage in draft until Confirm.
      setDraftPromotion(draftPromotion?._id === p._id ? null : p)
    }
  }

  const openPromotionModal = () => {
    setDraftPromotion(selectedPromotion)
    setShowPromotionModal(true)
  }

  const closePromotionModal = () => {
    setShowPromotionModal(false)
    setDraftPromotion(null)
  }

  const savePromotion = () => {
    setShowPromotionModal(false)
    setField('promotionId', draftPromotion?._id || null)
    setDraftPromotion(null)
  }

  const setPaymentMethod = (val) => {
    setField('paymentType', val)
    markTouched('paymentType')
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    setTouched({ amount: true, paymentType: true })
    if (
      amountErrors.required ||
      amountErrors.pattern ||
      amountErrors.min ||
      !effectivePaymentType ||
      promotionLimitError ||
      submitting
    ) {
      return
    }

    const payload = {
      amount: Number(values.amount),
      paymentType: effectivePaymentType,
      type: CURRENCY_TYPE.BDT,
      payment: PAYMENT_TYPE.UDDOKTAPAY,
    }
    if (values.promotionId) payload.promotionId = values.promotionId
    dispatch(submitDeposit(payload))
  }

  const showRequired = touched.amount && amountErrors.required
  const showMin = touched.amount && amountErrors.min
  const showPattern = touched.amount && amountErrors.pattern
  const showPaymentRequired = touched.paymentType && !effectivePaymentType

  return (
    <>
      {showTitle && (
        <div className="flex justify-between items-center">
          <p className="text-[#1e1e1e] font-bold text-[13px] leading-5 pt-1.5 mb-1.5">
            Deposit
          </p>
        </div>
      )}

      {/* .card rounded p-3 — Bootstrap card emulated with bg white + border */}
      <div className="bg-white border border-[rgba(0,0,0,0.125)] rounded p-3">
        <div className={conversationTextClass}>
          {currency === CURRENCY_TYPE.BDT ? '1 BDT = 1 BDT' : `1 PBU = 1 BDT`}
        </div>

        {promotions.length > 0 &&
          (!showTitle ? (
            <div className="w-full max-w-[400px]">
              <h3 className="text-[14px] font-medium mb-3 max-md:mb-[10px]">
                Select Your Promotion
              </h3>
              <div
                className={`${promotionCardBase}${
                  values.promotionId ? ` ${promotionCardActive}` : ''
                }`}
                onClick={openPromotionModal}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && openPromotionModal()}
              >
                <div className="flex justify-center items-center w-[24px] h-[24px] mr-[12px] [&_i]:text-[18px]">
                  <Icon name="giftBox" />
                </div>
                <div className="flex-1 flex justify-between items-center">
                  <div>
                    <div className="text-[16px] font-medium mb-[2px] text-white">
                      Promotion
                    </div>
                    {selectedPromotion && (
                      <div className="text-[14px] text-white">
                        {selectedPromotion.title}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-white text-[14px]">
                  <Icon name="rightArrowIcon" />
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-2">
              <div>
                <label className="block mb-1 text-[14px]">
                  Select Your Promotion
                </label>
              </div>
              <PromotionListItems
                promotions={promotions}
                activeId={values.promotionId}
                onClick={onPromotionItemClick}
              />
              <span className="block text-[12px] text-[var(--red)] mt-1 font-bold">
                {values.promotionId
                  ? 'Promotion is selected'
                  : 'Promotion is not selected'}
              </span>
            </div>
          ))}

        <form onSubmit={handleSubmit} noValidate>
          <div className="flex flex-col">
            <div className="mb-2">
              <label htmlFor="amount" className={formLabelRequiredClass}>
                {currency} amount
              </label>
              <div>
                <input
                  id="amount"
                  type="number"
                  className={formControlClass}
                  placeholder="Enter amount"
                  value={values.amount}
                  onChange={(event) => setField('amount', event.target.value)}
                  onBlur={() => markTouched('amount')}
                />
                {showRequired && (
                  <span className={errorTextClass}>Amount is required</span>
                )}
                {showMin && (
                  <span className={errorTextClass}>
                    Amount must be greater than 0
                  </span>
                )}
                {showPattern && (
                  <span className={errorTextClass}>Enter valid amount</span>
                )}
                {values.promotionId && promotionLimitError && (
                  <p className={`${errorTextClass} mb-0`}>
                    {currency} must be between{' '}
                    {promotionLimitError.depositLimit?.min} and{' '}
                    {promotionLimitError.depositLimit?.max} for selected
                    promotion.
                  </p>
                )}
              </div>
            </div>

            {(allowedMethods.size > 1 || allowedMethods.size === 0) && (
              <div>
                {showTitle && (
                  <label
                    htmlFor="paymentType"
                    className={formLabelRequiredClass}
                  >
                    {' '}
                    Payment Method{' '}
                  </label>
                )}
                <div
                  className={`flex overflow-x-auto gap-2${
                    !showTitle ? ' mt-3' : ''
                  }`}
                >
                  {visiblePaymentList.map((m) => {
                    const active = effectivePaymentType === m.value
                    return (
                      <div
                        key={m.value}
                        className={`${methodBoxBase}${active ? ` ${methodBoxActive}` : ''}`}
                        onClick={() => setPaymentMethod(m.value)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) =>
                          e.key === 'Enter' && setPaymentMethod(m.value)
                        }
                      >
                        <img
                          src={m.img}
                          alt="method"
                          className="h-[70px] w-auto"
                        />
                      </div>
                    )
                  })}
                </div>
                {showPaymentRequired && (
                  <span className={errorTextClass}>
                    Payment method is required
                  </span>
                )}
              </div>
            )}

            {submit.status === 'failed' && submit.error && (
              <span className={errorTextClass}>{submit.error}</span>
            )}

            <button
              type="submit"
              className={makePaymentBtnClass}
              disabled={!!promotionLimitError || submitting}
            >
              <Icon name="bkash" />
              <Icon name="nagad" />
              Make Payment
              <Icon name="rocket" />
              <Icon name="mobileBanking" />
            </button>
          </div>
        </form>
      </div>

      {showPromotionModal && (
        // .promotion-list-wrapper: fixed full screen, sm-gray-20 bg, z-1000,
        // slide-in animation from the right.
        <div className="fixed inset-0 bg-[#d4d4d4] flex items-center justify-center z-[1000] animate-[deposit-slide-in_300ms_ease-out]">
          {/* .promotion-modal — flexible column on mobile, full svh */}
          <div className="w-full bg-[var(--dark)] rounded-lg shadow-[0_4px_20px_rgba(0,0,0,0.5)] min-h-[100svh] max-md:flex max-md:flex-col">
            <div className="flex justify-between items-center p-4">
              <h2 className="text-[20px] font-semibold mb-0 text-white">
                Select Promotion
              </h2>
              <button
                type="button"
                className="bg-transparent border-0 text-white cursor-pointer w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/10 [&_i]:text-[16px]"
                onClick={closePromotionModal}
                aria-label="Close promotions"
              >
                <Icon name="close" />
              </button>
            </div>
            <PromotionListItems
              promotions={promotions}
              activeId={draftPromotion?._id}
              onClick={onPromotionItemClick}
            />
            <button
              type="button"
              className="w-[calc(100%-32px)] mx-4 mb-4 py-[14px] bg-[var(--orange-dark)] text-white border-0 rounded-md text-[16px] font-medium cursor-pointer transition-colors duration-200 max-md:mt-auto"
              onClick={savePromotion}
            >
              Confirm
            </button>
          </div>
        </div>
      )}
    </>
  )
}
