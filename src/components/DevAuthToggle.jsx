import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  getValidationCode,
  login,
  logout,
  selectIsAuthenticated,
  selectUser,
} from '../store/slices/authSlice.js'
import { selectCaptcha } from '../store/slices/commonSlice.js'

const panelClass =
  'fixed bottom-20 right-2 z-[9999] bg-[rgba(15,23,42,0.92)] text-white px-2.5 py-2 rounded-md text-[12px] font-[system-ui,sans-serif] shadow-[0_4px_14px_rgba(0,0,0,0.25)] flex flex-col gap-1.5 min-w-[200px]'
const rowClass = 'flex items-center gap-1.5'
const inputClass =
  'flex-1 py-[3px] px-1.5 rounded-[3px] border border-[#475569] bg-[#0f172a] text-white text-[12px]'
const btnPrimary =
  'bg-[#22c55e] border-0 text-[#0f172a] py-1 px-2.5 rounded-[4px] font-semibold cursor-pointer text-[12px]'
const btnDanger =
  'bg-[#ef4444] border-0 text-white py-1 px-2.5 rounded-[4px] font-semibold cursor-pointer text-[12px]'
const btnGrey =
  'bg-[#475569] border-0 text-white py-1 px-2.5 rounded-[4px] font-semibold cursor-pointer text-[12px]'

export default function DevAuthToggle() {
  if (import.meta.env.PROD) return null
  return <DevAuthPanel />
}

function DevAuthPanel() {
  const dispatch = useDispatch()
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const user = useSelector(selectUser)
  const captcha = useSelector(selectCaptcha)

  const [form, setForm] = useState({ userName: '', password: '', code: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  
  useEffect(() => {
    if (!isAuthenticated && !captcha) dispatch(getValidationCode())
  }, [isAuthenticated, captcha, dispatch])

  const handleLogin = async () => {
    setError('')
    if (!form.userName || !form.password) {
      setError('username + password required')
      return
    }
    if (captcha?.code && form.code !== captcha.code) {
      setError('captcha mismatch')
      return
    }
    setBusy(true)
    try {
      const result = await dispatch(
        login({ ...form, captchaId: captcha?.captchaId })
      )
      if (!login.fulfilled.match(result) || !result.payload) {
        setError(result.payload?.message ?? 'login failed')
      } else {
        setForm({ userName: '', password: '', code: '' })
      }
    } finally {
      setBusy(false)
    }
  }

  const handleLogout = async () => {
    setBusy(true)
    try {
      await dispatch(logout())
    } finally {
      setBusy(false)
    }
  }

  if (isAuthenticated) {
    return (
      <div className={panelClass} aria-label="dev auth toggle">
        <div className={rowClass}>
          <span>dev:</span>
          <strong className="flex-1">{user?.userName ?? 'user'}</strong>
          <button
            type="button"
            className={btnDanger}
            onClick={handleLogout}
            disabled={busy}
          >
            {busy ? '…' : 'Logout'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={panelClass} aria-label="dev auth toggle">
      <div className={`${rowClass} font-semibold`}>dev login</div>
      <div className={rowClass}>
        <input
          className={inputClass}
          placeholder="username"
          value={form.userName}
          onChange={(e) => setForm((f) => ({ ...f, userName: e.target.value }))}
        />
      </div>
      <div className={rowClass}>
        <input
          className={inputClass}
          type="password"
          placeholder="password"
          value={form.password}
          onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
        />
      </div>
      <div className={rowClass}>
        <input
          className={inputClass}
          placeholder="captcha"
          value={form.code}
          maxLength={4}
          onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
        />
        <span className="font-bold text-[#fbbf24]">{captcha?.code ?? '…'}</span>
      </div>
      {error && <div className="text-[#fca5a5]">{error}</div>}
      <div className={rowClass}>
        <button
          type="button"
          className={btnPrimary}
          onClick={handleLogin}
          disabled={busy}
        >
          {busy ? '…' : 'Login'}
        </button>
        <button
          type="button"
          className={btnGrey}
          onClick={() => dispatch(getValidationCode())}
          disabled={busy}
          title="Refresh captcha"
        >
          ↻
        </button>
      </div>
    </div>
  )
}
