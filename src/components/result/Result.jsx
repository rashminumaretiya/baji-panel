import { useState } from 'react'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import Table from '../../shared/Table.jsx'
import { useIsMobile } from '../../hooks/useMediaQuery.js'
import { selectIsYellowTheme } from '../../store/slices/commonSlice.js'

const EventTime = {
  TODAY: 'TODAY',
  YESTERDAY: 'YESTERDAY',
}

const SPORTS = [
  { label: 'titles.games.cricket', value: 'CRICKET' },
  { label: 'titles.games.soccer', value: 'SOCCER' },
  { label: 'titles.games.tennis', value: 'TENNIS' },
  { label: 'titles.games.horseRacing', value: 'HORSE_RACING' },
  { label: 'titles.games.greyhoundRacing', value: 'GREYHOUND_RACING' },
]

const RESULT_DATA = [
  {
    eventName: 'Barbados Royals SRL T20 v Jamaica Tallawahs SRL T20',
    eventDate: '2024-10-21 09:30',
    resultItem1: '166/8',
    resultItem2: '150/8',
  },
  {
    eventName: 'Punit Balan Group v Ashtapailu Sports',
    eventDate: '2024-10-21 10:00',
    resultItem1: '166/4',
    resultItem2: '165/10',
  },
  {
    eventName: 'Paarl Royals SRL T20 v Pretoria Capitals SRL T20',
    eventDate: '2024-10-21 11:30',
    resultItem1: '208/2',
    resultItem2: '193/5',
  },
  {
    eventName: 'Edex Knights v Msida Warriors',
    eventDate: '2024-10-21 13:00',
    resultItem1: '101/5',
    resultItem2: '105/5',
  },
  {
    eventName: 'Royal Challengers Bangalore SRL T20 v Delhi Capitals SRL T20',
    eventDate: '2024-10-21 13:30',
    resultItem1: '140/8',
    resultItem2: '152/8',
  },
  {
    eventName: 'Jain Irrigation v Nok 99',
    eventDate: '2024-10-21 14:00',
    resultItem1: '132/7',
    resultItem2: '51/5',
  },
  {
    eventName: 'Edex Knights v American University of Malta',
    eventDate: '2024-10-21 15:00',
    resultItem1: '57/2',
    resultItem2: '56/6',
  },
  {
    eventName: 'South Africa SRL T20 v West Indies SRL T20',
    eventDate: '2024-10-21 15:30',
    resultItem1: '185/3',
    resultItem2: '191/4',
  },
  {
    eventName: 'Msida Warriors v Gozo Zalmi',
    eventDate: '2024-10-21 17:00',
    resultItem1: '114/5',
    resultItem2: '110/4',
  },
  {
    eventName: 'Brisbane Heat SRL T20 v Melbourne Stars SRL T20',
    eventDate: '2024-10-21 17:30',
    resultItem1: '236/3',
    resultItem2: '207/6',
  },
  {
    eventName: 'American University of Malta v Gozo Zalmi',
    eventDate: '2024-10-21 19:15',
    resultItem1: '95/6',
    resultItem2: '98/3',
  },
  {
    eventName: 'Punjab Kings SRL T20 v Kolkata Knight Riders SRL T20',
    eventDate: '2024-10-21 19:30',
    resultItem1: '142/7',
    resultItem2: '147/4',
  },
  {
    eventName: 'Quetta Gladiators SRL T20 v Karachi Kings SRL T20',
    eventDate: '2024-10-21 21:30',
    resultItem1: '159/9',
    resultItem2: '198/7',
  },
  {
    eventName: 'Afghanistan SRL T20 v Sri Lanka SRL T20',
    eventDate: '2024-10-21 23:30',
    resultItem1: '140/5',
    resultItem2: '141/5',
  },
  {
    eventName: 'St Lucia Kings SRL T20 v St Kitts And Nevis Patriots SRL T20',
    eventDate: '2024-10-22 01:30',
    resultItem1: '151/6',
    resultItem2: '155/6',
  },
  {
    eventName: 'Hobart Hurricanes SRL T20 v Perth Scorchers SRL T20',
    eventDate: '2024-10-22 05:30',
    resultItem1: '173/5',
    resultItem2: '129/9',
  },
  {
    eventName: 'Islamabad United SRL T20 v Peshawar Zalmi SRL T20',
    eventDate: '2024-10-22 07:30',
    resultItem1: '112/10',
    resultItem2: '255/2',
  },
]

// ─── Mobile result row class strings ───────────────────────────────────────
// Ports of `.mobile-table-stake-wrapper` / `.mobile-table-stake` / `.match-td`
// from the original result.scss. The grid is a flex column-strip where each
// "cell" reserves space for a floating label above the value.
const MOBILE_STAKE_WRAPPER = 'mb-[2.5vw]'

const MOBILE_STAKE_ROW =
  'flex items-stretch bg-white border-b border-[var(--sm-text-color)]'

// `.match-td` ─ each cell. `:first-child` doubles in width and left-aligns
// its `p`/`label`; we model that via [&:first-child:..] arbitrary selectors.
const MATCH_TD =
  'flex flex-col justify-center items-center flex-1 text-black ' +
  'pt-[6.67vw] pr-[1.6vw] pb-[1.6vw] pl-[1.6vw] text-center ' +
  'text-[5.33vw] border-l border-[var(--light-bg)] relative ' +
  // first-child overrides — wider lane + left aligned text.
  'first:flex-[2] first:[&_p]:text-[4.27vw] first:[&_p]:leading-[5.33vw] ' +
  'first:[&_p]:text-[var(--xs-text-color)] first:[&_p]:text-start ' +
  'first:[&_label]:text-start first:[&_label]:left-[1.6vw]'

const MATCH_LABEL =
  'absolute left-0 right-0 top-[1.7vw] text-center text-[2.93vw] ' +
  'leading-[3.73vw] text-[var(--xs-text-color)]'

const MATCH_P = 'mb-0 font-bold'

function MobileResultTable({ data }) {
  return (
    <div className={MOBILE_STAKE_WRAPPER}>
      {data.map((row, idx) => (
        <div className={MOBILE_STAKE_ROW} key={`${row.eventDate}-${idx}`}>
          <div className={MATCH_TD}>
            <label className={MATCH_LABEL}>{row.eventDate}</label>
            <p
              className={`${MATCH_P} text-[4.27vw] leading-[5.33vw] text-[var(--xs-text-color)] text-start w-full`}
            >
              {row.eventName}
            </p>
          </div>
          <div className={MATCH_TD}>
            <label className={MATCH_LABEL}>Home</label>
            <p className={MATCH_P}>{row.resultItem1}</p>
          </div>
          <div className={MATCH_TD}>
            <label className={MATCH_LABEL}>Away</label>
            <p className={MATCH_P}>{row.resultItem2}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Tab styles (port of `.nav-tabs`, `.nav-link.active`) ──────────────────
// The original result.scss only declared widths; the actual pill/tab look is
// driven by inplay.scss further up the cascade. To stay self-contained we
// reproduce the Bootstrap-ish active tab here in pure Tailwind.
const TABS_ROW =
  'flex w-2/5 pl-0 mb-0 list-none ' +
  'max-md:w-full max-md:border-b-0 max-md:pb-[1.6vw]'

const TAB_BTN_BASE =
  'block px-3 py-1.5 text-[12px] text-[var(--text-color)] bg-transparent border-0 ' +
  'border-b-2 border-transparent cursor-pointer hover:text-[var(--primary)]'
const TAB_BTN_ACTIVE =
  '!text-[var(--primary)] !border-[var(--primary)] font-semibold'

// `.result-tabs-wrapper` — outer flex strip; on mobile becomes a column with
// blue background + extra padding (per the @media (max-width: 767px) block).
const RESULT_TABS_WRAPPER =
  'overflow-x-auto pb-2 flex justify-between ' +
  'max-md:flex-col max-md:py-[1.6vw] max-md:px-[1.87vw] ' +
  'max-md:bg-[var(--mts-blue)]'

// `.outer-select` — relative wrapper with the mobile-only chevron via ::after.
const OUTER_SELECT =
  'relative ' +
  "max-md:after:content-[''] max-md:after:absolute max-md:after:top-1/2 " +
  'max-md:after:right-[2.13vw] max-md:after:translate-y-[-50%] ' +
  'max-md:after:border-t-[2.13vw] max-md:after:border-t-[var(--dark)] ' +
  'max-md:after:border-l-[2.13vw] max-md:after:border-l-transparent ' +
  'max-md:after:border-r-[2.13vw] max-md:after:border-r-transparent ' +
  'max-md:after:pointer-events-none'

const OUTER_SELECT_YELLOW = 'max-md:[&_select]:text-[4.1vw]'

// `.matched-select` ─ the <select> itself. Desktop: tight 180px pill. Mobile:
// full-width capsule with appearance:none so our ::after triangle is visible.
const MATCHED_SELECT =
  'w-[180px] text-[14px] p-0.5 leading-[29px] h-[29px] ' +
  'max-md:appearance-none max-md:w-full max-md:text-[3.73vw] ' +
  'max-md:h-[10.67vw] max-md:px-4 max-md:rounded-[1.6vw] max-md:uppercase'

export default function Result() {
  const { t } = useTranslation()
  const isMobile = useIsMobile()
  const isYellowTheme = useSelector(selectIsYellowTheme)

  const [activeTab, setActiveTab] = useState(EventTime.TODAY)
  const [sportFilter, setSportFilter] = useState(SPORTS[0].value)

  const data = RESULT_DATA

  const columns = [
    { key: 'eventDate', label: t('results.dateTime', 'Event Date/Time ') },
    { key: 'eventName', label: t('results.eventName', 'Event Name') },
    {
      key: 'resultItem1',
      label: t('results.home', 'Home'),
      cellClassName: 'font-bold',
    },
    {
      key: 'resultItem2',
      label: t('results.away', 'Away'),
      cellClassName: 'font-bold',
    },
  ]

  const TABS = [
    { id: EventTime.TODAY, label: 'Today', itemClass: 'today' },
    { id: EventTime.YESTERDAY, label: 'Yesterday', itemClass: 'tomorrow' },
  ]

  const changeTab = (id) => {
    setActiveTab(id)
    console.log('event :>> ', id)
  }

  const updateFilter = (event) => {
    const filterVal = event.target.value
    setSportFilter(filterVal)
    console.log('filterVal :>> ', filterVal)
  }

  const outerSelectClass = [OUTER_SELECT, isYellowTheme && OUTER_SELECT_YELLOW]
    .filter(Boolean)
    .join(' ')

  return (
    <div>
      {/* `.inplay-wrapper mt-md-2` — the original styles for these classes are
          owned by inplay.scss (lives on the page). We retain layout-only
          spacing here. */}
      <div className="md:mt-2">
        <div className={RESULT_TABS_WRAPPER}>
          <ul className={TABS_ROW} role="tablist">
            {TABS.map((tab) => {
              const isActive = tab.id === activeTab
              const btnClass = [TAB_BTN_BASE, isActive && TAB_BTN_ACTIVE]
                .filter(Boolean)
                .join(' ')
              return (
                <li key={tab.id} className="list-none" role="presentation">
                  <button
                    type="button"
                    className={btnClass}
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => changeTab(tab.id)}
                  >
                    <span>{t(tab.label)}</span>
                  </button>
                </li>
              )
            })}
          </ul>
          <div className={outerSelectClass}>
            <select
              id="sport-type"
              className={MATCHED_SELECT}
              value={sportFilter}
              onChange={updateFilter}
            >
              {SPORTS.map((sport) => (
                <option key={sport.value} value={sport.value}>
                  {t(sport.label)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* `.second-part-wrapper` — overflow container; the inplay.scss rule
            adds max-h/min-h on desktop. */}
        <div className="md:max-h-[calc(100vh-198px)] md:min-h-[200px] md:overflow-y-auto">
          {isMobile ? (
            <MobileResultTable data={data} />
          ) : (
            <Table
              columns={columns}
              data={data}
              tableTitle={t('results.result', 'Result')}
              tableTitleAs="h6"
              emptyMessage={t(
                'common.noEventsDisplayed',
                'No events to display'
              )}
            />
          )}
        </div>
      </div>
    </div>
  )
}
