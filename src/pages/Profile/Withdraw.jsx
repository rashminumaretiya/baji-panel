import { useEffect, useState } from 'react'
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
import './withdraw.scss'

const DEFAULT_LIMITS = { withdrawMinLimit: 300, withdrawMaxLimit: 25000 }

function validate(values, limits) {
  const errors = {}
  const pbuStr = String(values.pbu ?? '').trim()
  if (!pbuStr) errors.pbu = 'Amount is required'
  else if (!onlyDigitsRegex.test(pbuStr)) errors.pbu = 'Enter valid amount'
  else {
    const value = Number(pbuStr)
    if (value < 1) errors.pbu = 'Amount must be greater than 0'
    else if (limits?.withdrawMinLimit && value < limits.withdrawMinLimit)
      errors.pbu = `Amount must be at least ${limits.withdrawMinLimit}`
    else if (limits?.withdrawMaxLimit && value > limits.withdrawMaxLimit)
      errors.pbu = `Amount must not exceed ${limits.withdrawMaxLimit}`
  }
  if (!values.paymentType) errors.paymentType = 'Payment method is required'
  if (!values.currency) errors.currency = 'Currency is required'
  if (!values.accountNumber) errors.accountNumber = 'Account No is required'
  return errors
}

export default function Withdraw({ showTitle = true }) {
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
    limits,
  )
  const submitting = submit.status === 'loading'

  const setField = (key, value) =>
    setValues((prev) => ({ ...prev, [key]: value }))

  const markTouched = (key) =>
    setTouched((prev) => ({ ...prev, [key]: true }))

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
        <div className="page-title d-flex justify-content-between align-items-center">
          <p className="m-0">Withdraw</p>
        </div>
      )}

      <div className="card rounded p-3">
        <form onSubmit={handleSubmit} noValidate>
          <div className="d-flex flex-column">
            <div className="form-group mb-3">
              <label htmlFor="pbu" className="asterisk">
                {values.currency} amount
              </label>
              <div>
                <input
                  id="pbu"
                  type="text"
                  className="form-control"
                  placeholder="Enter amount"
                  value={values.pbu}
                  onChange={(event) => setField('pbu', event.target.value)}
                  onBlur={() => markTouched('pbu')}
                />
                {showError('pbu') && (
                  <span className="error">{errors.pbu}</span>
                )}
              </div>
            </div>

            <div className="form-group mb-3">
              <label htmlFor="paymentMethod" className="asterisk">
                Payment Method
              </label>
              <div className="d-flex payment-methods-cards">
                {paymentMethods.map((method) => {
                  const id = method.value ?? method.id
                  const providerName = method.name ?? method.providerName ?? id
                  const icon = method.img ?? method.icon
                  const checked = values.paymentType === id
                  return (
                    <div className="form-check position-relative" key={id}>
                      <input
                        className="form-check-input"
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
                        className="form-check-label"
                        htmlFor={providerName}
                      >
                        {icon && <img src={icon} alt="method" />}
                        <span className="text-center">{providerName}</span>
                      </label>
                    </div>
                  )
                })}
              </div>
              {showError('paymentType') && (
                <span className="error">{errors.paymentType}</span>
              )}
            </div>

            <div className="form-group mb-3">
              <label htmlFor="paymentType" className="asterisk">
                Currency
              </label>
              <select
                className="form-select"
                value={values.currency}
                onChange={(event) => setField('currency', event.target.value)}
                onBlur={() => markTouched('currency')}
              >
                <option value="" disabled>
                  Select currency
                </option>
                {currencyOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              {showError('currency') && (
                <span className="error">{errors.currency}</span>
              )}
            </div>

            <div className="form-group mb-3">
              <label htmlFor="AccountNo" className="asterisk">
                Account No.{' '}
              </label>
              <div className="">
                {details.data?.accountNumbers?.length ? (
                  <select
                    className="form-select"
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
                    className="form-control"
                    placeholder="Enter account no."
                    value={effectiveAccountNumber}
                    onChange={(event) =>
                      setField('accountNumber', event.target.value)
                    }
                    onBlur={() => markTouched('accountNumber')}
                  />
                )}
                {showError('accountNumber') && (
                  <span className="error">{errors.accountNumber}</span>
                )}
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary make-payment"
              disabled={submitting}
            >
              Withdraw
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
