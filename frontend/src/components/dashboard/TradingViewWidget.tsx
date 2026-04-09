import { useEffect, useRef } from 'react'

type TradingViewWidgetProps = {
  symbol: string
  interval?: string
  theme?: 'dark' | 'light'
  studies?: string[]
  height?: number
}

declare global {
  interface Window {
    TradingView?: any
  }
}

// Sanitize symbol for TradingView — strip anything that isn't A-Z, 0-9, dot, colon
function sanitizeSymbol(raw: string): string {
  const cleaned = raw.trim().toUpperCase().replace(/[^A-Z0-9.:]/g, '')
  return cleaned || 'SPY'
}

let widgetCounter = 0

export function TradingViewWidget({
  symbol,
  interval = 'D',
  theme = 'dark',
  studies = ['MASimple@tv-basicstudies', 'EMA@tv-basicstudies', 'Volume@tv-basicstudies'],
  height = 560,
}: TradingViewWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  // Stable ID for the lifetime of this component instance
  const containerId = useRef(`tv-chart-${++widgetCounter}`).current

  useEffect(() => {
    let mounted = true
    const container = containerRef.current
    if (!container) return

    const tvSymbol = sanitizeSymbol(symbol)

    const createWidget = () => {
      if (!mounted || !window.TradingView || !container) return
      // Clear any previous widget content
      container.innerHTML = ''
      new window.TradingView.widget({
        container_id: containerId,
        autosize: true,
        symbol: tvSymbol,
        interval,
        theme: theme === 'light' ? 'light' : 'dark',
        timezone: 'Etc/UTC',
        style: '1',
        locale: 'en',
        toolbar_bg: '#0B1018',
        enable_publishing: false,
        allow_symbol_change: true,
        hide_side_toolbar: false,
        hide_top_toolbar: false,
        withdateranges: true,
        range: '6M',
        details: true,
        hotlist: true,
        calendar: true,
        studies,
        support_host: 'https://www.tradingview.com',
      })
    }

    const scriptId = 'tradingview-widget-script'
    const scriptEl = document.getElementById(scriptId)

    if (scriptEl) {
      if (window.TradingView) {
        createWidget()
      } else {
        scriptEl.addEventListener('load', createWidget, { once: true })
      }
    } else {
      const script = document.createElement('script')
      script.id = scriptId
      script.src = 'https://s3.tradingview.com/tv.js'
      script.async = true
      script.onload = createWidget
      document.head.appendChild(script)
    }

    return () => {
      mounted = false
      // Let TradingView finish any in-flight async work before clearing DOM
      setTimeout(() => {
        if (container) {
          container.innerHTML = ''
        }
      }, 0)
    }
  }, [symbol, interval, theme, containerId, studies])

  return <div id={containerId} ref={containerRef} style={{ height }} className="w-full" />
}
