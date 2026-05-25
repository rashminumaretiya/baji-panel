import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { cx } from './helpers.js'
import { CloseIcon, FullscreenIcon } from './icons.jsx'

export const LiveStream = memo(function LiveStream({
  url,
  iframeRef,
  onClose,
  onFullscreen,
  hideClose,
  isPip,
}) {
  const { t } = useTranslation()
  if (!url) return null
  return (
    <div className="relative max-w-[500px] mx-auto text-center md:mb-3 md:p-2 pb-0 max-md:max-w-full max-md:overflow-hidden">
      <iframe
        ref={iframeRef}
        className={cx(
          'mx-auto h-auto block aspect-video',
          isPip
            ? 'max-w-[260px] max-md:max-w-[54.167vw] max-md:h-[32vw]'
            : 'max-w-[480px] max-md:max-w-full max-md:w-full'
        )}
        src={url}
        width="100%"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share;"
        allowFullScreen
        title={t('common.liveStream', 'Live stream')}
      />
      {!hideClose && (
        <div
          className={cx(
            'absolute top-[15px] right-[15px] max-[991px]:right-0',
            isPip &&
              'top-[5px] right-[5px] max-md:top-[1.042vw] max-md:right-[1.042vw]'
          )}
        >
          <i
            className={cx(
              'close cursor-pointer h-[35px] w-[50px] bg-black/50 rounded-md border border-[var(--xxl-gray)] flex items-center justify-center z-[999] text-white hover:bg-black/60 [&_svg]:h-[14px] [&_svg]:w-[14px] max-md:h-[8.33333vw] max-md:w-[8.33333vw] max-md:[&_svg]:h-[2.73333vw] max-md:[&_svg]:w-[2.73333vw]',
              isPip &&
                '!rounded-full !h-[15px] !w-[15px] max-md:!h-[3.125vw] max-md:!w-[3.125vw]'
            )}
            onClick={onClose}
            role="button"
            aria-label={t('common.close', 'Close')}
          >
            <CloseIcon />
          </i>
        </div>
      )}
      <div>
        <i
          className="absolute right-[18px] bottom-[8px] max-md:right-[16px] cursor-pointer"
          onClick={onFullscreen}
          role="button"
          aria-label={t('common.fullscreen', 'Fullscreen')}
        >
          <FullscreenIcon />
        </i>
      </div>
    </div>
  )
})
