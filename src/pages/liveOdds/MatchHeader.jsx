// Tiny shared header bar used by both Bookmaker and Fancy "match-header".
export default function MatchHeader({ children }) {
  return (
    <div className="flex items-center justify-between bg-[var(--light-navy)] max-md:bg-[var(--text-color)]">
      {children}
    </div>
  )
}
