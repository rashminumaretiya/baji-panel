import { Button, Card } from 'react-bootstrap'

export default function BetSlip() {
  return (
    <aside className="d-flex h-100 w-100 flex-column bg-white small">
      <Card className="rounded-0 border-0 border-bottom shadow-none flex-shrink-0">
        <Card.Header className="d-flex align-items-center justify-content-between bg-secondary text-white py-2">
          <span className="fw-semibold">Bet Slip</span>
          <Button
            type="button"
            variant="link"
            className="p-0 text-white text-decoration-none fs-5 lh-1"
          >
            −
          </Button>
        </Card.Header>
      </Card>
      <div className="d-flex flex-grow-1 align-items-center justify-content-center px-3 text-center text-secondary">
        Click on the odds to add selections to the betslip.
      </div>
    </aside>
  )
}
