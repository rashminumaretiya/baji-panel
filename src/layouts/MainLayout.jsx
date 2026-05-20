import { Outlet } from 'react-router-dom'
import BetSlip from '../components/BetSlip.jsx'
import Header from '../components/Header.jsx'
import Sidebar from '../components/Sidebar.jsx'

export default function MainLayout() {
  return (
    <div className="flex h-dvh flex-col bg-slate-100 text-slate-900">
      <Header />
      <div className="grid flex-1 grid-cols-[240px_minmax(0,1fr)_320px] overflow-hidden">
        <div className="border-r border-slate-200 overflow-y-auto">
          <Sidebar />
        </div>
        <main className="overflow-y-auto bg-white">
          <Outlet />
        </main>
        <div className="border-l border-slate-200 overflow-y-auto">
          <BetSlip />
        </div>
      </div>
    </div>
  )
}
