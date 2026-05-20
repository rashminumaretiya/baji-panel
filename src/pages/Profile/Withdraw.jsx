import { useState } from 'react'
import './withdraw.scss'

const DEFAULT_BALANCE = 0
const ONLY_DIGITS = /^\d+$/

const paymentMethods = [
  { id: 'BKASH', providerName: 'bkash', icon: '/img/payment/BKash_logo.svg' },
  { id: 'NAGAD', providerName: 'nagad', icon: '/img/payment/nagad.webp' },
  { id: 'ROCKET', providerName: 'rocket', icon: '/img/payment/rocket.webp' },
]

const currencies = [
  { label: 'BDT', value: 'BDT' },
  { label: 'INR', value: 'INR' },
  { label: 'USD', value: 'USD' },
]

function validate(values, limits, balance) {
  const errors = {}
  const amountStr = String(values.amount ?? '').trim()
  if (!amountStr) errors.amount = 'Amount is required'
  else if (!ONLY_DIGITS.test(amountStr)) errors.amount = 'Amount is invalid'
  else {
    const value = Number(amountStr)
    if (limits?.withdrawMinLimit && value < limits.withdrawMinLimit)
      errors.amount = `Amount must be at least ${limits.withdrawMinLimit}`
    const maxLimit = limits?.withdrawMaxLimit
    const maxAllowed = maxLimit
      ? Math.min(maxLimit, balance || maxLimit)
      : balance || null
    if (maxAllowed && value > maxAllowed)
      errors.amount = `Amount must not exceed ${maxAllowed}`
  }
  if (!values.paymentType) errors.paymentType = 'Payment Method is required'
  if (!values.currency) errors.currency = 'Currency is required'
  if (!values.accountNumber) errors.accountNumber = 'Account No is required'
  return errors
}

export default function Withdraw({
  currency = 'BDT',
  showTitle = true,
  balance = DEFAULT_BALANCE,
  limits = null,
  quickAmounts = [],
}) {
  const [values, setValues] = useState({
    amount: '',
    paymentType: '',
    currency,
    accountNumber: '',
  })
  const [touched, setTouched] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const errors = validate(values, limits, balance)

  const setField = (key, value) =>
    setValues((prev) => ({ ...prev, [key]: value }))

  const markTouched = (key) =>
    setTouched((prev) => ({ ...prev, [key]: true }))

  const setAmount = (quickAmount) => {
    const current = Number(values.amount || 0)
    setField('amount', String(current + quickAmount))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    setTouched({
      amount: true,
      paymentType: true,
      currency: true,
      accountNumber: true,
    })
    if (Object.keys(errors).length || submitting) return
    setSubmitting(true)
    setTimeout(() => setSubmitting(false), 800)
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
              {quickAmounts?.length > 0 && (
                <div className="d-flex flex-wrap mb-3 gap-1 justify-content-md-start amount-buttons">
                  {quickAmounts.map((quickAmount) => (
                    <button
                      type="button"
                      key={quickAmount}
                      className="btn btn-outline-primary"
                      onClick={() => setAmount(quickAmount)}
                    >
                      +{quickAmount}
                    </button>
                  ))}
                </div>
              )}

              <div className="d-flex align-items-center justify-content-between mb-1">
                <label htmlFor="amount" className="asterisk">
                  {currency} amount
                </label>
                {limits?.withdrawMinLimit && limits?.withdrawMaxLimit && (
                  <span className="fw-bold">
                    Min: {limits.withdrawMinLimit} | Max: {limits.withdrawMaxLimit}
                  </span>
                )}
              </div>

              <input
                id="amount"
                type="text"
                className="form-control"
                placeholder="Enter amount"
                value={values.amount}
                onChange={(event) => setField('amount', event.target.value)}
                onBlur={() => markTouched('amount')}
              />
              {showError('amount') && <span className="error">{errors.amount}</span>}
            </div>

            <div className="form-group mb-3">
              <label className="asterisk">Payment Method</label>
              <div className="d-flex payment-methods-cards">
                {paymentMethods.map((method) => {
                  const checked = values.paymentType === method.id
                  return (
                    <div className="form-check position-relative" key={method.id}>
                      <input
                        className="form-check-input"
                        type="radio"
                        name="paymentType"
                        id={method.providerName}
                        value={method.id}
                        checked={checked}
                        onChange={() => {
                          setField('paymentType', method.id)
                          markTouched('paymentType')
                        }}
                      />
                      <label className="form-check-label" htmlFor={method.providerName}>
                        <img src={method.icon} alt={method.providerName} />
                        <span className="text-center">{method.providerName}</span>
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
              <label htmlFor="currency" className="asterisk">
                Currency
              </label>
              <select
                id="currency"
                className="form-select"
                value={values.currency}
                onChange={(event) => setField('currency', event.target.value)}
                onBlur={() => markTouched('currency')}
              >
                <option value="" disabled>
                  Select currency
                </option>
                {currencies.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {showError('currency') && <span className="error">{errors.currency}</span>}
            </div>

            <div className="form-group my-1">
              <label htmlFor="accountNumber" className="asterisk">
                Account No.
              </label>
              <input
                id="accountNumber"
                type="text"
                className="form-control"
                placeholder="Enter account no."
                value={values.accountNumber}
                onChange={(event) => setField('accountNumber', event.target.value)}
                onBlur={() => markTouched('accountNumber')}
              />
              {showError('accountNumber') && (
                <span className="error">{errors.accountNumber}</span>
              )}
            </div>

            <button
              type="submit"
              className="btn withdraw-submit mt-3"
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
