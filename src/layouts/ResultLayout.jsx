import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import Header from '../components/Header.jsx'
import Loader from '../shared/components/Loader.jsx'

export default function ResultLayout() {
  return (
    <div className="flex flex-col h-screen bg-[var(--xs-gray)] text-[var(--dark)]">
      <Header />
      <main className="grow overflow-auto bg-white">
        <Suspense fallback={<Loader show variant="wrapper" />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  )
}
