import { useTranslation } from 'react-i18next'

const VARIANT_WRAPPER = {
  inline: 'absolute inset-0 z-[999] flex items-center justify-center',
  wrapper: 'absolute inset-0 z-[999] flex items-center justify-center',
  fullscreen: 'fixed inset-0 z-[9999] flex items-center justify-center',
  side: 'absolute inset-0 z-[999] flex items-center justify-center',
}

export default function Loader({
  show = true,
  message = 'common.loader.loading',
  fallback = 'Loading...',
  variant,
}) {
  const { t } = useTranslation()
  if (!show) return null

  const isSide = variant === 'side'

  const inner = (
    <div className="flex flex-col items-center justify-center bg-white shadow-[0_5px_10px_rgba(var(--black-rgb),0.5)] rounded-[10px] px-5 pt-10 pb-5 h-[115px] w-[190px]">
      <div className="relative w-10 mx-auto mt-[15px]">
        <span className="block absolute bottom-0 w-5 h-5 rounded-full bg-[var(--primary-yellow)] z-[5] animate-[yellow-circle_0.6s_infinite_ease-in-out]" />
        <span className="block absolute bottom-0 w-5 h-5 rounded-full bg-[var(--xxl-blue)] left-1/2 animate-[blue-circle_0.6s_infinite_ease-in-out]" />
      </div>
      <div
        className={
          isSide
            ? 'text-white mt-3 text-center text-[11px]'
            : 'text-[var(--xxl-blue)] mt-[5px] text-[11px]'
        }
      >
        {t(message, fallback)}
      </div>
    </div>
  )

  const wrapperClass = VARIANT_WRAPPER[variant]
  if (!wrapperClass) return inner
  return <div className={wrapperClass}>{inner}</div>
}
