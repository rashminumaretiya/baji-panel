import { Outlet } from 'react-router-dom'
import Header from '../components/Header.jsx'

export default function ResultLayout() {
  return (
    <div className="flex h-dvh flex-col bg-slate-100 text-slate-900">
      <Header />
      <main className="flex-1 overflow-y-auto bg-white">
        <Outlet />
      </main>
    </div>
  )
}
