import { useState } from 'react'

const sports = [
  { id: 'cricket', label: 'Cricket' },
  { id: 'soccer', label: 'Soccer' },
  { id: 'tennis', label: 'Tennis' },
]

const matches = {
  cricket: [
    {
      name: 'Guyana Harpy Eagles vs TT Red Force',
      status: 'In-Play',
      matched: 'BDT0',
    },
    {
      name: 'Mis-E-Ainak Knights v Boost Defenders',
      status: 'In-Play',
      matched: 'BDT5,755,113.74',
    },
    {
      name: 'Cyprus v Switzerland',
      status: 'In-Play',
      matched: 'BDT13,985,145.48',
    },
    {
      name: 'Slovenia v Guernsey',
      status: 'In-Play',
      matched: 'BDT4,023,893.76',
    },
    {
      name: 'Ghatal Gladiators vs VSP Midnapore Warriors',
      status: 'In-Play',
      matched: 'BDT0',
    },
    {
      name: 'Eastern Elephant Cc v Middle-Belt Tigers Cc',
      status: 'In-Play',
      matched: 'BDT102,298.22',
    },
    {
      name: 'Moravian Cc vs Prague Barbarians',
      status: 'In-Play',
      matched: 'BDT0',
    },
    {
      name: 'Northern Lions Cc v Central Eagles Cc',
      status: '2026-05-20 17:30',
      matched: 'BDT27,168.86',
    },
    {
      name: 'Croatia v Jersey',
      status: '2026-05-20 18:00',
      matched: 'BDT853,623.06',
    },
    {
      name: 'Sweden v Malta',
      status: '2026-05-20 18:00',
      matched: 'BDT243,903.46',
    },
  ],
  soccer: [
    {
      name: 'Manchester United v Liverpool',
      status: 'In-Play',
      matched: 'BDT1,250,000.00',
    },
    {
      name: 'Real Madrid v Barcelona',
      status: '2026-05-20 19:00',
      matched: 'BDT2,400,500.00',
    },
    {
      name: 'PSG v Bayern Munich',
      status: '2026-05-20 21:00',
      matched: 'BDT980,120.50',
    },
  ],
  tennis: [
    {
      name: 'Djokovic v Alcaraz',
      status: 'In-Play',
      matched: 'BDT540,200.00',
    },
    {
      name: 'Swiatek v Sabalenka',
      status: '2026-05-20 17:00',
      matched: 'BDT320,000.00',
    },
  ],
}

export default function Highlights() {
  const [active, setActive] = useState('cricket')
  const rows = matches[active]

  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="overflow-hidden rounded">
        <img
          src="https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1600&q=60"
          alt="Stadium"
          className="h-56 w-full object-cover"
        />
      </div>

      <section className="rounded border border-slate-200 bg-white">
        <header className="flex items-center justify-between bg-emerald-700 px-4 py-2 text-white">
          <h2 className="font-semibold">Sports Highlights</h2>
          <div className="flex items-center gap-2 text-sm">
            <span>View by</span>
            <select className="rounded bg-emerald-800 px-2 py-1 text-white">
              <option>Time</option>
            </select>
          </div>
        </header>

        <div className="flex bg-slate-100">
          {sports.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setActive(s.id)}
              className={[
                'flex-1 border-b-2 px-4 py-2 text-sm font-medium',
                active === s.id
                  ? 'border-emerald-700 bg-white text-emerald-700'
                  : 'border-transparent text-slate-600 hover:bg-slate-200',
              ].join(' ')}
            >
              {s.label}
            </button>
          ))}
        </div>

        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-3 py-2 text-left">Event</th>
              <th className="px-3 py-2 text-right">Matched</th>
              <th className="px-3 py-2 text-center" colSpan={3}>
                1 &nbsp; X &nbsp; 2
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((m) => (
              <tr key={m.name} className="border-t border-slate-100">
                <td className="px-3 py-2">
                  <div className="font-medium text-blue-700">{m.name}</div>
                  <div className="text-xs text-emerald-600">{m.status}</div>
                </td>
                <td className="px-3 py-2 text-right text-slate-600">
                  {m.matched}
                </td>
                <td className="px-1 py-2">
                  <OddsCell />
                </td>
                <td className="px-1 py-2">
                  <OddsCell />
                </td>
                <td className="px-1 py-2">
                  <OddsCell />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}

function OddsCell() {
  return (
    <div className="flex gap-px">
      <div className="h-7 flex-1 bg-sky-300" />
      <div className="h-7 flex-1 bg-pink-300" />
    </div>
  )
}
