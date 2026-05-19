// Dev-only auth toggle. Returns null in production so the widget never ships.
// Uses the real Angular-style flow: getValidationCode → login (POST /auth/sign-in)
// when logging in, and logout (POST /auth/logout) on the way out.
import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { environment } from '../environments/environment.js'
import {
  getValidationCode,
  login,
  logout,
  selectIsAuthenticated,
  selectUser,
} from '../store/slices/authSlice.js'

const panelStyle = {
  position: 'fixed',
  bottom: 12,
  right: 12,
  zIndex: 9999,
  background: 'rgba(15, 23, 42, 0.92)',
  color: '#fff',
  padding: '8px 10px',
  borderRadius: 6,
  fontSize: 12,
  fontFamily: 'system-ui, sans-serif',
  boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  minWidth: 200,
}

const rowStyle = { display: 'flex', alignItems: 'center', gap: 6 }
const inputStyle = {
  flex: 1,
  padding: '3px 6px',
  borderRadius: 3,
  border: '1px solid #475569',
  background: '#0f172a',
  color: '#fff',
  fontSize: 12,
}
const btnStyle = {
  background: '#22c55e',
  border: 'none',
  color: '#0f172a',
  padding: '4px 10px',
  borderRadius: 4,
  fontWeight: 600,
  cursor: 'pointer',
  fontSize: 12,
}
const btnDanger = { ...btnStyle, background: '#ef4444', color: '#fff' }

export default function DevAuthToggle() {
  if (environment.server !== 'development') return null
  return <DevAuthPanel />
}

function DevAuthPanel() {
  const dispatch = useDispatch()
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const user = useSelector(selectUser)
  const captcha = useSelector((s) => s.common.captcha)

  const [form, setForm] = useState({ userName: '', password: '', code: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  // Mirror Angular's effect: when not authenticated, ensure a captcha is loaded.
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
        login({ ...form, captchaId: captcha?.captchaId }),
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
      <div style={panelStyle} aria-label="dev auth toggle">
        <div style={rowStyle}>
          <span>dev:</span>
          <strong style={{ flex: 1 }}>{user?.userName ?? 'user'}</strong>
          <button
            type="button"
            style={btnDanger}
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
    <div style={panelStyle} aria-label="dev auth toggle">
      <div style={{ ...rowStyle, fontWeight: 600 }}>dev login</div>
      <div style={rowStyle}>
        <input
          style={inputStyle}
          placeholder="username"
          value={form.userName}
          onChange={(e) => setForm((f) => ({ ...f, userName: e.target.value }))}
        />
      </div>
      <div style={rowStyle}>
        <input
          style={inputStyle}
          type="password"
          placeholder="password"
          value={form.password}
          onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
        />
      </div>
      <div style={rowStyle}>
        <input
          style={inputStyle}
          placeholder="captcha"
          value={form.code}
          maxLength={4}
          onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
        />
        <span style={{ color: '#fbbf24', fontWeight: 700 }}>
          {captcha?.code ?? '…'}
        </span>
      </div>
      {error && <div style={{ color: '#fca5a5' }}>{error}</div>}
      <div style={rowStyle}>
        <button
          type="button"
          style={btnStyle}
          onClick={handleLogin}
          disabled={busy}
        >
          {busy ? '…' : 'Login'}
        </button>
        <button
          type="button"
          style={{ ...btnStyle, background: '#475569', color: '#fff' }}
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
