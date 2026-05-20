import { svgIcons } from '../utils/svgIcons.js'

export default function SvgIcon({ name, className = '', ...rest }) {
  const html = svgIcons[name]
  if (!html) return null
  return (
    <i
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
      aria-hidden={rest.onClick ? undefined : true}
      {...rest}
    />
  )
}
