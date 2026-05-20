export default function BetSlip() {
  return (
    <aside className="flex h-full w-full flex-col bg-white text-sm">
      <div className="flex items-center justify-between bg-slate-700 px-4 py-2 text-white">
        <span className="font-semibold">Bet Slip</span>
        <button
          type="button"
          className="text-lg leading-none hover:text-yellow-300"
        >
          −
        </button>
      </div>
      <div className="flex flex-1 items-center justify-center px-4 text-center text-slate-500">
        Click on the odds to add selections to the betslip.
      </div>
    </aside>
  )
}
