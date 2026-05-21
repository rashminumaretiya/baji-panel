import { useState } from 'react'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import Table from '../../shared/Table.jsx'
import { useIsMobile } from '../../hooks/useMediaQuery.js'
import { selectIsYellowTheme } from '../../store/slices/commonSlice.js'
import './result.scss'

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

function MobileResultTable({ data }) {
  return (
    <div className="mobile-table-stake-wrapper">
      {data.map((row, idx) => (
        <div className="mobile-table-stake" key={`${row.eventDate}-${idx}`}>
          <div className="match-td">
            <label className="match-label">{row.eventDate}</label>
            <p className="match-name">{row.eventName}</p>
          </div>
          <div className="match-td">
            <label className="match-label">Home</label>
            <p>{row.resultItem1}</p>
          </div>
          <div className="match-td">
            <label className="match-label">Away</label>
            <p>{row.resultItem2}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

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
      cellClassName: 'text-bold',
    },
    {
      key: 'resultItem2',
      label: t('results.away', 'Away'),
      cellClassName: 'text-bold',
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

  return (
    <div className="result-page">
      <div className="inplay-wrapper mt-md-2">
        <div className="overflow-x-auto pb-2 d-flex justify-content-between result-tabs-wrapper">
          <ul className="nav-tabs" role="tablist">
            {TABS.map((tab) => {
              const isActive = tab.id === activeTab
              return (
                <li
                  key={tab.id}
                  className={`nav-item ${tab.itemClass}`}
                  role="presentation"
                >
                  <button
                    type="button"
                    className={`nav-link${isActive ? ' active' : ''}`}
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
          <div
            className={`outer-select${isYellowTheme ? ' yellow-theme' : ''}`}
          >
            <select
              id="sport-type"
              className="matched-select"
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

        <div className="second-part-wrapper">
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
