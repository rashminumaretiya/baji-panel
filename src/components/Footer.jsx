import { useTranslation } from 'react-i18next'
import SvgIcon from './SvgIcon.jsx'

export default function Footer() {
  const { t } = useTranslation()
  return (
    <footer className="mt-5 mb-10 pt-1.5 [&_svg]:mb-1 [&_svg]:inline-block [&_svg]:h-5 [&_svg]:w-5 [&_svg]:text-[#5f5f5f]">
      <div className="text-center">
        <SvgIcon as="span" name="chromeIcon" />{' '}
        <SvgIcon as="span" name="earthIcon" /> <span></span>
      </div>
      <p className="mx-auto w-full max-w-[400px] text-center text-[11px] leading-4 text-[rgba(var(--black-rgb),0.6)]">
        {t('footer.descline')}
      </p>
    </footer>
  )
}
