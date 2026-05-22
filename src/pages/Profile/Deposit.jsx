import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
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
import { alertService, resolveApiMessage } from '../../shared/services/alert.js'
import {
  CURRENCY_TYPE,
  WITHDRAW_PAYMENT_METHODS,
  onlyDigitsRegex,
} from '../../shared/types/common.js'
import { Icon } from './depositIcons.jsx'

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
// const methodBoxBase =
//   'rounded-lg m-[5px] cursor-pointer border-2 border-transparent box-border'
// const methodBoxActive = 'border-[var(--primary-yellow)]'

// // Make Payment submit button.
// const makePaymentBtnClass =
//   'inline-flex items-center gap-1 mt-3 px-3 py-[6px] text-white bg-[var(--primary)] hover:bg-[var(--lg-primary)] rounded text-[14px] font-medium [&_i_svg]:h-[18px] [&_i_svg]:w-[18px] [&_i]:mr-[2px] disabled:opacity-65 disabled:cursor-not-allowed'

// Promotion-card (small inline summary that opens the modal).
const promotionCardBase =
  'flex items-center bg-[var(--sm-dark)] border-2 border-transparent rounded-[5px] px-[15px] py-[23px] mb-[7px] cursor-pointer transition-colors duration-200'
const promotionCardActive = 'border-[var(--primary-yellow)]'

export default function Deposit({ showTitle = true }) {
  const { t } = useTranslation()
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
  const [verifyValues, setVerifyValues] = useState({
    trxId: '',
    senderNumber: '',
  })
  const [verifyTouched, setVerifyTouched] = useState({})
  const verifyCardRef = useRef(null)
  // Privacy mask flag from /self-deposit/payment-methods response (one-page
  // only); derived inline — no need to hoist into local state.
  const privacySettings = !!methods.data?.privacySettings?.privacy_setting
  const selfDepositTx = isDepositOnePage
    ? (onePageSubmit.data?.data ?? null)
    : null
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
    [methodOptions, values.methodId]
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
    const msg = resolveApiMessage(t, onePageSubmit.data, '')
    if (msg) alertService.success(msg)
  }, [isDepositOnePage, onePageSubmit.status, onePageSubmit.data, t])

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
    // Marking touched on first interaction lets the "not selected" warning
    // appear when the user picks a promotion then deselects it, without
    // showing it on initial page load before the user has touched the field.
    markTouched('promotionId')
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
    setTouched({
      amount: true,
      methodId: true,
      paymentType: true,
      promotionId: true,
    })
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
        })
      ).unwrap()
      const msg = resolveApiMessage(t, result, '')
      if (msg) alertService.success(msg)
      setVerifyValues({ trxId: '', senderNumber: '' })
      setVerifyTouched({})
      setValues({
        amount: '',
        methodId: '',
        paymentType: '',
        promotionId: null,
      })
      setTouched({})
      dispatch(resetDepositSubmit())
    } catch {
      // Alert is surfaced via the http interceptor; nothing else to do here.
    }
  }

  const copyToClipboard = async (value) => {
    const text =
      value != null ? String(value) : (selfDepositTx?.receiver_number ?? '')
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      alertService.success(t('copyToClipboard.success'))
    } catch {
      alertService.error(t('copyToClipboard.error'))
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
      ? t('deposit.personalNumberLabel', 'Personal Number')
      : effectivePaymentType === 'agent'
        ? t('deposit.agentNumberLabel', 'Agent Number')
        : effectivePaymentType === 'merchant'
          ? t('deposit.merchantNumberLabel', 'Merchant Number')
          : t('deposit.receiverNumberLabel', 'Receiver Number')

  const showRequired = touched.amount && amountErrors.required
  const showMin = touched.amount && amountErrors.min
  const showPattern = touched.amount && amountErrors.pattern
  const showMethodRequired = touched.methodId && !effectiveMethod
  const showPaymentRequired = touched.paymentType && !effectivePaymentType

  return (
    <>
      {showTitle && (
        <div className="flex justify-between items-center">
          <p className="text-[#1e1e1e] font-bold text-[13px] leading-5 pt-1.5 mb-1.5">
            {t('common.deposit', 'Deposit')}
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
                {t('deposit.selectYourPromotion', 'Select Your Promotion')}
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
                      {t('common.promotion', 'Promotion')}
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
                  {t('deposit.selectYourPromotion', 'Select Your Promotion')}
                </label>
              </div>
              <PromotionListItems
                promotions={promotions}
                activeId={values.promotionId}
                onClick={onPromotionItemClick}
              />
              {touched.promotionId && !values.promotionId && (
                <span className="block text-[12px] text-[var(--red)] mt-1 font-bold">
                  {t('deposit.promotionNotSelected', 'Promotion is not selected')}
                </span>
              )}
            </div>
          ))}

        <form onSubmit={handleSubmit} noValidate>
          <div className="flex flex-col">
            <div className="mb-2">
              <label htmlFor="amount" className={formLabelRequiredClass}>
                {currency} {t('common.amount', 'Amount').toLowerCase()}
              </label>
              <div>
                <input
                  id="amount"
                  type="number"
                  className={formControlClass}
                  placeholder={t('deposit.enterAmount', 'Enter amount')}
                  value={values.amount}
                  onChange={(event) => setField('amount', event.target.value)}
                  onBlur={() => markTouched('amount')}
                  disabled={isDepositSuccess}
                />
                {showRequired && (
                  <span className={errorTextClass}>
                    {t('deposit.amountRequired', 'Amount is required')}
                  </span>
                )}
                {showMin && (
                  <span className={errorTextClass}>
                    {t('deposit.amountGtZero', 'Amount must be greater than 0')}
                  </span>
                )}
                {showPattern && (
                  <span className={errorTextClass}>
                    {t('deposit.amountInvalid', 'Enter valid amount')}
                  </span>
                )}
                {values.promotionId && promotionLimitError && (
                  <p className={`${errorTextClass} mb-0`}>
                    {t('deposit.promotionLimitError', {
                      currency,
                      min: promotionLimitError.depositLimit?.min,
                      max: promotionLimitError.depositLimit?.max,
                      defaultValue:
                        '{{currency}} must be between {{min}} and {{max}} for selected promotion.',
                    })}
                  </p>
                )}
              </div>
            </div>

            {/* Step 1 — Payment Method (BKASH / NAGAD / ROCKET). Radio-card
                pattern: the radio input is absolutely positioned over the
                label so the entire card is the click target; the yellow
                border ring appears via `peer-checked:border-...`. Mobile
                viewport reuses the same vw-based proportions as sbex. */}
            {methodOptions.length > 0 && (
              <div>
                {showTitle && (
                  <label
                    htmlFor="paymentMethod"
                    className={formLabelRequiredClass}
                  >
                    {t('common.paymentMethod', 'Payment Method')}
                  </label>
                )}
                <div className="flex gap-[10px] flex-wrap max-md:gap-1">
                  {methodOptions.map((m) => {
                    const active = effectiveMethodId === m.methodId
                    const locked = isDepositSuccess
                    return (
                      <div
                        key={m.methodId}
                        className="relative w-[100px] max-md:w-[calc(33.33%-2.666px)]"
                      >
                        <input
                          type="radio"
                          name="methodId"
                          id={`method-${m.methodId}`}
                          value={m.methodId}
                          checked={active}
                          disabled={locked}
                          onChange={() => selectMethod(m.methodId)}
                          className={`absolute inset-0 w-full h-full m-0 cursor-pointer bg-transparent rounded-[5px] appearance-none border ${
                            active
                              ? 'border-[var(--primary-yellow)]'
                              : 'border-[#262626]'
                          } disabled:cursor-not-allowed disabled:opacity-60`}
                        />
                        <label
                          htmlFor={`method-${m.methodId}`}
                          className="flex flex-col items-center justify-center mb-0 p-2 rounded-[5px] pointer-events-none max-md:bg-white max-md:p-[1.86vw] max-md:rounded-[1.163vw]"
                        >
                          {m.logo && (
                            <img
                              src={m.logo}
                              alt={m.name}
                              className="h-10 w-auto mx-auto max-md:w-[9.302vw] max-md:h-[9.302vw]"
                            />
                          )}
                          <span className="text-center text-[14px] mt-[5px] block max-md:text-[3.256vw] max-md:mt-[1.163vw]">
                            {m.name}
                          </span>
                        </label>
                      </div>
                    )
                  })}
                </div>
                {showMethodRequired && (
                  <span className={errorTextClass}>
                    {t(
                      'deposit.paymentMethodRequired',
                      'Payment method is required'
                    )}
                  </span>
                )}
              </div>
            )}

            {/* Step 2 — Payment Type (agent / personal / merchant). Re-uses
                the icon-only `.method-box` visual via Tailwind utilities so
                the page stays SCSS-free. Status/is_available is pre-filtered
                upstream by normalizeOnePageMethods. */}
            {effectiveMethod && availableTypes.length > 0 && (
              <div className="mt-3">
                {showTitle && (
                  <label
                    htmlFor="paymentType"
                    className={formLabelRequiredClass}
                  >
                    {t('common.paymentType', 'Payment Type')}
                  </label>
                )}
                <div className="flex overflow-x-auto gap-2">
                  {availableTypes.map((t) => {
                    const active = effectivePaymentType === t.name
                    const locked = isDepositSuccess
                    const img = PAYMENT_TYPE_IMAGES[t.name]
                    return (
                      <div
                        key={t.name}
                        className={`rounded-lg m-[5px] cursor-pointer border-2 box-border ${
                          active
                            ? 'border-[var(--primary-yellow)]'
                            : 'border-transparent'
                        } ${locked ? 'opacity-60 pointer-events-none' : ''}`}
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
                  <span className={errorTextClass}>
                    {t(
                      'deposit.paymentTypeRequired',
                      'Payment Type is required'
                    )}
                  </span>
                )}
              </div>
            )}

            {/* API errors surface as a toast via the http error interceptor
                (core/http/bootstrap.js + alertService) — no need to also
                duplicate them as inline text under the form. */}

            {/* One-page verify card — sbex-user-fe `isOnePageNewDepositUI`
                layout, rendered in Tailwind. Background color is set inline
                from cardColor (BKASH pink / NAGAD red / ROCKET purple).
                Layout: flex-row form groups with label left + bounded input
                right + absolute copy-icon. Mobile uses vw padding for parity
                with sbex deposit.scss. */}
            {isDepositSuccess && isDepositOnePage && (
              <div
                ref={verifyCardRef}
                className="mt-3 text-white rounded-[12px] p-[18px_16px] max-md:rounded-[2.326vw] max-md:p-[2.558vw_1.628vw]"
                style={{ backgroundColor: cardColor }}
              >
                <h6 className="text-center text-[14px] font-semibold mb-3 text-white">
                  {t('deposit.keepScreenshot', 'Keep screenshot')}
                </h6>

                {/* Deposit Amount — read-only display + copy icon. */}
                <div className="flex justify-between items-center relative gap-2 mb-2">
                  <label className="whitespace-nowrap !mb-0 text-[13px] leading-[1.2] text-white">
                    {t('deposit.depositAmountLabel', 'Deposit Amount')} :
                  </label>
                  <input
                    type="text"
                    className="max-w-[180px] h-8 py-1 px-[10px] pr-[30px] text-[13px] text-[#364153] bg-white border border-[#ced4da] rounded-[6px] opacity-75 placeholder:text-[12px]"
                    value={`${currency} ${values.amount || ''}`}
                    disabled
                    readOnly
                  />
                  <span
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[#364153] cursor-pointer leading-none inline-flex [&_svg]:h-4 [&_svg]:w-auto"
                    role="button"
                    tabIndex={0}
                    onClick={() => copyToClipboard(values.amount)}
                  >
                    <Icon name="copyIcon" />
                  </span>
                </div>

                {/* Receiver Number — label changes per paymentType; value
                    is masked when privacy_setting is on. */}
                <div className="flex justify-between items-center relative gap-2 mb-2">
                  <label className="whitespace-nowrap !mb-0 text-[13px] leading-[1.2] text-white">
                    {receiverLabel} :
                  </label>
                  <input
                    type="text"
                    className="max-w-[180px] h-8 py-1 px-[10px] pr-[30px] text-[13px] text-[#364153] bg-white border border-[#ced4da] rounded-[6px] opacity-75 placeholder:text-[12px]"
                    value={receiverDisplay}
                    disabled
                    readOnly
                  />
                  <span
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[#364153] cursor-pointer leading-none inline-flex [&_svg]:h-4 [&_svg]:w-auto"
                    role="button"
                    tabIndex={0}
                    onClick={() =>
                      copyToClipboard(selfDepositTx?.receiver_number)
                    }
                  >
                    <Icon name="copyIcon" />
                  </span>
                </div>

                <hr className="opacity-40 my-[10px] border-white" />

                {/* Editable: trxId. */}
                <div className="flex justify-between items-center relative gap-2 mb-2">
                  <label className="whitespace-nowrap !mb-0 text-[13px] leading-[1.2] text-white">
                    {t(
                      'deposit.provideTransactionId',
                      'Please provide the transaction ID.'
                    )}
                  </label>
                  <div className="flex flex-col items-end gap-1 w-full max-w-[180px]">
                    <input
                      type="text"
                      className="w-full h-8 py-1 px-[10px] text-[13px] text-[#364153] bg-white border border-[#ced4da] rounded-[6px] placeholder:text-[12px]"
                      placeholder={t(
                        'deposit.provideTransactionId',
                        'Please provide the transaction ID.'
                      )}
                      value={verifyValues.trxId}
                      onChange={(e) => setVerifyField('trxId', e.target.value)}
                      onBlur={() => markVerifyTouched('trxId')}
                    />
                    {verifyTouched.trxId && verifyErrors.trxIdRequired && (
                      <span className="text-[11px] text-[#ffd6d6] text-left leading-[1.2] self-start">
                        {t(
                          'deposit.provideYourTransactionId',
                          'Please provide your transaction ID.'
                        )}
                      </span>
                    )}
                    {verifyTouched.trxId && verifyErrors.trxIdPattern && (
                      <span className="text-[11px] text-[#ffd6d6] text-left leading-[1.2] self-start">
                        {t(
                          'deposit.invalidTransactionId',
                          'Please enter a valid transaction ID.'
                        )}
                      </span>
                    )}
                  </div>
                </div>

                {/* Editable: senderNumber. */}
                <div className="flex justify-between items-center relative gap-2">
                  <label className="whitespace-nowrap !mb-0 text-[13px] leading-[1.2] text-white">
                    {t('deposit.transactionNumber', 'Enter the transaction number.')}
                  </label>
                  <div className="flex flex-col items-end gap-1 w-full max-w-[180px]">
                    <input
                      type="text"
                      className="w-full h-8 py-1 px-[10px] text-[13px] text-[#364153] bg-white border border-[#ced4da] rounded-[6px] placeholder:text-[12px]"
                      placeholder="017XXXXXXXX"
                      value={verifyValues.senderNumber}
                      onChange={(e) =>
                        setVerifyField('senderNumber', e.target.value)
                      }
                      onBlur={() => markVerifyTouched('senderNumber')}
                    />
                    {verifyTouched.senderNumber &&
                      verifyErrors.senderRequired && (
                        <span className="text-[11px] text-[#ffd6d6] text-left leading-[1.2] self-start">
                          {t(
                            'deposit.enterYourTransactionNumber',
                            'Enter your transaction number.'
                          )}
                        </span>
                      )}
                    {verifyTouched.senderNumber &&
                      verifyErrors.senderPattern && (
                        <span className="text-[11px] text-[#ffd6d6] text-left leading-[1.2] self-start">
                          {t('deposit.kindly', 'Please kindly enter the')}{' '}
                          {selectedMethodName === 'ROCKET'
                            ? t('deposit.12', '12')
                            : t('deposit.11', '11')}{' '}
                          {t(
                            'deposit.roketNumber',
                            'digits transaction number and must start with 0.'
                          )}
                        </span>
                      )}
                  </div>
                </div>
              </div>
            )}

            {isDepositSuccess && isDepositOnePage ? (
              <button
                type="button"
                className="mt-3 w-full py-2 px-3 text-white rounded text-[14px] font-semibold disabled:opacity-65 disabled:cursor-not-allowed"
                style={{ backgroundColor: cardColor }}
                onClick={handleVerifySubmit}
                disabled={onePageVerify.status === 'loading'}
              >
                {t('common.confirm', 'Confirm')}
              </button>
            ) : (
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 mt-3 w-full btn btn-primary text-[14px] font-medium disabled:opacity-65 disabled:cursor-not-allowed [&_i_svg]:h-[18px] [&_i_svg]:w-[18px]"
                disabled={!!promotionLimitError || submitting}
              >
                <Icon name="bkash" />
                <Icon name="nagad" />
                {t('deposit.makePayment', 'Make Payment')}
                <Icon name="rocket" />
                <Icon name="mobileBanking" />
              </button>
            )}
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
                {t('deposit.selectPromotion', 'Select Promotion')}
              </h2>
              <button
                type="button"
                className="bg-transparent border-0 text-white cursor-pointer w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/10 [&_i]:text-[16px]"
                onClick={closePromotionModal}
                aria-label={t('deposit.closePromotions', 'Close promotions')}
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
              {t('common.confirm', 'Confirm')}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
