import { useEffect, useMemo } from "react"
import { useDispatch, useSelector } from "react-redux"
import { Outlet, useLocation } from "react-router-dom"
import { fetchSidebarSports } from "../store/slices/sportSlice"
import { selectIsAuthenticated } from "../store/slices/authSlice"
import { selectIsMobile } from "../store/slices/commonSlice"
import { selectLayoutedRoutes } from "../store/slices/layoutSlice"
import Header from "../components/Header"
import SportsSidebar from "../shared/components/sports-sidebar/SportsSidebar"
import "./layout.scss"

const cx = (...classes) => classes.filter(Boolean).join(' ')

export default function Layout() {
  const { pathname } = useLocation()
  const dispatch = useDispatch()

  useEffect(() => {
    dispatch(fetchSidebarSports())
  }, [dispatch])

  const isAuthenticated = useSelector(selectIsAuthenticated)
  const isMobile = useSelector(selectIsMobile)
  const layoutedRoutes = useSelector(selectLayoutedRoutes)

  const firstSegment = useMemo(() => pathname.split('/')[1] ?? '', [pathname])

  const showSportSidebar = useMemo(() => {
    if (isMobile) return false
    return layoutedRoutes.includes(firstSegment) && firstSegment !== 'inplay'
  }, [isMobile, layoutedRoutes, firstSegment])

  const showRightSidebar = useMemo(() => {
    if (isMobile) return false
    return layoutedRoutes.includes(firstSegment)
  }, [isMobile, layoutedRoutes, firstSegment])

  return (
    <div className="app-layout">
      <Header />

      <div className={cx('main-wrapper', isAuthenticated && 'auth')}>
        <div className="content h-100">
          {showSportSidebar && (
            <div className="sport-events">
              <SportsSidebar />
            </div>
          )}

          <div
            className={cx(
              'position-relative h-100',
              showSportSidebar && 'middle-content',
              showRightSidebar && !showSportSidebar && 'middle-content-right',
              isMobile && 'mobile-router-outlet',
            )}
          >
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  )
}
