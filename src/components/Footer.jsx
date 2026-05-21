import { useTranslation } from 'react-i18next'
import SvgIcon from './SvgIcon.jsx'
import './footer.scss'

export default function Footer() {
  const { t } = useTranslation()
  return (
    <footer>
      <div className="text-center">
        <SvgIcon as="span" name="chromeIcon" />{' '}
        <SvgIcon as="span" name="earthIcon" />{' '}
        <span></span>
      </div>
      <p className="text">{t('footer.descline')}</p>
    </footer>
  )
}
