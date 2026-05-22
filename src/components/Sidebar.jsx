import { NavLink } from 'react-router-dom'

const sidebarItems = [
  { to: '/sports', label: 'Sports', heading: true },
  { to: '/sports/all', label: 'All Sports' },
  { to: '/cricket', label: 'Cricket' },
  {
    to: '/cricket/west-indies-4-day',
    label: 'West Indies 4-Day Championship',
  },
  {
    to: '/cricket/guyana-vs-tt',
    label: 'Guyana Harpy Eagles v TT Red Force',
    active: true,
  },
  { to: '/cricket/match-odds', label: 'Match Odds', indent: true },
]

export default function Sidebar() {
  return (
    <aside className="h-full w-full overflow-auto bg-[var(--xs-gray)] text-xs text-[var(--dark)]">
      <ul className="flex flex-col">
        {sidebarItems.map((item) => {
          if (item.heading) {
            return (
              <li
                key={item.to}
                className="bg-[var(--primary)] text-white font-semibold px-3 py-2"
              >
                {item.label}
              </li>
            )
          }
          return (
            <li key={item.to} className="p-0">
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  [
                    'block px-3 py-2 border-b border-[var(--light-border)] no-underline',
                    item.indent ? 'pl-6' : '',
                    isActive
                      ? 'bg-[var(--primary)] text-white font-medium'
                      : 'text-[var(--dark)]',
                  ].join(' ')
                }
              >
                {item.indent && (
                  <span
                    className="inline-block mr-2 rounded-full border border-[var(--sm-gray-blue)]"
                    style={{ width: 8, height: 8 }}
                  />
                )}
                {item.label}
              </NavLink>
            </li>
          )
        })}
      </ul>
    </aside>
  )
}
