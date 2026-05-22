import { Children, cloneElement, createContext, isValidElement, useContext, useMemo, useState } from 'react'

// Hand-rolled drop-in for react-bootstrap's Accordion. Supports the same
// composition pattern used in the codebase:
//   <Accordion defaultActiveKey="X" alwaysOpen={false}>
//     <Accordion.Item eventKey="X">
//       <Accordion.Header>...</Accordion.Header>
//       <Accordion.Body>...</Accordion.Body>
//     </Accordion.Item>
//   </Accordion>

const AccordionContext = createContext({ activeKeys: [], toggle: () => {} })
const ItemContext = createContext({ eventKey: null })

function Accordion({
  defaultActiveKey,
  activeKey,
  onSelect,
  alwaysOpen = false,
  children,
  className = '',
}) {
  const [uncontrolled, setUncontrolled] = useState(() => {
    if (defaultActiveKey == null) return []
    return Array.isArray(defaultActiveKey) ? defaultActiveKey : [defaultActiveKey]
  })

  const controlled = activeKey != null
  const activeKeys = useMemo(() => {
    if (!controlled) return uncontrolled
    return Array.isArray(activeKey) ? activeKey : [activeKey]
  }, [controlled, activeKey, uncontrolled])

  const toggle = (key) => {
    const isOpen = activeKeys.includes(key)
    let next
    if (alwaysOpen) {
      next = isOpen ? activeKeys.filter((k) => k !== key) : [...activeKeys, key]
    } else {
      next = isOpen ? [] : [key]
    }
    if (!controlled) setUncontrolled(next)
    onSelect?.(alwaysOpen ? next : next[0] ?? null)
  }

  return (
    <AccordionContext.Provider value={{ activeKeys, toggle }}>
      <div className={`accordion ${className}`}>{children}</div>
    </AccordionContext.Provider>
  )
}

function Item({ eventKey, className = '', children }) {
  return (
    <ItemContext.Provider value={{ eventKey }}>
      <div className={`accordion-item mb-[15px] max-mobile:mb-[5.33vw] ${className}`}>{children}</div>
    </ItemContext.Provider>
  )
}

function Header({ className = '', children, as: As = 'h2' }) {
  const { eventKey } = useContext(ItemContext)
  const { activeKeys, toggle } = useContext(AccordionContext)
  const isOpen = activeKeys.includes(eventKey)
  return (
    <As className={`accordion-header relative bg-[var(--light-navy)] ${className}`}>
      <button
        type="button"
        onClick={() => toggle(eventKey)}
        aria-expanded={isOpen}
        className={`w-full text-left text-white px-2.5 py-0 leading-[25px] text-[12px] font-medium bg-no-repeat bg-right ${
          isOpen ? 'bg-[url(/img/square-remove.png)]' : 'bg-[url(/img/square-add.png)]'
        }`}
      >
        {children}
      </button>
    </As>
  )
}

function Body({ className = '', children }) {
  const { eventKey } = useContext(ItemContext)
  const { activeKeys } = useContext(AccordionContext)
  const isOpen = activeKeys.includes(eventKey)
  if (!isOpen) return null
  return <div className={`accordion-body p-0 ${className}`}>{children}</div>
}

// Static composition (react-bootstrap parity).
Accordion.Item = Item
Accordion.Header = Header
Accordion.Body = Body

export default Accordion
