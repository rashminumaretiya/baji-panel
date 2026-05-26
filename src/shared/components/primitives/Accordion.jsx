import { createContext, useContext, useMemo, useState } from 'react'
import Collapse from './Collapse.jsx'

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
    return Array.isArray(defaultActiveKey)
      ? defaultActiveKey
      : [defaultActiveKey]
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
    onSelect?.(alwaysOpen ? next : (next[0] ?? null))
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
      <div
        className={`accordion-item mb-[15px] max-md:mb-[5.33vw] ${className}`}
      >
        {children}
      </div>
    </ItemContext.Provider>
  )
}

const HEADER_VARIANTS = {
  dark: {
    header: 'bg-(--xts-blue)',
    headerCollapsedShadow: '',
    button: 'text-white px-2.5 font-medium bg-no-repeat bg-right',
    iconOpen: 'bg-[url(/img/square-remove.webp)]',
    iconClosed: 'bg-[url(/img/square-add.webp)]',
  },
  light: {
    header: 'bg-(--xxs-text-color) pl-[7px]',
    headerCollapsedShadow:
      'shadow-[inset_0_2px_0_0_rgba(var(--black-rgb),0.1)]',
    button:
      'text-black pl-[14px] pr-2.5 font-semibold bg-no-repeat bg-left shadow-[0_2px_0_rgba(var(--white-rgb),0.1)]',
    iconOpen: 'bg-[url(/img/collapse_icon.webp)]',
    iconClosed: 'bg-[url(/img/expand_icon.webp)]',
  },
}

function Header({ className = '', children, as: As = 'h2', variant = 'dark' }) {
  const { eventKey } = useContext(ItemContext)
  const { activeKeys, toggle } = useContext(AccordionContext)
  const isOpen = activeKeys.includes(eventKey)
  const v = HEADER_VARIANTS[variant] ?? HEADER_VARIANTS.dark
  const headerShadow = !isOpen ? v.headerCollapsedShadow : ''
  const iconUrl = isOpen ? v.iconOpen : v.iconClosed
  return (
    <As
      className={`accordion-header relative ${v.header} ${headerShadow} ${className}`}
    >
      <button
        type="button"
        onClick={() => toggle(eventKey)}
        aria-expanded={isOpen}
        className={`w-full py-0 text-left text-[12px] leading-[25px] ${v.button} ${iconUrl}`}
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
  return (
    <Collapse in={isOpen}>
      <div className={`accordion-body bg-white p-0 ${className}`}>
        {children}
      </div>
    </Collapse>
  )
}

// Static composition (react-bootstrap parity).
Accordion.Item = Item
Accordion.Header = Header
Accordion.Body = Body

export default Accordion
