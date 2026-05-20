export default function Pagination({
  currentPage = 1,
  totalPages = 0,
  onPageChange,
}) {
  if (!totalPages || totalPages < 1) return null

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
  const prevDisabled = currentPage <= 1
  const nextDisabled = currentPage >= totalPages

  const goTo = (event, page) => {
    event.preventDefault()
    if (page < 1 || page > totalPages || page === currentPage) return
    onPageChange?.(page)
  }

  return (
    <div className="d-xl-flex py-3 justify-content-center table-pagination align-items-center">
      <div className="d-flex align-items-center justify-content-center flex-wrap">
        <nav role="navigation">
          <ul className="pagination">
            <li
              className={`page-item ${prevDisabled ? 'disabled' : ''}`.trim()}
            >
              <a
                aria-label="Previous"
                href=""
                className="page-link"
                tabIndex={prevDisabled ? -1 : 0}
                aria-disabled={prevDisabled || undefined}
                onClick={(event) => goTo(event, currentPage - 1)}
              >
                Prev
              </a>
            </li>

            {pages.map((page) => {
              const isActive = page === currentPage
              return (
                <li
                  key={page}
                  className={`page-item ${isActive ? 'active' : ''}`.trim()}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <a
                    href=""
                    className="page-link"
                    onClick={(event) => goTo(event, page)}
                  >
                    {page}
                  </a>
                </li>
              )
            })}

            <li
              className={`page-item ${nextDisabled ? 'disabled' : ''}`.trim()}
            >
              <a
                aria-label="Next"
                href=""
                className="page-link"
                tabIndex={nextDisabled ? -1 : 0}
                aria-disabled={nextDisabled || undefined}
                onClick={(event) => goTo(event, currentPage + 1)}
              >
                Next
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  )
}
