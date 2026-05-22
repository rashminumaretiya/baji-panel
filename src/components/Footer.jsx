import { useTranslation } from 'react-i18next'
import SvgIcon from './SvgIcon.jsx'

export default function Footer() {
  const { t } = useTranslation()
  return (
    <footer className="mt-5 mb-10 pt-1.5 [&_svg]:inline-block [&_svg]:mb-1 [&_svg]:h-5 [&_svg]:w-5 [&_svg]:text-[#5f5f5f]">
      <div className="text-center">
        <SvgIcon as="span" name="chromeIcon" />{' '}
        <SvgIcon as="span" name="earthIcon" />{' '}
        <span></span>
      </div>
      <p className="max-w-[400px] mx-auto w-full text-[rgba(var(--black-rgb),0.6)] text-[11px] leading-4 text-center">
        {t('footer.descline')}
      </p>
    </footer>
  )
}
