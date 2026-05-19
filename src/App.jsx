import { Route, Routes } from 'react-router-dom'
import ResultLayout from './layouts/ResultLayout.jsx'
import Cricket from './pages/Cricket.jsx'
import Highlights from './pages/Highlights.jsx'
import InPlay from './pages/InPlay.jsx'
import IplWinner from './pages/IplWinner.jsx'
import MultiMarkets from './pages/MultiMarkets.jsx'
import Result from './pages/Result.jsx'
import Soccer from './pages/Soccer.jsx'
import Tennis from './pages/Tennis.jsx'
import Layout from './layouts/Layout.jsx'


function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Highlights />} />
        <Route path="highlight" element={<Highlights />} />
        <Route path="cricket" element={<Cricket />} />
        <Route path="soccer" element={<Soccer />} />
        <Route path="tennis" element={<Tennis />} />
      </Route>

      <Route element={<ResultLayout />}>
        <Route path="in-play" element={<InPlay />} />
        <Route path="multi-markets" element={<MultiMarkets />} />
        <Route path="ipl-winner" element={<IplWinner />} />
        <Route path="result" element={<Result />} />
      </Route>

      <Route path="*" element={<Layout />}>
        <Route index element={<Highlights />} />
      </Route>
    </Routes>
  )
}

export default App
