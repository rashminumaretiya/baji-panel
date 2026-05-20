import { Navigate, Route, Routes } from 'react-router-dom'
import MainLayout from './layouts/MainLayout.jsx'
import ResultLayout from './layouts/ResultLayout.jsx'
import Cricket from './pages/Cricket.jsx'
import Highlights from './pages/Highlights.jsx'
import InPlay from './pages/InPlay.jsx'
import IplWinner from './pages/IplWinner.jsx'
import MultiMarkets from './pages/MultiMarkets.jsx'
import Result from './pages/Result.jsx'
import Soccer from './pages/Soccer.jsx'
import Tennis from './pages/Tennis.jsx'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/highlight" replace />} />

      <Route element={<MainLayout />}>
        <Route path="/highlight" element={<Highlights />} />
        <Route path="/cricket" element={<Cricket />} />
        <Route path="/soccer" element={<Soccer />} />
        <Route path="/tennis" element={<Tennis />} />
      </Route>

      <Route element={<ResultLayout />}>
        <Route path="/in-play" element={<InPlay />} />
        <Route path="/multi-markets" element={<MultiMarkets />} />
        <Route path="/ipl-winner" element={<IplWinner />} />
        <Route path="/result" element={<Result />} />
      </Route>

      <Route path="*" element={<Navigate to="/highlight" replace />} />
    </Routes>
  )
}

export default App
