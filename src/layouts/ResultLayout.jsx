import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import Header from '../components/Header.jsx'
import Loader from '../shared/components/Loader.jsx'

export default function ResultLayout() {
  return (
    <div className="d-flex flex-column vh-100 bg-light text-dark">
      <Header />
      <main className="flex-grow-1 overflow-auto bg-white">
        <Suspense fallback={<Loader show variant="wrapper" />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  )
}
