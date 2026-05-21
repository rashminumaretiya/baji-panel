import { useRef, useState } from 'react'
import { useIsMobile } from '../../hooks/useMediaQuery.js'
import './live-stream.scss'

const isAuthenticated = true

const CloseIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="currentColor"
      d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
    />
  </svg>
)

const FullscreenIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="currentColor"
      d="M7 14H5v5h5v-2H7zm-2-4h2V7h3V5H5zm12 7h-3v2h5v-5h-2zM14 5v2h3v3h2V5z"
    />
  </svg>
)

function LiveStreamTpl({ isPlaying, liveStreamUrl, showTvOutside, isTabMode, onClose, onFullscreen, iframeRef }) {
  if (!(isPlaying && liveStreamUrl)) return null
  return (
    <div
      className={`live-streaming-wrapper text-center mb-md-3 p-md-2 pb-0${
        isTabMode ? ' wicket-theme' : ''
      }`}
    >
      <iframe
        ref={iframeRef}
        className="live-streaming"
        src={liveStreamUrl}
        width="100%"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share;"
        allowFullScreen
        title="Live stream"
      />
      <div className="close-icon-wrapper">
        <i className="cursor-pointer close" onClick={onClose} role="button" aria-label="Close stream">
          {CloseIcon}
        </i>
      </div>
      {!showTvOutside && (
        <i
          className="cursor-pointer fullscreen"
          onClick={onFullscreen}
          role="button"
          aria-label="Fullscreen"
        >
          {FullscreenIcon}
        </i>
      )}
    </div>
  )
}

function ScoreIframeTpl({ scoreIframeUrl, isMobile }) {
  if (!scoreIframeUrl) return null
  return (
    <div
      className={`score-iframe-wrapper text-center pb-0${
        isMobile && scoreIframeUrl ? ' mobile-score-iframe-wrapper' : ''
      }`}
    >
      <iframe
        className="score-iframe"
        src={scoreIframeUrl}
        width="100%"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share;"
        allowFullScreen
        title="Scoreboard"
      />
    </div>
  )
}

export default function LiveStream({
  liveStreamUrl = null,
  scoreIframeUrl = null,
  isAuthenticated: isAuthProp,
  isPlaying: isPlayingProp,
  showTvOutside = false,
  isTabMode = true,
  onCloseStream,
} = {}) {
  const isMobile = useIsMobile()
  const iframeRef = useRef(null)
  const [activeTab, setActiveTab] = useState('tv')
  const [localPlaying, setLocalPlaying] = useState(true)

  const isPlaying = isPlayingProp ?? localPlaying
  const authenticated = isAuthProp ?? isAuthenticated

  if (!authenticated) return null
  if (!liveStreamUrl && !scoreIframeUrl) return null

  const onClose = () => {
    setLocalPlaying(false)
    onCloseStream?.()
  }
  const onFullscreen = () => {
    const node = iframeRef.current
    if (!node) return
    if (node.requestFullscreen) node.requestFullscreen()
    else if (node.webkitRequestFullscreen) node.webkitRequestFullscreen()
  }

  const streamProps = {
    isPlaying,
    liveStreamUrl,
    showTvOutside,
    isTabMode,
    onClose,
    onFullscreen,
    iframeRef,
  }

  return (
    <div id="liveStreamWrapper">
      {!isMobile ? (
        <>
          <LiveStreamTpl {...streamProps} />
          <ScoreIframeTpl scoreIframeUrl={scoreIframeUrl} isMobile={isMobile} />
        </>
      ) : isTabMode ? (
        (liveStreamUrl || scoreIframeUrl) && (
          <>
            <ul className="live-tabs nav-tabs">
              <li className="nav-item">
                <button
                  type="button"
                  className={`nav-link${activeTab === 'tv' ? ' active' : ''}`}
                  onClick={() => setActiveTab('tv')}
                >
                  Live
                </button>
              </li>
              <li className="nav-item">
                <button
                  type="button"
                  className={`nav-link${activeTab === 'score' ? ' active' : ''}`}
                  onClick={() => setActiveTab('score')}
                >
                  Scoreboard
                </button>
              </li>
            </ul>
            <div>
              {activeTab === 'tv' && (
                <>
                  {showTvOutside && (
                    <div className="mobile-live-streaming">
                      <img
                        src="/img/market/tv_placeholder.webp"
                        className="img-placeholder"
                        alt="img"
                      />
                    </div>
                  )}
                  <div
                    className={`mobile-live-streaming${showTvOutside ? ' tv-url' : ''}${
                      isTabMode ? ' left-side' : ''
                    }`}
                  >
                    <LiveStreamTpl {...streamProps} />
                  </div>
                </>
              )}
              {activeTab === 'score' && (
                <ScoreIframeTpl scoreIframeUrl={scoreIframeUrl} isMobile={isMobile} />
              )}
            </div>
          </>
        )
      ) : (
        <>
          {showTvOutside && (
            <div className="mobile-live-streaming">
              <img
                src="/img/market/tv_placeholder.webp"
                className="img-placeholder"
                alt="img"
              />
            </div>
          )}
          <div className={`mobile-live-streaming${showTvOutside ? ' tv-url' : ''}`}>
            <LiveStreamTpl {...streamProps} />
          </div>
          <ScoreIframeTpl scoreIframeUrl={scoreIframeUrl} isMobile={isMobile} />
        </>
      )}
    </div>
  )
}
