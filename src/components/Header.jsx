import { NavLink } from 'react-router-dom'

const navTabs = [
  { to: '/highlight', label: 'Home' },
  { to: '/in-play', label: 'In-Play' },
  { to: '/multi-markets', label: 'Multi Markets' },
  { to: '/cricket', label: 'Cricket', badge: 20 },
  { to: '/soccer', label: 'Soccer', badge: 0 },
  { to: '/tennis', label: 'Tennis', badge: 4 },
  { to: '/ipl-winner', label: 'IPL Winner' },
  { to: '/result', label: 'Result' },
]

export default function Header() {
  return (
    <header className="sticky top-0 z-30 shadow-sm">
      <div className="flex items-center gap-4 bg-gradient-to-r from-emerald-700 to-emerald-600 px-4 py-2 text-white">
        <div className="flex h-9 w-12 items-center justify-center rounded bg-white">
          <span className="text-xl font-extrabold tracking-tight text-emerald-700">
            bj
          </span>
        </div>
        <div className="flex flex-1 items-center">
          <div className="relative w-full max-w-md">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              🔍
            </span>
            <input
              type="search"
              placeholder="Search Events"
              className="w-full rounded bg-white py-1.5 pl-8 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span>
            Main <strong>BDT0.00</strong>
          </span>
          <span>
            Exposure <strong>0.00</strong>
          </span>
          <button
            type="button"
            className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-800 hover:bg-emerald-900"
            title="Refresh"
          >
            ⟳
          </button>
          <button
            type="button"
            className="flex items-center gap-1 rounded bg-white px-3 py-1 text-slate-800 hover:bg-slate-100"
          >
            <span>👤</span>
            My Account ▾
          </button>
        </div>
      </div>

      <nav className="flex items-center bg-slate-800 text-white">
        <ul className="flex flex-1 items-stretch">
          {navTabs.map((tab) => (
            <li key={tab.to} className="relative">
              <NavLink
                to={tab.to}
                end={tab.end}
                className={({ isActive }) =>
                  [
                    'flex items-center gap-1 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors',
                    isActive
                      ? 'border-yellow-400 bg-slate-900 text-yellow-300'
                      : 'border-transparent hover:bg-slate-700',
                  ].join(' ')
                }
              >
                {tab.label}
                {tab.badge !== undefined && (
                  <span className="absolute -top-1 right-1 rounded bg-red-600 px-1 text-[10px] font-bold leading-tight text-white">
                    {tab.badge}
                  </span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-2 px-4 text-sm">
          <label className="flex items-center gap-2 border-b-2 border-yellow-400 py-2.5 text-yellow-300">
            <input type="checkbox" className="h-4 w-4 accent-yellow-400" />
            One Click Bet
          </label>
          <button
            type="button"
            className="flex items-center gap-1 py-2.5 hover:text-yellow-300"
          >
            Setting ⚙
          </button>
        </div>
      </nav>
    </header>
  )
}
