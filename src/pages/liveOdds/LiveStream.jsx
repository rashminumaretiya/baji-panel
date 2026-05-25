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
    <div className="relative mx-auto max-w-[500px] pb-0 text-center max-md:max-w-full max-md:overflow-hidden md:mb-3 md:p-2">
      <iframe
        ref={iframeRef}
        className={cx(
          'mx-auto block aspect-video h-auto',
          isPip
            ? 'max-w-[260px] max-md:h-[32vw] max-md:max-w-[54.167vw]'
            : 'max-w-[480px] max-md:w-full max-md:max-w-full'
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
              'close z-[999] flex h-[35px] w-[50px] cursor-pointer items-center justify-center rounded-md border border-(--xxl-gray) bg-black/50 text-white hover:bg-black/60 max-md:h-[8.33333vw] max-md:w-[8.33333vw] [&_svg]:h-[14px] [&_svg]:w-[14px] max-md:[&_svg]:h-[2.73333vw] max-md:[&_svg]:w-[2.73333vw]',
              isPip &&
                '!h-[15px] !w-[15px] !rounded-full max-md:!h-[3.125vw] max-md:!w-[3.125vw]'
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
          className="absolute right-[18px] bottom-[8px] cursor-pointer max-md:right-[16px]"
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
