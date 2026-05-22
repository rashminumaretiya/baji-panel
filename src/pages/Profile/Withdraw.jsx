import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import {
  createCatopayWithdrawRequest,
  createWithdrawRequest,
  fetchWithdrawDetails,
  resetWithdrawRequest,
  selectWithdrawDetails,
  selectWithdrawRequest,
} from '../../store/slices/accountSlice.js'
import { selectCurrency } from '../../store/slices/authSlice.js'
import {
  CURRENCY_TYPE,
  WITHDRAW_PAYMENT_METHODS,
  onlyDigitsRegex,
} from '../../shared/types/common.js'

const DEFAULT_LIMITS = { withdrawMinLimit: 300, withdrawMaxLimit: 25000 }

// Tailwind class strings ported from withdraw.scss.
// `.form-group label` — 14px / 3px gap.
const formLabelClass = 'block text-[14px] mb-[3px]'
const formLabelRequiredClass = `${formLabelClass} after:content-['*'] after:text-red-500 after:ml-1`
const formControlClass =
  'block w-full px-3 py-[6px] text-[14px] leading-[1.5] text-[#212529] bg-white border border-[#ced4da] rounded focus:outline-none focus:border-[var(--light-gray)]'
// `.form-select` — padding 4 12 / 14px font.
const formSelectClass =
  'block w-full px-3 py-[4px] text-[14px] leading-[1.5] text-[#212529] bg-white border border-[#ced4da] rounded focus:outline-none focus:border-[var(--light-gray)] appearance-none bg-no-repeat bg-[position:right_0.75rem_center] bg-[length:16px_12px] bg-[url("data:image/svg+xml,%3csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20viewBox=%270%200%2016%2016%27%3e%3cpath%20fill=%27none%27%20stroke=%27%23343a40%27%20stroke-linecap=%27round%27%20stroke-linejoin=%27round%27%20stroke-width=%272%27%20d=%27M2%205l6%206%206-6%27/%3e%3c/svg%3e")] pr-9'
const errorTextClass = 'block text-[12px] text-[var(--red)] mt-1'

// `.payment-methods-cards` — flex w/ 10px gap (4px on mobile).
const paymentMethodsCardsClass = 'flex gap-[10px] max-md:gap-[4px]'

// `.form-check` — relative 100px box (33.33%-2.666 on mobile), absolute
// invisible <input>, padded <label> with column flex layout.
const formCheckClass =
  'relative mb-0 w-[100px] pl-0 max-md:w-[calc(33.33%-2.666px)]'
const formCheckInputClass =
  'absolute top-0 left-0 w-full h-full m-0 cursor-pointer bg-transparent rounded-[5px] border border-[#262626] shadow-none appearance-none checked:border-[var(--primary-yellow)]'
const formCheckLabelClass =
  'flex flex-col justify-center mb-0 p-2 rounded-[5px] whitespace-nowrap max-md:bg-[#262626] max-md:p-[1.86vw] max-md:rounded-[1.163vw]'
const formCheckImgClass =
  'h-10 w-10 mx-auto max-md:w-[9.302vw] max-md:h-[9.302vw]'
const formCheckSpanClass =
  'text-[14px] mt-[5px] block max-md:text-[3.256vw] max-md:mt-[1.163vw]'

// Make Payment / Withdraw submit button (matches Deposit's `.make-payment`).
const withdrawBtnClass =
  'inline-flex items-center justify-center gap-2 mt-3 w-full btn btn-primary py-2! text-[14px] font-medium disabled:opacity-65 disabled:cursor-not-allowed [&_i_svg]:h-[18px] [&_i_svg]:w-[18px]'

// Validation returns i18n key + interpolation args rather than baked strings,
// so the JSX can hand them to `t()` at render time with the active language.
function validate(values, limits) {
  const errors = {}
  const pbuStr = String(values.pbu ?? '').trim()
  if (!pbuStr) {
    errors.pbu = {
      key: 'withdraw.amountRequired',
      fallback: 'Amount is required',
    }
  } else if (!onlyDigitsRegex.test(pbuStr)) {
    errors.pbu = {
      key: 'withdraw.amountInvalid',
      fallback: 'Enter valid amount',
    }
  } else {
    const value = Number(pbuStr)
    if (value < 1) {
      errors.pbu = {
        key: 'withdraw.amountGtZero',
        fallback: 'Amount must be greater than 0',
      }
    } else if (limits?.withdrawMinLimit && value < limits.withdrawMinLimit) {
      errors.pbu = {
        key: 'withdraw.amountMinValue',
        fallback: 'Amount must be at least {{min}}',
        opts: { min: limits.withdrawMinLimit },
      }
    } else if (limits?.withdrawMaxLimit && value > limits.withdrawMaxLimit) {
      errors.pbu = {
        key: 'withdraw.amountMaxValue',
        fallback: 'Amount must not exceed {{max}}',
        opts: { max: limits.withdrawMaxLimit },
      }
    }
  }
  if (!values.paymentType) {
    errors.paymentType = {
      key: 'withdraw.paymentMethodRequired',
      fallback: 'Payment method is required',
    }
  }
  if (!values.currency) {
    errors.currency = {
      key: 'withdraw.currencyRequired',
      fallback: 'Currency is required',
    }
  }
  if (!values.accountNumber) {
    errors.accountNumber = {
      key: 'withdraw.accountNumberRequired',
      fallback: 'Account No is required',
    }
  }
  return errors
}

export default function Withdraw({ showTitle = true }) {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const userCurrency = useSelector(selectCurrency) || CURRENCY_TYPE.BDT
  const details = useSelector(selectWithdrawDetails)
  const submit = useSelector(selectWithdrawRequest)

  const limits = {
    withdrawMinLimit:
      details.data?.withdrawMinLimit ?? DEFAULT_LIMITS.withdrawMinLimit,
    withdrawMaxLimit:
      details.data?.withdrawMaxLimit ?? DEFAULT_LIMITS.withdrawMaxLimit,
  }
  const paymentGateway = details.data?.swRequestGateway?.paymentGateway || ''
  const paymentMethods = details.data?.swRequestGateway?.methods?.length
    ? details.data.swRequestGateway.methods
    : WITHDRAW_PAYMENT_METHODS

  // Currency picker: BDT-only wallets see ['BDT'], else all CURRENCY_TYPE values
  // (mirrors Angular's `CURRENCY_TYPE: this.currency() === 'BDT' ? ['BDT'] : Object.values(CURRENCY_TYPE)`).
  const currencyOptions =
    userCurrency === CURRENCY_TYPE.BDT
      ? [CURRENCY_TYPE.BDT]
      : Object.values(CURRENCY_TYPE)

  const [values, setValues] = useState({
    pbu: '',
    paymentType: '',
    currency: CURRENCY_TYPE.BDT,
    accountNumber: '',
  })
  const [touched, setTouched] = useState({})

  useEffect(() => {
    dispatch(fetchWithdrawDetails())
    return () => {
      dispatch(resetWithdrawRequest())
    }
  }, [dispatch])

  // Account-number defaults: derived (not synced via effect) so we don't
  // violate React's "you might not need an effect" rule. The user's selection
  // wins; otherwise fall back to the first account from the API.
  const firstAccount = details.data?.accountNumbers?.[0] || ''
  const effectiveAccountNumber = values.accountNumber || firstAccount

  // Reset form on a successful withdraw request. Effect is legitimate here —
  // there's no derivation that can "clear" form state back to defaults.
  useEffect(() => {
    if (submit.status === 'succeeded') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setValues({
        pbu: '',
        paymentType: '',
        currency: CURRENCY_TYPE.BDT,
        accountNumber: '',
      })
      setTouched({})
      dispatch(resetWithdrawRequest())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submit.status])

  const errors = validate(
    { ...values, accountNumber: effectiveAccountNumber },
    limits
  )
  const submitting = submit.status === 'loading'

  const setField = (key, value) =>
    setValues((prev) => ({ ...prev, [key]: value }))

  const markTouched = (key) => setTouched((prev) => ({ ...prev, [key]: true }))

  const handleSubmit = (event) => {
    event.preventDefault()
    setTouched({
      pbu: true,
      paymentType: true,
      currency: true,
      accountNumber: true,
    })
    if (Object.keys(errors).length || submitting) return

    // api.mcv88.live's `/sw-request` validator expects the field name
    // `amount`. baji-exchange-frontend keeps the form-control as `pbu`
    // and ships it as-is — but their backend accepts that. We rename
    // here so the body matches what this backend requires.
    const payload = {
      amount: Number(values.pbu),
      paymentType: values.paymentType,
      currency: values.currency,
      accountNumber: effectiveAccountNumber,
    }

    // Match Angular: catopay gateway → /catopay/refund, else → /sw-request.
    if (paymentGateway === 'catopay') {
      dispatch(createCatopayWithdrawRequest(payload))
    } else {
      dispatch(createWithdrawRequest(payload))
    }
  }

  const showError = (key) => touched[key] && errors[key]

  return (
    <>
      {showTitle && (
        <div className="flex justify-between items-center">
          <p className="text-[#1e1e1e] font-bold text-[13px] leading-5 pt-1.5 mb-1.5">
            {t('common.withdraw', 'Withdraw')}
          </p>
        </div>
      )}

      <div className="bg-white border border-[rgba(0,0,0,0.125)] rounded p-3">
        <form onSubmit={handleSubmit} noValidate>
          <div className="flex flex-col">
            <div className="mb-3">
              <label htmlFor="pbu" className={formLabelRequiredClass}>
                {values.currency} {t('common.amount', 'Amount').toLowerCase()}
              </label>
              <div>
                <input
                  id="pbu"
                  type="text"
                  className={formControlClass}
                  placeholder={t('withdraw.enterAmount', 'Enter amount')}
                  value={values.pbu}
                  onChange={(event) => setField('pbu', event.target.value)}
                  onBlur={() => markTouched('pbu')}
                />
                {showError('pbu') && (
                  <span className={errorTextClass}>
                    {t(errors.pbu.key, {
                      ...(errors.pbu.opts || {}),
                      defaultValue: errors.pbu.fallback,
                    })}
                  </span>
                )}
              </div>
            </div>

            <div className="mb-3">
              <label htmlFor="paymentMethod" className={formLabelRequiredClass}>
                {t('common.paymentMethod', 'Payment Method')}
              </label>
              <div className={paymentMethodsCardsClass}>
                {paymentMethods.map((method) => {
                  const id = method.value ?? method.id
                  const providerName = method.name ?? method.providerName ?? id
                  const icon = method.img ?? method.icon
                  const checked = values.paymentType === id
                  return (
                    <div className={formCheckClass} key={id}>
                      <input
                        className={formCheckInputClass}
                        type="radio"
                        name="paymentType"
                        id={providerName}
                        value={id}
                        checked={checked}
                        onChange={() => {
                          setField('paymentType', id)
                          markTouched('paymentType')
                        }}
                      />
                      <label
                        className={formCheckLabelClass}
                        htmlFor={providerName}
                      >
                        {icon && (
                          <img
                            src={icon}
                            alt="method"
                            className={formCheckImgClass}
                          />
                        )}
                        <span className={`${formCheckSpanClass} text-center`}>
                          {providerName}
                        </span>
                      </label>
                    </div>
                  )
                })}
              </div>
              {showError('paymentType') && (
                <span className={errorTextClass}>
                  {t(errors.paymentType.key, {
                    defaultValue: errors.paymentType.fallback,
                  })}
                </span>
              )}
            </div>

            <div className="mb-3">
              <label htmlFor="paymentType" className={formLabelRequiredClass}>
                {t('common.currency', 'Currency')}
              </label>
              <select
                className={formSelectClass}
                value={values.currency}
                onChange={(event) => setField('currency', event.target.value)}
                onBlur={() => markTouched('currency')}
              >
                <option value="" disabled>
                  {t('withdraw.selectCurrency', 'Select currency')}
                </option>
                {currencyOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              {showError('currency') && (
                <span className={errorTextClass}>
                  {t(errors.currency.key, {
                    defaultValue: errors.currency.fallback,
                  })}
                </span>
              )}
            </div>

            <div className="mb-3">
              <label htmlFor="AccountNo" className={formLabelRequiredClass}>
                {t('common.accountNo', 'Account No.')}
              </label>
              <div>
                {details.data?.accountNumbers?.length ? (
                  <select
                    className={formSelectClass}
                    value={effectiveAccountNumber}
                    onChange={(event) =>
                      setField('accountNumber', event.target.value)
                    }
                    onBlur={() => markTouched('accountNumber')}
                  >
                    {details.data.accountNumbers.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    id="accountNumber"
                    type="text"
                    className={formControlClass}
                    placeholder={t(
                      'withdraw.enterAccountNo',
                      'Enter account no.'
                    )}
                    value={effectiveAccountNumber}
                    onChange={(event) =>
                      setField('accountNumber', event.target.value)
                    }
                    onBlur={() => markTouched('accountNumber')}
                  />
                )}
                {showError('accountNumber') && (
                  <span className={errorTextClass}>
                    {t(errors.accountNumber.key, {
                      defaultValue: errors.accountNumber.fallback,
                    })}
                  </span>
                )}
              </div>
            </div>

            <button
              type="submit"
              className={withdrawBtnClass}
              disabled={submitting}
            >
              {t('common.withdraw', 'Withdraw')}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
