import { Link } from 'react-router-dom'

export default function About() {
  return (
    <div className="mx-auto max-w-lg p-8">
      <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
        About
      </h1>
      <p className="mt-4 text-slate-600 dark:text-slate-400">
        React Router + Redux Toolkit + Tailwind v4 are wired up.
      </p>
      <Link
        to="/"
        className="mt-6 inline-block text-sm font-medium text-violet-600 underline-offset-4 hover:underline dark:text-violet-400"
      >
        ← Home
      </Link>
    </div>
  )
}
