import { Outlet } from 'react-router-dom'
import BetSlip from '../components/BetSlip.jsx'
import Header from '../components/Header.jsx'
import Sidebar from '../components/Sidebar.jsx'
import './layout.scss'

export default function MainLayout() {
  return (
    <>
      <Header />
      <div
        className="d-flex flex-grow-1 overflow-hidden"
        style={{ minHeight: 0 }}
      >
        <aside
          className="border-end overflow-auto flex-shrink-0 bg-light"
          style={{ width: 240 }}
        >
          <Sidebar />
        </aside>
        <main className="flex-grow-1 overflow-auto bg-white">
          <Outlet />
        </main>
        <aside
          className="border-start overflow-auto flex-shrink-0 bg-white"
          style={{ width: 320 }}
        >
          <BetSlip />
        </aside>
      </div>
    </>
  )
}
