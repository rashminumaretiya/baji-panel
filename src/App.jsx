import { lazy } from 'react'
import { useSelector } from 'react-redux'
import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { useDomainConfiguration } from './hooks/useDomainConfiguration.js'
import { useTheme } from './hooks/useTheme.js'
import Layout from './layouts/Layout.jsx'
import MyAccountLayout from './layouts/MyAccountLayout.jsx'
import InPlayLayout from './layouts/InPlayLayout.jsx'
import Home from './pages/Home.jsx'
import { selectIsAuthenticated } from './store/slices/authSlice.js'

const Account = lazy(() => import('./pages/Account.jsx'))
const Cricket = lazy(() => import('./pages/Cricket.jsx'))
const Soccer = lazy(() => import('./pages/Soccer.jsx'))
const Tennis = lazy(() => import('./pages/Tennis.jsx'))
const HorseRacing = lazy(() => import('./pages/HorseRacing.jsx'))
const GreyhoundRacing = lazy(() => import('./pages/GreyhoundRacing.jsx'))
const MultiMarkets = lazy(() => import('./pages/MultiMarkets.jsx'))
const LiveOdds = lazy(() => import('./pages/LiveOdds.jsx'))
const RacingOdds = lazy(() => import('./pages/RacingOdds.jsx'))
const InPlay = lazy(() => import('./pages/InPlay.jsx'))
const Result = lazy(() => import('./pages/Result.jsx'))

const Profile = lazy(() => import('./pages/Profile/Profile.jsx'))
const BalanceOverview = lazy(
  () => import('./pages/Profile/BalanceOverview.jsx')
)
const AccountStatement = lazy(
  () => import('./pages/Profile/AccountStatement.jsx')
)
const MyBets = lazy(() => import('./pages/Profile/MyBets.jsx'))
const BetsComplaints = lazy(() => import('./pages/Profile/BetsComplaints.jsx'))
const ActivityLog = lazy(() => import('./pages/Profile/ActivityLog.jsx'))
const Deposit = lazy(() => import('./pages/Profile/Deposit.jsx'))
const DepositHistory = lazy(() => import('./pages/Profile/DepositHistory.jsx'))
const Withdraw = lazy(() => import('./pages/Profile/Withdraw.jsx'))
const WithdrawHistory = lazy(
  () => import('./pages/Profile/WithdrawHistory.jsx')
)

function RequireAuth() {
  const isAuthenticated = useSelector(selectIsAuthenticated)
  return isAuthenticated ? <Outlet /> : <Navigate to="/" replace />
}

function App() {
  useDomainConfiguration()
  useTheme()

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="odds/:eventId/:sport" element={<LiveOdds />} />
        <Route
          path="racing-odds/:eventId/:marketId/:sport"
          element={<RacingOdds />}
        />
        <Route path="cricket" element={<Cricket />} />
        <Route path="soccer" element={<Soccer />} />
        <Route path="tennis" element={<Tennis />} />
        <Route path="horse-racing" element={<HorseRacing />} />
        <Route path="greyhound-racing" element={<GreyhoundRacing />} />
        <Route path="multi-markets" element={<MultiMarkets />} />
        <Route path="account" element={<Account />} />
      </Route>

      <Route element={<InPlayLayout />}>
        <Route path="in-play" element={<InPlay />} />
        <Route path="result" element={<Result />} />
      </Route>

      <Route element={<RequireAuth />}>
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
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
