import { useEffect, useMemo, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  fetchDepositPaymentMethods,
  fetchPaymentMode,
  fetchPromotion,
  resetDepositSubmit,
  selectDepositPaymentMethods,
  selectDepositSubmit,
  selectPaymentMode,
  selectPromotion,
  selectSelfDepositSubmit,
  selectSelfDepositVerify,
  submitDeposit,
  submitSelfDeposit,
  verifySelfDeposit,
} from '../../store/slices/accountSlice.js'
import { selectCurrency } from '../../store/slices/authSlice.js'
import { selectIsDepositOnePage } from '../../store/slices/commonSlice.js'
import { alertService } from '../../shared/services/alert.js'
import {
  CURRENCY_TYPE,
  WITHDRAW_PAYMENT_METHODS,
  onlyDigitsRegex,
} from '../../shared/types/common.js'
import { Icon } from './depositIcons.jsx'
import './deposit.scss'

// Trx-id regex per payment method, ported from sbex-user-fe types/dw.ts.
const TRX_VALIDATORS = {
  ROCKET: /^[a-zA-Z0-9]{8}$|^[a-zA-Z0-9]{10}$/,
  BKASH: /^[a-zA-Z0-9]{10}$/,
  NAGAD: /^[a-zA-Z0-9]{8}$/,
}

// Sender-number regex — ROCKET is 12 digits, BKASH/NAGAD are 11 (sbex parity).
const senderPattern = (method) =>
  method === 'ROCKET' ? /^0\d{11}$/ : /^0\d{10}$/

// Background colors used by the verify-payment card, ported verbatim from
// sbex-user-fe deposit.ts:64-68.
const PAYMENT_METHOD_COLORS = {
  BKASH: '#cf2771',
  NAGAD: '#c90008',
  ROCKET: '#89288f',
}

// Logo lookup for the one-page (/self-deposit/payment-methods) response —
// that endpoint doesn't include logos. BKASH/NAGAD use the dedicated `_icon`
// assets at /public/img/; ROCKET falls back to the WITHDRAW_PAYMENT_METHODS
// set (no rocket_icon variant exists in /img/). Order matters: the explicit
// BKASH/NAGAD overrides come LAST so they win over the WITHDRAW reducer.
const LOGO_BY_NAME = {
  ...WITHDRAW_PAYMENT_METHODS.reduce((acc, m) => {
    acc[m.value] = m.img
    return acc
  }, {}),
  BKASH: '/img/bkash_icon.png',
  NAGAD: '/img/nagad_icon.png',
}

// Image lookup for Step-2 paymentType cards (agent / personal / merchant).
// Re-uses the original PAYMENT_LIST icons from when paymentType was the
// single-selection grid — keeps the visual consistent with the prior UI.
const PAYMENT_TYPE_IMAGES = {
  agent: '/img/payment/agent.png',
  personal: '/img/payment/personal.png',
  merchant: '/img/payment/merchant.png',
}

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

// Normalize /self-deposit/payment-methods.paymentMethods[] into the shared
// shape consumed by the picker UI. Drops methods with no Active+available
// type (otherwise the card would render but be unselectable) and lowercases
// type slugs so both branches feed the same comparison logic downstream.
function normalizeOnePageMethods(paymentMethods) {
  return (paymentMethods || [])
    .map((m) => {
      const types = (m.types || [])
        .filter((t) => t.status === 'Active' && t.is_available)
        .map((t) => ({
          name: String(t.type).toLowerCase(),
          min: Number(t.min),
          max: Number(t.max),
        }))
      return {
        methodId: m.method_id,
        name: m.payment_method,
        logo: LOGO_BY_NAME[m.payment_method] || '',
        types,
      }
    })
    .filter((m) => m.types.length > 0)
}

// Normalize /self-payment/payment-mode.activePaymentMethods[] — already
// close to the shared shape; just lowercase types[].name and fall back to
// the local logo asset if the API omits one.
function normalizeTwoPageMethods(activePaymentMethods) {
  return (activePaymentMethods || []).map((m) => ({
    methodId: m.methodId,
    name: m.name,
    // sbex-user-fe parity (deposit.ts:171): two-page uses the API logo
    // verbatim. Falls back to the local LOGO_BY_NAME entry only when the
    // backend omits the field for a method.
    logo: m.logo || LOGO_BY_NAME[m.name] || '',
    types: (m.types || []).map((t) => ({
      name: String(t.name).toLowerCase(),
      min: t.min,
      max: t.max,
    })),
  }))
}

export default function Deposit({ showTitle = true }) {
  const dispatch = useDispatch()
  const isDepositOnePage = useSelector(selectIsDepositOnePage)
  const methods = useSelector(selectDepositPaymentMethods)
  const paymentMode = useSelector(selectPaymentMode)
  const promotion = useSelector(selectPromotion)
  // Pick the active submit slot per branch — the slice keeps them separate
  // so resetting/idle state can't bleed across flows.
  const twoPageSubmit = useSelector(selectDepositSubmit)
  const onePageSubmit = useSelector(selectSelfDepositSubmit)
  const onePageVerify = useSelector(selectSelfDepositVerify)
  const submit = isDepositOnePage ? onePageSubmit : twoPageSubmit
  const currency = useSelector(selectCurrency) || CURRENCY_TYPE.BDT

  const [values, setValues] = useState({
    amount: '',
    methodId: '',
    paymentType: '',
    promotionId: null,
  })
  const [touched, setTouched] = useState({})
  // Mirrors Angular's selectedPromotion + isShowPromoions signals — used by
  // the !showTitle (modal) flow to defer commit until "Confirm" is clicked.
  const [draftPromotion, setDraftPromotion] = useState(null)
  const [showPromotionModal, setShowPromotionModal] = useState(false)

  // One-page verify-card state. The transaction payload + success flag are
  // derived from Redux directly (no useState mirror) so we don't trip the
  // react-hooks/set-state-in-effect rule. selectedMethodName is derived from
  // the picked method object below — no separate state.
  const [verifyValues, setVerifyValues] = useState({ trxId: '', senderNumber: '' })
  const [verifyTouched, setVerifyTouched] = useState({})
  const verifyCardRef = useRef(null)
  // Privacy mask flag from /self-deposit/payment-methods response (one-page
  // only); derived inline — no need to hoist into local state.
  const privacySettings = !!methods.data?.privacySettings?.privacy_setting
  const selfDepositTx = isDepositOnePage ? onePageSubmit.data?.data ?? null : null
  const isDepositSuccess =
    isDepositOnePage &&
    onePageSubmit.status === 'succeeded' &&
    !!selfDepositTx?.transactionId

  // Method-first UI: BKASH / NAGAD / ROCKET cards come from whichever API
  // shape the current branch returned, normalized into a single internal
  // form { methodId, name, logo, types: [{ name, min, max }] }.
  const methodOptions = useMemo(() => {
    return isDepositOnePage
      ? normalizeOnePageMethods(methods.data?.paymentMethods)
      : normalizeTwoPageMethods(paymentMode.data?.activePaymentMethods)
  }, [isDepositOnePage, methods.data, paymentMode.data])

  // The picked method object (or null). Drives the verify-card color, the
  // trx-id regex, the available paymentTypes, and the submit payload.
  const selectedMethod = useMemo(
    () => methodOptions.find((m) => m.methodId === values.methodId) || null,
    [methodOptions, values.methodId],
  )

  const availableTypes = selectedMethod?.types ?? []

  // Gateway name (e.g. "sbkash") — two-page payload requires this. sbex
  // simply picks gateways[0] (deposit.ts:162); we do the same.
  const gatewayName = paymentMode.data?.gateways?.[0]?.name ?? null

  const promotions = promotion.data || []
  const selectedPromotion =
    promotions.find((p) => p._id === values.promotionId) || null

  useEffect(() => {
    // sbex-user-fe deposit.ts:106 branch — one fetch per flow, never both.
    if (isDepositOnePage) {
      dispatch(fetchDepositPaymentMethods())
    } else {
      dispatch(fetchPaymentMode())
    }
    dispatch(fetchPromotion())
    // Note: /self-payment/PBU isn't available on api.mcv88.live (404 ROUTE_NOT_FOUND).
    // baji-exchange-frontend points at api.1ten365.live where it exists; here we
    // skip the conversion call entirely. BDT-only wallets don't need it, and
    // non-BDT support can re-enable fetchAmount once the backend ships it.
    return () => {
      dispatch(resetDepositSubmit())
    }
  }, [dispatch, isDepositOnePage])


  // Auto-pick the only available option at each level — derived (not stored)
  // so we don't violate React's "you might not need an effect" rule.
  const autoSelectedMethodId =
    methodOptions.length === 1 ? methodOptions[0].methodId : ''
  const autoSelectedPaymentType =
    availableTypes.length === 1 ? availableTypes[0].name : ''

  const effectiveMethodId = values.methodId || autoSelectedMethodId
  const effectiveMethod =
    selectedMethod ||
    methodOptions.find((m) => m.methodId === effectiveMethodId) ||
    null
  const effectivePaymentType = values.paymentType || autoSelectedPaymentType
  // BKASH / NAGAD / ROCKET — drives verify-card color + trx-id regex.
  const selectedMethodName = effectiveMethod?.name ?? ''

  // Two-page only: redirect to the gateway once the payment URL lands.
  // sbex-user-fe deposit.ts:306-314 does the same window.location.href hop;
  // if payment_url is absent the response is treated as a success in-place.
  useEffect(() => {
    if (isDepositOnePage) return
    const url = twoPageSubmit.data?.payment_url
    const status = twoPageSubmit.data?.status
    if (twoPageSubmit.status === 'succeeded' && status && url) {
      window.location.href = url
    }
  }, [isDepositOnePage, twoPageSubmit])

  // One-page only: scroll the verify card into view once it appears.
  // Pure DOM side effect — no setState — so this stays compatible with the
  // react-hooks/set-state-in-effect rule. Fires when isDepositSuccess flips.
  useEffect(() => {
    if (!isDepositSuccess) return
    const id = setTimeout(() => {
      verifyCardRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 500)
    return () => clearTimeout(id)
  }, [isDepositSuccess])

  // Fire-and-forget success alert when the one-page submit lands.
  useEffect(() => {
    if (!isDepositOnePage) return
    if (onePageSubmit.status !== 'succeeded') return
    if (onePageSubmit.data?.key) alertService.success(onePageSubmit.data.key)
  }, [isDepositOnePage, onePageSubmit.status, onePageSubmit.data?.key])

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

  // Picking a method resets paymentType — types are method-scoped and an old
  // value would silently submit against the new method's types[].
  const selectMethod = (methodId) => {
    setValues((prev) => ({ ...prev, methodId, paymentType: '' }))
    markTouched('methodId')
  }
  const selectPaymentType = (typeName) => {
    setField('paymentType', typeName)
    markTouched('paymentType')
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    setTouched({ amount: true, methodId: true, paymentType: true })
    if (
      amountErrors.required ||
      amountErrors.pattern ||
      amountErrors.min ||
      !effectiveMethod ||
      !effectivePaymentType ||
      promotionLimitError ||
      submitting
    ) {
      return
    }

    const paymentTypeLower = String(effectivePaymentType).toLowerCase()

    if (isDepositOnePage) {
      // /self-deposit/ uses snake_case `method_id` (sbex SelfDepositPayload).
      const payload = {
        amount: Number(values.amount),
        paymentType: paymentTypeLower,
        method_id: effectiveMethod.methodId,
      }
      if (values.promotionId) payload.promotionId = values.promotionId
      dispatch(submitSelfDeposit(payload))
    } else {
      // /self-payment/payment uses camelCase `methodId` AND requires `gateway`
      // (validated server-side per the user's report — VALIDATION error
      // "Payment gateway is required" when absent). Mirrors sbex
      // SelfPaymentPayload + deposit.ts:162 (controls['gateway'].setValue).
      const payload = {
        amount: Number(values.amount),
        paymentType: paymentTypeLower,
        methodId: effectiveMethod.methodId,
      }
      if (gatewayName) payload.gateway = gatewayName
      if (values.promotionId) payload.promotionId = values.promotionId
      dispatch(submitDeposit(payload))
    }
  }

  // Verify-payment errors (mirrors Validators.required + pattern in sbex-user-fe).
  const trxId = String(verifyValues.trxId ?? '').trim()
  const senderNumber = String(verifyValues.senderNumber ?? '').trim()
  const trxIdRegex = TRX_VALIDATORS[selectedMethodName]
  const senderRegex = senderPattern(selectedMethodName)
  const verifyErrors = {
    trxIdRequired: !trxId,
    trxIdPattern: trxId && trxIdRegex && !trxIdRegex.test(trxId),
    senderRequired: !senderNumber,
    senderPattern: senderNumber && !senderRegex.test(senderNumber),
  }

  const setVerifyField = (key, value) =>
    setVerifyValues((prev) => ({ ...prev, [key]: value }))
  const markVerifyTouched = (key) =>
    setVerifyTouched((prev) => ({ ...prev, [key]: true }))

  const handleVerifySubmit = async () => {
    setVerifyTouched({ trxId: true, senderNumber: true })
    if (
      verifyErrors.trxIdRequired ||
      verifyErrors.trxIdPattern ||
      verifyErrors.senderRequired ||
      verifyErrors.senderPattern
    ) {
      return
    }
    // unwrap() throws on rejected so we only reset on success. Doing the
    // reset here (rather than in an effect on onePageVerify.status) keeps
    // setState calls out of effects.
    try {
      const result = await dispatch(
        verifySelfDeposit({
          transactionId: selfDepositTx?.transactionId ?? '',
          receiverNumber: selfDepositTx?.receiver_number ?? '',
          trxId,
          senderNumber,
        }),
      ).unwrap()
      if (result?.key) alertService.success(result.key)
      setVerifyValues({ trxId: '', senderNumber: '' })
      setVerifyTouched({})
      setValues({ amount: '', methodId: '', paymentType: '', promotionId: null })
      setTouched({})
      dispatch(resetDepositSubmit())
    } catch {
      // Alert is surfaced via the http interceptor; nothing else to do here.
    }
  }

  const copyToClipboard = async (value) => {
    const text =
      value != null ? String(value) : selfDepositTx?.receiver_number ?? ''
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      alertService.success('Copied to clipboard')
    } catch {
      alertService.error('Copy failed')
    }
  }

  const cardColor = PAYMENT_METHOD_COLORS[selectedMethodName] || '#262626'

  // Receiver-number display string, with the same 4+xxxx+2 mask sbex applies
  // when privacy_setting is on (deposit.html:210-220). Falls back to '00'
  // until the API responds — matches the empty-state placeholder upstream.
  const receiverDisplay = (() => {
    const r = selfDepositTx?.receiver_number
    if (!r) return '00'
    if (!privacySettings) return String(r)
    const s = String(r)
    return `${s.slice(0, 4)}xxxx${s.slice(-2)}`
  })()

  // Receiver-number label changes per paymentType, same as sbex deposit.html:
  // 197-205. Falls back to a generic "Receiver Number" if no type is picked.
  const receiverLabel =
    effectivePaymentType === 'personal'
      ? 'Personal Number'
      : effectivePaymentType === 'agent'
        ? 'Agent Number'
        : effectivePaymentType === 'merchant'
          ? 'Merchant Number'
          : 'Receiver Number'

  const showRequired = touched.amount && amountErrors.required
  const showMin = touched.amount && amountErrors.min
  const showPattern = touched.amount && amountErrors.pattern
  const showMethodRequired = touched.methodId && !effectiveMethod
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
                  disabled={isDepositSuccess}
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

            {/* Step 1 — Payment Method (BKASH / NAGAD / ROCKET). Markup
                ported from sbex-user-fe deposit.html:48-82 — radio-card
                pattern using .payment-methods-cards + .form-check with the
                radio input overlaying the label so the entire card is the
                click target. Methods come from whichever API the current
                branch returned, normalized into methodOptions above. */}
            {methodOptions.length > 0 && (
              <div className="payment-card">
                <div className="form-group">
                  {showTitle && (
                    <label htmlFor="paymentMethod" className="mb-1">
                      Payment Method <span className="astrisk">*</span>
                    </label>
                  )}
                  <div className="d-flex payment-methods-cards">
                    {methodOptions.map((m) => {
                      const active = effectiveMethodId === m.methodId
                      const locked = isDepositSuccess
                      return (
                        <div
                          key={m.methodId}
                          className="form-check position-relative"
                        >
                          <input
                            className="form-check-input"
                            type="radio"
                            name="methodId"
                            id={`method-${m.methodId}`}
                            value={m.methodId}
                            checked={active}
                            disabled={locked}
                            onChange={() => selectMethod(m.methodId)}
                          />
                          <label
                            className="form-check-label"
                            htmlFor={`method-${m.methodId}`}
                          >
                            {m.logo && <img src={m.logo} alt={m.name} />}
                            <span className="text-center">{m.name}</span>
                          </label>
                        </div>
                      )
                    })}
                  </div>
                  {showMethodRequired && (
                    <span className="error">Payment method is required</span>
                  )}
                </div>
              </div>
            )}

            {/* Step 2 — Payment Type (agent / personal / merchant). Re-uses
                the original .method-box visual from before the dual-flow
                refactor so the page keeps a single card style; images come
                from PAYMENT_TYPE_IMAGES (same assets the old PAYMENT_LIST
                grid used). Status/is_available is pre-filtered upstream. */}
            {effectiveMethod && availableTypes.length > 0 && (
              <div className="form-group mt-3">
                {showTitle && (
                  <label htmlFor="paymentType" className="asterisk">
                    {' '}
                    Payment Type{' '}
                  </label>
                )}
                <div
                  className={`d-flex overflow-x-auto gap-2${
                    !showTitle ? ' mt-3' : ''
                  }`}
                >
                  {availableTypes.map((t) => {
                    const active = effectivePaymentType === t.name
                    const locked = isDepositSuccess
                    const img = PAYMENT_TYPE_IMAGES[t.name]
                    return (
                      <div
                        key={t.name}
                        className={`method-box${active ? ' active' : ''}${
                          locked ? ' disabled' : ''
                        }`}
                        onClick={() => !locked && selectPaymentType(t.name)}
                        role="button"
                        tabIndex={locked ? -1 : 0}
                        onKeyDown={(e) =>
                          e.key === 'Enter' &&
                          !locked &&
                          selectPaymentType(t.name)
                        }
                      >
                        {img && <img src={img} alt={t.name} />}
                      </div>
                    )
                  })}
                </div>
                {showPaymentRequired && (
                  <span className="error">Payment type is required</span>
                )}
              </div>
            )}

            {submit.status === 'failed' && submit.error && (
              <span className="error">{submit.error}</span>
            )}

            {/* One-page verify card — only renders after submitSelfDeposit
                resolves. Ported from sbex-user-fe deposit.html:172-286 in
                its `isOnePageNewDepositUI` branch (the "new-bangla-deposit"
                layout). Background = picked method's brand color (BKASH pink,
                NAGAD red, ROCKET purple). */}
            {isDepositSuccess && isDepositOnePage && (
              <div
                ref={verifyCardRef}
                className="verify-payment-card new-bangla-deposit mt-3"
                style={{ backgroundColor: cardColor }}
              >
                <h6 className="text-center">Keep screenshot</h6>

                {/* Deposit Amount — read-only display + copy icon. */}
                <div className="form-group mb-2">
                  <label>Deposit Amount:</label>
                  <input
                    type="text"
                    className="form-control opacity75"
                    value={`${currency} ${values.amount || ''}`}
                    disabled
                    readOnly
                  />
                  <span
                    className="copy-icon"
                    role="button"
                    tabIndex={0}
                    onClick={() => copyToClipboard(values.amount)}
                  >
                    <Icon name="copyIcon" />
                  </span>
                </div>

                {/* Receiver Number — label changes per paymentType; value
                    is masked when privacy_setting is on. */}
                <div className="form-group mb-2">
                  <label>{receiverLabel} :</label>
                  <input
                    type="text"
                    className="form-control opacity75"
                    value={receiverDisplay}
                    disabled
                    readOnly
                  />
                  <span
                    className="copy-icon"
                    role="button"
                    tabIndex={0}
                    onClick={() =>
                      copyToClipboard(selfDepositTx?.receiver_number)
                    }
                  >
                    <Icon name="copyIcon" />
                  </span>
                </div>

                <hr />

                {/* Editable: trxId. */}
                <div className="form-group mb-2">
                  <label>Provide transaction ID</label>
                  <div className="input-with-errors">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Provide transaction ID"
                      value={verifyValues.trxId}
                      onChange={(e) => setVerifyField('trxId', e.target.value)}
                      onBlur={() => markVerifyTouched('trxId')}
                    />
                    {verifyTouched.trxId && verifyErrors.trxIdRequired && (
                      <span className="field-error">
                        Provide your transaction ID
                      </span>
                    )}
                    {verifyTouched.trxId && verifyErrors.trxIdPattern && (
                      <span className="field-error">
                        Invalid transaction ID
                      </span>
                    )}
                  </div>
                </div>

                {/* Editable: senderNumber. */}
                <div className="form-group">
                  <label>Transaction number</label>
                  <div className="input-with-errors">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="017XXXXXXXX"
                      value={verifyValues.senderNumber}
                      onChange={(e) =>
                        setVerifyField('senderNumber', e.target.value)
                      }
                      onBlur={() => markVerifyTouched('senderNumber')}
                    />
                    {verifyTouched.senderNumber &&
                      verifyErrors.senderRequired && (
                        <span className="field-error">
                          Enter your transaction number
                        </span>
                      )}
                    {verifyTouched.senderNumber &&
                      verifyErrors.senderPattern && (
                        <span className="field-error">
                          Kindly enter a valid{' '}
                          {selectedMethodName === 'ROCKET' ? '12' : '11'} digit
                          number
                        </span>
                      )}
                  </div>
                </div>
              </div>
            )}

            {isDepositSuccess && isDepositOnePage ? (
              <button
                type="button"
                className="btn make-payment w-100 text-white mt-3"
                style={{ backgroundColor: cardColor }}
                onClick={handleVerifySubmit}
                disabled={onePageVerify.status === 'loading'}
              >
                Confirm
              </button>
            ) : (
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
            )}
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
