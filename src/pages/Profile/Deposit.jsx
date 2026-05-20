import { useState } from 'react'
import './deposit.scss'
import { BillIcon, CheckmarkIcon, SendIcon } from './icons.jsx'

export default function Deposit() {
  const [rate] = useState({ from: 'BDT', to: 'BDT', value: 1 })
  const [amount, setAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!amount || submitting) return
    setSubmitting(true)
  }

  return (
    <>
      <div className="page-title d-flex justify-content-between align-items-center">
        <p className="m-0">Deposit</p>
      </div>

      <div className="card rounded p-3">
        <div className="text-center mb-3 p-2 conversation-text">
          1 {rate.from} = {rate.value} {rate.to}
        </div>

        <form className="payment-form" onSubmit={handleSubmit} noValidate>
          <div className="d-flex flex-column">
            <div className="form-group mb-2">
              <label htmlFor="amount" className="asterisk">
                {rate.from} amount
              </label>
              <div>
                <input
                  id="amount"
                  type="number"
                  placeholder="Enter amount"
                  className="form-control"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn mt-3 make-payment"
              disabled={!amount || submitting}
            >
              <SendIcon />
              Make Payment
              <CheckmarkIcon />
              <BillIcon />
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
