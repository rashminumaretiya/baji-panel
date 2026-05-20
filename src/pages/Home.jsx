import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { decrement, increment, reset } from '../store/slices/counterSlice.js'

export default function Home() {
  const count = useSelector((state) => state.counter.value)
  const dispatch = useDispatch()

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6 p-8">
      <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
        Home
      </h1>
      <p className="text-slate-600 dark:text-slate-400">
        Counter from Redux slice:{' '}
        <span className="font-mono font-medium text-violet-600 dark:text-violet-400">
          {count}
        </span>
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
          onClick={() => dispatch(increment())}
        >
          +1
        </button>
        <button
          type="button"
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
          onClick={() => dispatch(decrement())}
        >
          −1
        </button>
        <button
          type="button"
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
          onClick={() => dispatch(reset())}
        >
          Reset
        </button>
      </div>
      <Link
        to="/about"
        className="text-sm font-medium text-violet-600 underline-offset-4 hover:underline dark:text-violet-400"
      >
        About
      </Link>
    </div>
  )
}
