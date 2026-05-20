import { useState } from 'react'
import { Button, Card, Form, Image, Table } from 'react-bootstrap'

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
    <div className="d-flex flex-column gap-3 p-3">
      <div className="overflow-hidden rounded">
        <Image
          src="https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1600&q=60"
          alt="Stadium"
          fluid
          className="w-100 object-fit-cover"
          style={{ height: 224, objectFit: 'cover' }}
        />
      </div>

      <Card className="border-secondary-subtle">
        <Card.Header className="d-flex align-items-center justify-content-between bg-success text-white py-2">
          <Card.Title as="h2" className="h6 mb-0 fw-semibold">
            Sports Highlights
          </Card.Title>
          <div className="d-flex align-items-center gap-2 small">
            <span>View by</span>
            <Form.Select size="sm" className="w-auto bg-success text-white border-success">
              <option>Time</option>
            </Form.Select>
          </div>
        </Card.Header>

        <div className="d-flex bg-light border-bottom">
          {sports.map((s) => (
            <Button
              key={s.id}
              type="button"
              variant="link"
              onClick={() => setActive(s.id)}
              className={[
                'flex-fill rounded-0 text-decoration-none py-2 small fw-medium border-0 border-bottom border-3',
                active === s.id
                  ? 'border-success text-success bg-white'
                  : 'border-transparent text-secondary',
              ].join(' ')}
            >
              {s.label}
            </Button>
          ))}
        </div>

        <Table responsive hover size="sm" className="mb-0">
          <thead className="table-light text-secondary">
            <tr>
              <th className="px-3 py-2">Event</th>
              <th className="px-3 py-2 text-end">Matched</th>
              <th className="px-1 py-2 text-center" colSpan={3}>
                1 &nbsp; X &nbsp; 2
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((m) => (
              <tr key={m.name}>
                <td className="px-3 py-2">
                  <div className="fw-medium text-primary">{m.name}</div>
                  <div className="small text-success">{m.status}</div>
                </td>
                <td className="px-3 py-2 text-end text-secondary">{m.matched}</td>
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
        </Table>
      </Card>
    </div>
  )
}

function OddsCell() {
  return (
    <div className="d-flex" style={{ gap: 1 }}>
      <div className="flex-fill bg-info" style={{ height: '1.75rem' }} />
      <div className="flex-fill bg-danger bg-opacity-50" style={{ height: '1.75rem' }} />
    </div>
  )
}
