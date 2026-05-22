import { svgIcons } from '../utils/svgIcons.js'

export default function SvgIcon({
  name,
  as: Tag = 'i',
  className = '',
  ...rest
}) {
  const html = svgIcons[name]
  if (!html) return null
  return (
    <Tag
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
      aria-hidden={rest.onClick ? undefined : true}
      {...rest}
    />
  )
}
