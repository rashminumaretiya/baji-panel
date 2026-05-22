const linkBase =
  'inline-block px-2.5 py-1 text-[12px] leading-3 border border-[var(--lg-gray)] rounded text-[var(--dark)] no-underline cursor-pointer bg-gradient-to-b from-white to-[var(--xs-gray)] shadow-[inset_0_2px_0_0_rgba(var(--white-rgb),0.5)] hover:bg-gradient-to-t hover:from-white hover:to-[var(--xs-gray)] focus:outline-none focus:shadow-[inset_0_2px_0_0_rgba(var(--white-rgb),0.5)]'

const linkDisabled =
  'inline-block px-2.5 py-1 text-[12px] leading-3 border border-[var(--lg-gray)] rounded text-[var(--pagination-color)] no-underline pointer-events-none bg-[var(--pagination-bg)] shadow-none'

const linkActive =
  'inline-block px-2.5 py-1 text-[12px] leading-3 border border-[var(--lg-black)] rounded text-black no-underline cursor-pointer bg-[var(--md-yellow)] shadow-[inset_0_2px_0_0_rgba(var(--black-rgb),0.1)] hover:bg-[var(--md-yellow)]'

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
    <div className="py-3 flex items-center justify-center xl:flex-row flex-wrap">
      <nav role="navigation">
        <ul className="flex gap-[5px] list-none p-0 m-0">
          <li>
            <a
              aria-label="Previous"
              href=""
              className={prevDisabled ? linkDisabled : linkBase}
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
              <li key={page} aria-current={isActive ? 'page' : undefined}>
                <a
                  href=""
                  className={isActive ? linkActive : linkBase}
                  onClick={(event) => goTo(event, page)}
                >
                  {page}
                </a>
              </li>
            )
          })}
          <li>
            <a
              aria-label="Next"
              href=""
              className={nextDisabled ? linkDisabled : linkBase}
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
  )
}
