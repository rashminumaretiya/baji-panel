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
    <div className="flex h-[115px] w-[190px] flex-col items-center justify-center rounded-[10px] bg-white px-5 pt-10 pb-5 shadow-[0_5px_10px_rgba(var(--black-rgb),0.5)]">
      <div className="relative mx-auto mt-[15px] w-10">
        <span className="absolute bottom-0 z-[5] block h-5 w-5 animate-[yellow-circle_0.6s_infinite_ease-in-out] rounded-full bg-(--primary-yellow)" />
        <span className="absolute bottom-0 left-1/2 block h-5 w-5 animate-[blue-circle_0.6s_infinite_ease-in-out] rounded-full bg-(--xxl-blue)" />
      </div>
      <div
        className={
          isSide
            ? 'mt-3 text-center text-[11px] text-white'
            : 'mt-[5px] text-[11px] text-(--xxl-blue)'
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
