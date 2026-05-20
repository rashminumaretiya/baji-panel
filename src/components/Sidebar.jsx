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
    <aside className="flex h-full w-full flex-col overflow-y-auto bg-slate-50 text-sm text-slate-800">
      <ul>
        {sidebarItems.map((item) => {
          if (item.heading) {
            return (
              <li
                key={item.to}
                className="bg-emerald-700 px-4 py-2 font-semibold text-white"
              >
                {item.label}
              </li>
            )
          }
          return (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  [
                    'block border-b border-slate-200 px-4 py-2',
                    item.indent ? 'pl-6' : '',
                    isActive
                      ? 'bg-emerald-700 font-medium text-white'
                      : 'hover:bg-slate-100',
                  ].join(' ')
                }
              >
                {item.indent && (
                  <span className="mr-2 inline-block h-2 w-2 rounded-full border border-slate-400" />
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
