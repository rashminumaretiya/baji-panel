// Hand-rolled drop-in for react-bootstrap's ListGroup. Only the subset used in
// the codebase is supported.
function ListGroup({ as: As = 'ul', className = '', children, ...rest }) {
  return (
    <As className={`flex flex-col rounded-md overflow-hidden ${className}`} {...rest}>
      {children}
    </As>
  )
}

function Item({
  as: As = 'li',
  action = false,
  active = false,
  className = '',
  children,
  ...rest
}) {
  const base = 'px-3 py-2 border-b border-[var(--light-border)] last:border-b-0 bg-white'
  const interactive = action ? 'cursor-pointer hover:bg-[var(--hover-bg)]' : ''
  const activeCls = active ? 'bg-[var(--primary)] text-white' : ''
  return (
    <As className={`${base} ${interactive} ${activeCls} ${className}`} {...rest}>
      {children}
    </As>
  )
}

ListGroup.Item = Item

export default ListGroup
