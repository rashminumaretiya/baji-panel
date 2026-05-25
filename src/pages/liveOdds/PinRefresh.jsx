import { memo } from 'react'
import { PinIcon, RefreshIcon } from './icons.jsx'

export const PinRefresh = memo(function PinRefresh({ onRefresh }) {
  const baseDiv =
    'text-white font-bold z-[1] min-w-[90px] flex justify-center items-center h-[25px] leading-[20px] relative max-md:px-3 max-md:py-[6px] max-md:h-[7.46667vw] max-md:leading-tight max-md:text-[3.2vw] max-md:min-w-[25.5vw] [&_i_svg]:h-[14px] [&_i_svg]:w-[14px] max-md:[&_i_svg]:h-[3.73333vw] max-md:[&_i_svg]:w-[3.73333vw] mobile:[&_span]:hidden'

  const firstDiv = `${baseDiv} bg-[var(--text-xl-color)] rounded-bl-[10px] max-md:bg-gradient-to-t max-md:from-[var(--xls-navy)] max-md:to-[var(--xts-light-bg)] max-md:w-[25.5vw] max-md:rounded-bl-[3vw] before:content-[''] before:absolute before:left-[-3px] before:w-[19px] before:bg-[var(--text-xl-color)] before:top-[-4px] before:bottom-[1px] before:-z-[1] before:[transform:rotate(-22deg)] before:rounded-bl-[10px] max-md:before:[transform:rotate(-16deg)] max-md:before:bg-gradient-to-t max-md:before:from-[var(--xs-navy)] max-md:before:to-[var(--xts-md-bg)] max-md:before:rounded-bl-[3vw]`

  const secondDiv = `${baseDiv} bg-[var(--text-xl-color)] shadow-[1px_0_0_0_rgba(255,255,255,0.3)_inset] rounded-br-[10px] max-md:bg-gradient-to-t max-md:from-[var(--xls-navy)] max-md:to-[var(--xts-light-bg)] max-md:rounded-br-[3vw] max-md:border-l-[0.53333vw] max-md:border-l-[rgba(22,40,49,0.9)] after:content-[''] after:absolute after:right-[-3px] after:w-[19px] after:bg-[var(--text-xl-color)] after:top-[-4px] after:bottom-[1px] after:-z-[1] after:rounded-br-[10px] after:[transform:rotate(22deg)] max-md:after:[transform:rotate(16deg)] max-md:after:bg-gradient-to-t max-md:after:from-[var(--xs-navy)] max-md:after:to-[var(--xts-md-bg)] max-md:after:rounded-br-[3vw]`

  return (
    <div className="text-center overflow-hidden bg-white mt-px max-md:bg-(--light-bg) max-md:mt-0">
      <div className="inline-flex items-center relative cursor-pointer">
        <div className={firstDiv}>
          <PinIcon />
        </div>
        <div className={secondDiv} onClick={onRefresh} role="button">
          <RefreshIcon />
        </div>
      </div>
    </div>
  )
})
