import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { http } from '../../core/http/client.js'
import { selectToken, selectUser } from '../../store/slices/authSlice.js'
import Table from '../../shared/Table.jsx'
import Tabs from '../../shared/Tabs.jsx'

const PL_MARKET_TABS = [
  { id: 'EXCHANGE', i18nKey: 'common.exchange', fallback: 'Exchange' },
  { id: 'FANCY', i18nKey: 'markets.fancy', fallback: 'Fancy' },
  { id: 'CASINO', i18nKey: 'common.casino', fallback: 'Casino' },
  { id: 'SPORTS_BOOK', i18nKey: 'markets.sportBook', fallback: 'Sport Book' },
  { id: 'BOOKMAKER', i18nKey: 'markets.bookmaker', fallback: 'Bookmaker' },
  { id: 'BPOKER', i18nKey: 'markets.bPoker', fallback: 'BPoker' },
  { id: 'SABA', i18nKey: 'common.saba', fallback: 'SABA' },
  { id: 'MINI_GAME', i18nKey: 'common.miniGame', fallback: 'MiniGame' },
  { id: 'ROYAL', i18nKey: 'common.royal', fallback: 'Royal' },
]

// Tabs that show the static help text only — no API call.
const STATIC_TABS = new Set(['ROYAL', 'MINI_GAME', 'SABA', 'BPOKER'])

const pad = (n) => String(n).padStart(2, '0')
const toIsoDate = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

// 09:00 IST → 03:30 UTC, 08:59:59 IST → 03:29:59 UTC.
const istStartIso = (dateStr) => {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d, 3, 30, 0)).toISOString()
}
const istEndIso = (dateStr) => {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d, 3, 29, 59)).toISOString()
}

const todayRange = () => {
  const t = new Date()
  const next = new Date(t)
  next.setDate(t.getDate() + 1)
  return { from: toIsoDate(t), to: toIsoDate(next) }
}
const yesterdayRange = () => {
  const t = new Date()
  const prev = new Date(t)
  prev.setDate(t.getDate() - 1)
  return { from: toIsoDate(prev), to: toIsoDate(t) }
}

function UserIcon({ ...props }) {
  return (
    <svg
      width="30"
      height="30"
      viewBox="0 0 30 30"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <mask
        id="mask0_195_4371"
        style={{ maskType: 'alpha' }}
        maskUnits="userSpaceOnUse"
        x="0"
        y="0"
        width="30"
        height="30"
      >
        <rect width="30" height="30" fill="currentColor"></rect>
      </mask>
      <g mask="url(#mask0_195_4371)">
        <path
          d="M15 15C13.625 15 12.4479 14.5104 11.4688 13.5312C10.4896 12.5521 10 11.375 10 10C10 8.625 10.4896 7.44792 11.4688 6.46875C12.4479 5.48958 13.625 5 15 5C16.375 5 17.5521 5.48958 18.5312 6.46875C19.5104 7.44792 20 8.625 20 10C20 11.375 19.5104 12.5521 18.5312 13.5312C17.5521 14.5104 16.375 15 15 15ZM5 25V21.5C5 20.7917 5.18229 20.1406 5.54688 19.5469C5.91146 18.9531 6.39583 18.5 7 18.1875C8.29167 17.5417 9.60417 17.0573 10.9375 16.7344C12.2708 16.4115 13.625 16.25 15 16.25C16.375 16.25 17.7292 16.4115 19.0625 16.7344C20.3958 17.0573 21.7083 17.5417 23 18.1875C23.6042 18.5 24.0885 18.9531 24.4531 19.5469C24.8177 20.1406 25 20.7917 25 21.5V25H5Z"
          fill="currentColor"
        ></path>
      </g>
    </svg>
  )
}

function nowLabel() {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// Tailwind class strings ported from myBets.scss `.pl-card` + `.bet-history-filter`.
const plCardClass =
  'bg-white mt-2 px-[10px] py-2 border-b border-[#7e97a7] [&_.user-table]:mt-0'
const plHeaderClass = 'mb-[10px]'
const plTitleClass = 'text-[15px] font-semibold mb-[6px] text-[#3b5160] mt-0'
const plMetaClass =
  'flex items-center flex-wrap gap-[10px] text-[12px] text-[#1e1e1e]'
const plMetaItemClass =
  'inline-flex items-center gap-[4px] text-(--text-color) [&_svg_path]:fill-(--sm-text-color)'

const filterContainerClass =
  'bg-(--platinum-grey) border-b border-[#d0d0d0] px-[10px] py-[8px] text-[12px] text-[#1e1e1e]'
const filterRowClass = 'flex items-center flex-wrap gap-[6px] mb-4'
const actionRowClass = 'flex items-center gap-[6px] mt-2'
const filterLabelClass = 'text-[#1e1e1e] whitespace-nowrap m-0'
const dateInputClass =
  'h-6 px-[6px] py-0 text-[12px] leading-[22px] rounded-[3px] border border-[#aaa] bg-white w-[130px]'
const timeInputClass =
  'h-6 px-[6px] py-0 text-[12px] leading-[22px] rounded-[3px] border border-[#aaa] w-[60px] text-center bg-[#ececec] text-[#666]'
const periodSepClass = 'px-1'
const btnLightClass =
  'h-[26px] px-[10px] text-[12px]! btn btn-white font-normal!'
const getHistoryBtnClass =
  'h-[26px] px-[10px] text-[12px]! btn btn-primary w-[97px]'

export default function ProfitLoss() {
  const { t } = useTranslation()
  const token = useSelector(selectToken)
  const user = useSelector(selectUser)
  const userName = user?.profileDetails?.userName ?? '--'
  const generatedAt = useMemo(() => nowLabel(), [])

  const COLUMNS = useMemo(
    () => [
      {
        key: 'date',
        label: t('table.columns.date', 'Date'),
        render: (_v, row) =>
          row?.date ? new Date(row.date).toLocaleString() : '--',
      },
      {
        key: 'marketName',
        label: t('myBets.market', 'Market'),
        render: (_v, row) => row?.marketName ?? '--',
      },
      {
        key: 'description',
        label: t('common.description', 'Description'),
        render: (_v, row) => row?.description ?? '--',
      },
      {
        key: 'profitLoss',
        label: t('myBets.profitLoss', 'Profit/Loss'),
        render: (_v, row) => row?.profitLoss ?? '--',
      },
    ],
    [t]
  )

  const CASINO_COLUMNS = useMemo(() => {
    const statusChipClass = (status) => {
      const base =
        'inline-block rounded-[3px] px-[6px] py-[2px] text-[11px] font-semibold uppercase'
      switch (status) {
        case 'WON':
          return `${base} bg-[#d4edda] text-[#155724]`
        case 'LOST':
          return `${base} bg-[#f8d7da] text-[#721c24]`
        case 'PENDING':
          return `${base} bg-[#fff3cd] text-[#856404]`
        default:
          return base
      }
    }
    return [
      {
        key: 'id',
        label: t('myBets.id', 'ID'),
        render: (_v, row) => row?._id ?? '--',
      },
      {
        key: 'platform',
        label: t('myBets.platform', 'Platform'),
        render: (_v, row) => {
          const root = row?.provider?.rootProvider ?? row?.rootProvider
          const name = row?.provider?.name ?? row?.providerName ?? row?.name
          if (root && name) return `${root} > ${name}`
          return root ?? name ?? '--'
        },
      },
      {
        key: 'transactionId',
        label: t('myBets.transactionID', 'Transaction Id'),
        render: (_v, row) => row?.transactionId ?? '--',
      },
      {
        key: 'roundId',
        label: t('myBets.roundID', 'Round Id'),
        render: (_v, row) => row?.roundId ?? '--',
      },
      {
        key: 'betAmount',
        label: t('myBets.betAmount', 'Bet Amount'),
        render: (_v, row) => row?.betAmount ?? '--',
      },
      {
        key: 'winAmount',
        label: t('myBets.winAmount', 'Win Amount'),
        render: (_v, row) => row?.winAmount ?? '--',
      },
      {
        key: 'betPlaced',
        label: t('myBets.placedDate', 'Bet placed'),
        render: (_v, row) =>
          row?.betPlacedAt ? new Date(row.betPlacedAt).toLocaleString() : '--',
      },
      {
        key: 'status',
        label: t('myBets.status', 'Status'),
        render: (_v, row) =>
          row?.status ? (
            <span className={statusChipClass(row.status)}>{row.status}</span>
          ) : (
            '--'
          ),
      },
    ]
  }, [t])

  const marketTabs = useMemo(
    () =>
      PL_MARKET_TABS.map((tab) => ({
        id: tab.id,
        label: t(tab.i18nKey, tab.fallback),
      })),
    [t]
  )

  const [marketCategory, setMarketCategory] = useState('EXCHANGE')
  const initial = todayRange()
  const [fromDate, setFromDate] = useState(initial.from)
  const [toDate, setToDate] = useState(initial.to)
  const [rows, setRows] = useState([])
  const [refreshKey, setRefreshKey] = useState(0)

  const setJustForToday = () => {
    const r = todayRange()
    setFromDate(r.from)
    setToDate(r.to)
    setRefreshKey((k) => k + 1)
  }
  const setFromYesterday = () => {
    const r = yesterdayRange()
    setFromDate(r.from)
    setToDate(r.to)
    setRefreshKey((k) => k + 1)
  }

  const handleMarketChange = (id) => {
    setMarketCategory(id)
    setRows([])
  }

  const fetchPnl = useCallback(() => {
    if (!token) return
    if (STATIC_TABS.has(marketCategory)) return
    const authHeaders = { headers: { Authorization: `Bearer ${token}` } }
    const handle = (res) => {
      const payload = res.data?.data
      setRows(payload?.data ?? (Array.isArray(payload) ? payload : []))
    }
    if (marketCategory === 'CASINO') {
      http.get('bet/casino-bets?page=1&perPage=10', authHeaders).then(handle)
      return
    }
    const periodStartDate = istStartIso(fromDate)
    const periodEndDate = istEndIso(toDate)
    const query = new URLSearchParams({
      page: '1',
      perPage: '10',
      periodStartDate,
      periodEndDate,
      marketCategory,
    }).toString()
    http.get(`bet/profit-loss?${query}`, authHeaders).then(handle)
  }, [token, marketCategory, fromDate, toDate])

  useEffect(() => {
    fetchPnl()
  }, [fetchPnl, refreshKey])

  return (
    <div className={plCardClass}>
      <div className={plHeaderClass}>
        <h4 className={plTitleClass}>
          {t('myBets.pnlMainWallet', 'Profit & Loss - Main wallet')}
        </h4>
        <div className={plMetaClass}>
          <span className={plMetaItemClass}>
            <UserIcon className="-mt-0.5 h-5 w-5" />
            <span>{userName}</span>
          </span>
          <span className={plMetaItemClass}>
            <span className="inline-block h-4 w-4 bg-[url('/img/calender-icon.png')] bg-[position:100%_-189px]"></span>
            <span>{generatedAt}</span>
          </span>
        </div>
      </div>

      <Tabs
        tabs={marketTabs}
        activeId={marketCategory}
        onChange={handleMarketChange}
      />

      <div className={filterContainerClass}>
        <div className={filterRowClass}>
          <label className={filterLabelClass}>
            {t('filters.period', 'Period')}
          </label>
          <input
            type="date"
            className={dateInputClass}
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
          <input
            type="text"
            className={timeInputClass}
            value="09 : 00"
            readOnly
          />
          <span className={periodSepClass}>{t('filters.to', 'to')}</span>
          <input
            type="date"
            className={dateInputClass}
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
          <input
            type="text"
            className={timeInputClass}
            value="08 : 59"
            readOnly
          />
        </div>

        <div className={actionRowClass}>
          <button
            type="button"
            className={btnLightClass}
            onClick={setJustForToday}
          >
            {t('filters.justForToday', 'Just For Today')}
          </button>
          <button
            type="button"
            className={btnLightClass}
            onClick={setFromYesterday}
          >
            {t('filters.fromYesterday', 'From Yesterday')}
          </button>
          <button
            type="button"
            className={getHistoryBtnClass}
            onClick={fetchPnl}
          >
            {t('filters.getPnl', 'Get P & L')}
          </button>
        </div>
      </div>

      {rows.length > 0 ? (
        <Table
          columns={marketCategory === 'CASINO' ? CASINO_COLUMNS : COLUMNS}
          data={rows}
          rowKey="_id"
        />
      ) : (
        <div className="bg-white pt-[10px] text-[12px] leading-[1.6] text-[#1e1e1e]">
          <p className="m-0">
            {t(
              'table.noData.pnlNoData.p1',
              'Betting History enables you to review the bets you have placed.'
            )}
          </p>
          <p className="m-0">
            {t(
              'table.noData.pnlNoData.p2',
              'Specify the time period during which your bets were placed, the type of markets on which the bets were placed, and the sport.'
            )}
          </p>
          <p className="mt-2 mb-0">
            {t(
              'table.noData.pnlNoData.p3',
              'Betting History is available online for the past 62 days.'
            )}
          </p>
          <p className="mt-2 mb-0">
            {t(
              'table.noData.pnlNoData.p4',
              'User can search up to 14 days records per query only .'
            )}
          </p>
        </div>
      )}
    </div>
  )
}
