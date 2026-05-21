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
import './deposit.scss'

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

// Stable component reference — defined at module scope so React reuses the
// same `<div class="promotion-list">` DOM node across re-renders. If this
// were declared inside Deposit(), every state change would unmount/remount
// the list and reset its horizontal scrollLeft to 0.
function PromotionListItems({ promotions, activeId, onClick }) {
  return (
    <div className="promotion-list">
      {promotions.map((p) => {
        const isDisabled = p.promotionType === 'deposit_refund_interval_bonus'
        const active = activeId === p._id
        return (
          <div
            key={p._id}
            className={`promotion-item${active ? ' active' : ''}${
              isDisabled ? ' disabled' : ''
            }`}
            onClick={() => !isDisabled && onClick(p)}
            role="button"
            tabIndex={isDisabled ? -1 : 0}
            onKeyDown={(e) =>
              e.key === 'Enter' && !isDisabled && onClick(p)
            }
          >
            <div className="promotion-content">
              <h3 className="title">{p.title}</h3>
              <p className="subtitle">{titleCase(p.category)}</p>
              {p.promotionTimeline && (
                <p className="date-range">
                  {formatDate(p.promotionTimeline.startDate)}~
                  {formatDate(p.promotionTimeline.endDate)}
                </p>
              )}
            </div>
            <div className="radio-button">
              <div className="radio-inner" />
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
    [methods.data],
  )
  const allowedMethods = useMemo(
    () => buildAllowedMethods(paymentMethods),
    [paymentMethods],
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
    [allowedMethods],
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

  const markTouched = (key) =>
    setTouched((prev) => ({ ...prev, [key]: true }))

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
      setField(
        'promotionId',
        values.promotionId === p._id ? null : p._id,
      )
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
        <div className="page-title d-flex justify-content-between align-items-center">
          <p className="m-0">Deposit</p>
        </div>
      )}

      <div className="card rounded p-3">
        <div className="text-center mb-3 p-2 conversation-text">
          {currency === CURRENCY_TYPE.BDT ? '1 BDT = 1 BDT' : `1 PBU = 1 BDT`}
        </div>

        {promotions.length > 0 &&
          (!showTitle ? (
            <div className="promotion-container">
              <h3 className="promotion-header">Select Your Promotion</h3>
              <div
                className={`promotion-card${
                  values.promotionId ? ' active' : ''
                }`}
                onClick={openPromotionModal}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && openPromotionModal()}
              >
                <div className="promotion-icon">
                  <Icon name="giftBox" />
                </div>
                <div className="promotion-content">
                  <div className="promotion-title">Promotion</div>
                  {selectedPromotion && (
                    <div className="promotion-description">
                      {selectedPromotion.title}
                    </div>
                  )}
                </div>
                <div className="promotion-arrow">
                  <Icon name="rightArrowIcon" />
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-2">
              <div className="form-group">
                <label className="mb-1">Select Your Promotion</label>
              </div>
              <PromotionListItems
                promotions={promotions}
                activeId={values.promotionId}
                onClick={onPromotionItemClick}
              />
              <span className="error fw-bold">
                {values.promotionId
                  ? 'Promotion is selected'
                  : 'Promotion is not selected'}
              </span>
            </div>
          ))}

        <form className="payment-form" onSubmit={handleSubmit} noValidate>
          <div className="d-flex flex-column">
            <div className="form-group mb-2">
              <label htmlFor="amount" className="asterisk">
                {currency} amount
              </label>
              <div>
                <input
                  id="amount"
                  type="number"
                  className="form-control"
                  placeholder="Enter amount"
                  value={values.amount}
                  onChange={(event) => setField('amount', event.target.value)}
                  onBlur={() => markTouched('amount')}
                />
                {showRequired && (
                  <span className="error">Amount is required</span>
                )}
                {showMin && (
                  <span className="error">Amount must be greater than 0</span>
                )}
                {showPattern && (
                  <span className="error">Enter valid amount</span>
                )}
                {values.promotionId && promotionLimitError && (
                  <p className="error mb-0">
                    {currency} must be between{' '}
                    {promotionLimitError.depositLimit?.min} and{' '}
                    {promotionLimitError.depositLimit?.max} for selected
                    promotion.
                  </p>
                )}
              </div>
            </div>

            {(visiblePaymentList.length > 1 ||
              visiblePaymentList.length === 0) && (
              <div className="form-group">
                {showTitle && (
                  <label htmlFor="paymentType" className="asterisk">
                    Payment Method
                  </label>
                )}
                <div
                  className={`d-flex overflow-x-auto gap-2${
                    !showTitle ? ' mt-3' : ''
                  }`}
                >
                  {visiblePaymentList.map((m) => {
                    const active = effectivePaymentType === m.value
                    return (
                      <div
                        key={m.value}
                        className={`method-box${active ? ' active' : ''}`}
                        onClick={() => setPaymentMethod(m.value)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) =>
                          e.key === 'Enter' && setPaymentMethod(m.value)
                        }
                      >
                        <img src={m.img} alt="method" />
                      </div>
                    )
                  })}
                </div>
                {showPaymentRequired && (
                  <span className="error">Payment method is required</span>
                )}
              </div>
            )}

            {submit.status === 'failed' && submit.error && (
              <span className="error">{submit.error}</span>
            )}

            <button
              type="submit"
              className="btn btn-primary mt-3 make-payment"
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
        <div className="promotion-list-wrapper">
          <div className="promotion-modal">
            <div className="promotion-modal-header">
              <h2>Select Promotion</h2>
              <button
                type="button"
                className="close-button"
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
              className="confirm-button"
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
