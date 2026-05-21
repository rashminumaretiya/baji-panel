import { useTranslation } from 'react-i18next'
import './loader.scss'

const VARIANT_CLASS = {
  inline: 'inline-loader',
  wrapper: 'loader-wrapper',
  fullscreen: 'fullscreen-loader',
  side: 'side-loader',
}

export default function Loader({
  show = true,
  message = 'common.loader.loading',
  fallback = 'Loading...',
  variant,
}) {
  const { t } = useTranslation()
  if (!show) return null
  const inner = (
    <div className="d-flex flex-column pb-3 pt-4 mt-2 loader-inner">
      <div className="user-loader">
        <span />
        <span />
      </div>
      <div className="bet-place">{t(message, fallback)}</div>
    </div>
  )
  const wrapperClass = VARIANT_CLASS[variant]
  if (!wrapperClass) return inner
  return <div className={wrapperClass}>{inner}</div>
}
