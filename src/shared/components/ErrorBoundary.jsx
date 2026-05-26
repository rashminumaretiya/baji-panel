import { Component } from 'react'

// Top-level error boundary. Catches render/lifecycle errors below it so a
// single broken page does not blank out the whole shell. Children that throw
// during render are replaced with `fallback` (or the default inline message).
// React still surfaces the error to the dev overlay in development.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] render error:', error, info?.componentStack)
  }

  reset = () => {
    this.setState({ hasError: false })
  }

  render() {
    if (!this.state.hasError) return this.props.children
    if (this.props.fallback) {
      return typeof this.props.fallback === 'function'
        ? this.props.fallback(this.reset)
        : this.props.fallback
    }
    return (
      <div className="flex min-h-[200px] w-full flex-col items-center justify-center gap-2 p-6 text-center text-sm text-(--xl-gray)">
        <div>Something went wrong.</div>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded bg-(--primary) px-3 py-1 text-white"
        >
          Reload
        </button>
      </div>
    )
  }
}
