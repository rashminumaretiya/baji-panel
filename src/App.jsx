import { NavLink, Route, Routes } from 'react-router-dom'
import About from './pages/About.jsx'
import Home from './pages/Home.jsx'

function App() {
  return (
    <div className="min-h-dvh bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
        <nav className="mx-auto flex max-w-2xl gap-4 px-6 py-3">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              [
                'text-sm font-medium',
                isActive
                  ? 'text-violet-600 dark:text-violet-400'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100',
              ].join(' ')
            }
          >
            Home
          </NavLink>
          <NavLink
            to="/about"
            className={({ isActive }) =>
              [
                'text-sm font-medium',
                isActive
                  ? 'text-violet-600 dark:text-violet-400'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100',
              ].join(' ')
            }
          >
            About
          </NavLink>
        </nav>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
