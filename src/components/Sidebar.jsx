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
    <aside className="h-full w-full overflow-auto bg-(--xs-gray) text-xs text-(--dark)">
      <ul className="flex flex-col">
        {sidebarItems.map((item) => {
          if (item.heading) {
            return (
              <li
                key={item.to}
                className="bg-(--primary) px-3 py-2 font-semibold text-white"
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
                    'block border-b border-(--light-border) px-3 py-2 no-underline',
                    item.indent ? 'pl-6' : '',
                    isActive
                      ? 'bg-(--primary) font-medium text-white'
                      : 'text-(--dark)',
                  ].join(' ')
                }
              >
                {item.indent && (
                  <span
                    className="mr-2 inline-block rounded-full border border-(--sm-gray-blue)"
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
