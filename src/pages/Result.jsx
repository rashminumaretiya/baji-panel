const results = [
  {
    date: '2026-05-19',
    event: 'India v Australia',
    market: 'Match Odds',
    winner: 'India',
    pl: '+1,250.00',
  },
  {
    date: '2026-05-19',
    event: 'England v South Africa',
    market: 'Match Odds',
    winner: 'South Africa',
    pl: '-500.00',
  },
  {
    date: '2026-05-18',
    event: 'Manchester United v Liverpool',
    market: 'Match Odds',
    winner: 'Liverpool',
    pl: '+800.00',
  },
  {
    date: '2026-05-18',
    event: 'Djokovic v Alcaraz',
    market: 'Set Winner',
    winner: 'Djokovic',
    pl: '+340.50',
  },
]

export default function Result() {
  return (
    <div className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-emerald-700">Result</h1>
        <div className="flex items-center gap-2 text-sm">
          <label className="text-slate-600">From</label>
          <input
            type="date"
            className="rounded border border-slate-300 px-2 py-1"
          />
          <label className="text-slate-600">To</label>
          <input
            type="date"
            className="rounded border border-slate-300 px-2 py-1"
          />
          <button
            type="button"
            className="rounded bg-emerald-700 px-3 py-1 text-white hover:bg-emerald-800"
          >
            Search
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-slate-700">
            <tr>
              <th className="px-3 py-2 text-left">Date</th>
              <th className="px-3 py-2 text-left">Event</th>
              <th className="px-3 py-2 text-left">Market</th>
              <th className="px-3 py-2 text-left">Winner</th>
              <th className="px-3 py-2 text-right">P&L</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r) => (
              <tr key={r.event + r.date} className="border-t border-slate-100">
                <td className="px-3 py-2 text-slate-600">{r.date}</td>
                <td className="px-3 py-2 font-medium text-blue-700">
                  {r.event}
                </td>
                <td className="px-3 py-2 text-slate-700">{r.market}</td>
                <td className="px-3 py-2 text-slate-700">{r.winner}</td>
                <td
                  className={[
                    'px-3 py-2 text-right font-semibold',
                    r.pl.startsWith('-') ? 'text-red-600' : 'text-emerald-700',
                  ].join(' ')}
                >
                  {r.pl}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
