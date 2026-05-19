import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useDomainConfiguration } from './hooks/useDomainConfiguration.js'
import { useTheme } from './hooks/useTheme.js'
import Layout from './layouts/Layout.jsx'
import MyAccountLayout from './layouts/MyAccountLayout.jsx'
import ResultLayout from './layouts/ResultLayout.jsx'
import GameDetails from './pages/GameDetails.jsx'
import InPlay from './pages/InPlay.jsx'
import IplWinner from './pages/IplWinner.jsx'
import MultiMarkets from './pages/MultiMarkets.jsx'
import AccountStatement from './pages/Profile/AccountStatement.jsx'
import ActivityLog from './pages/Profile/ActivityLog.jsx'
import BalanceOverview from './pages/Profile/BalanceOverview.jsx'
import BetsComplaints from './pages/Profile/BetsComplaints.jsx'
import Deposit from './pages/Profile/Deposit.jsx'
import DepositHistory from './pages/Profile/DepositHistory.jsx'
import MyBets from './pages/Profile/MyBets.jsx'
import Profile from './pages/Profile/Profile.jsx'
import Withdraw from './pages/Profile/Withdraw.jsx'
import WithdrawHistory from './pages/Profile/WithdrawHistory.jsx'
import Result from './pages/Result.jsx'
import Soccer from './pages/Soccer.jsx'
import Tennis from './pages/Tennis.jsx'

const Home = lazy(() => import('./pages/Home.jsx'))

function App() {
  useDomainConfiguration()
  useTheme()

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route
          path="/"
          element={
            <Suspense
              fallback={
                <div className="d-flex align-items-center justify-content-center p-5">
                  Loading…
                </div>
              }
            >
              <Home />
            </Suspense>
          }
        />
        <Route
          path="odds/:eventId/:sport"
          element={<GameDetails />}
        />
        <Route path="soccer" element={<Soccer />} />
        <Route path="tennis" element={<Tennis />} />
      </Route>

      <Route element={<ResultLayout />}>
        <Route path="in-play" element={<InPlay />} />
        <Route path="multi-markets" element={<MultiMarkets />} />
        <Route path="ipl-winner" element={<IplWinner />} />
        <Route path="result" element={<Result />} />
      </Route>

      <Route path="/my-account" element={<MyAccountLayout />}>
        <Route index element={<Navigate to="my-profile" replace />} />
        <Route path="my-profile" element={<Profile />} />
        <Route path="balance-overview" element={<BalanceOverview />} />
        <Route path="account-statement" element={<AccountStatement />} />
        <Route path="my-bets" element={<MyBets />} />
        <Route path="bets-complaints" element={<BetsComplaints />} />
        <Route path="activity-log" element={<ActivityLog />} />
        <Route path="deposit" element={<Deposit />} />
        <Route path="deposit-history" element={<DepositHistory />} />
        <Route path="withdraw" element={<Withdraw />} />
        <Route path="withdraw-history" element={<WithdrawHistory />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
