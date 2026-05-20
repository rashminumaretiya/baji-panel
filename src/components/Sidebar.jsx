import { NavLink } from 'react-router-dom'
import { ListGroup } from 'react-bootstrap'

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
    <aside className="h-100 w-100 overflow-auto bg-light small text-dark">
      <ListGroup variant="flush" className="rounded-0">
        {sidebarItems.map((item) => {
          if (item.heading) {
            return (
              <ListGroup.Item
                key={item.to}
                className="bg-success text-white fw-semibold border-0 rounded-0 py-2"
              >
                {item.label}
              </ListGroup.Item>
            )
          }
          return (
            <ListGroup.Item
              key={item.to}
              as="div"
              className="p-0 border-secondary-subtle"
            >
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  [
                    'd-block text-decoration-none px-3 py-2 border-bottom',
                    item.indent ? 'ps-4' : '',
                    isActive
                      ? 'bg-success text-white fw-medium'
                      : 'text-dark',
                  ].join(' ')
                }
              >
                {item.indent && (
                  <span className="d-inline-block me-2 rounded-circle border border-secondary" style={{ width: 8, height: 8 }} />
                )}
                {item.label}
              </NavLink>
            </ListGroup.Item>
          )
        })}
      </ListGroup>
    </aside>
  )
}
