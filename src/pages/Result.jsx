import { Button, Card, Form, Table } from 'react-bootstrap'

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
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
        <h1 className="h5 mb-0 fw-semibold text-success">Result</h1>
        <div className="d-flex flex-wrap align-items-center gap-2 small">
          <Form.Label className="mb-0 text-secondary">From</Form.Label>
          <Form.Control type="date" size="sm" className="w-auto" />
          <Form.Label className="mb-0 text-secondary">To</Form.Label>
          <Form.Control type="date" size="sm" className="w-auto" />
          <Button type="button" variant="success" size="sm">
            Search
          </Button>
        </div>
      </div>

      <Card className="border-secondary-subtle overflow-hidden">
        <Table responsive hover size="sm" className="mb-0">
          <thead className="table-light text-secondary">
            <tr>
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2">Event</th>
              <th className="px-3 py-2">Market</th>
              <th className="px-3 py-2">Winner</th>
              <th className="px-3 py-2 text-end">P&L</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r) => (
              <tr key={r.event + r.date}>
                <td className="px-3 py-2 text-secondary">{r.date}</td>
                <td className="px-3 py-2 fw-medium text-primary">{r.event}</td>
                <td className="px-3 py-2">{r.market}</td>
                <td className="px-3 py-2">{r.winner}</td>
                <td
                  className={[
                    'px-3 py-2 text-end fw-semibold',
                    r.pl.startsWith('-') ? 'text-danger' : 'text-success',
                  ].join(' ')}
                >
                  {r.pl}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </div>
  )
}
