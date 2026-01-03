import { useEffect, useMemo, useRef } from 'react'

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

export function TradingViewWidget({
  symbol,
  interval = 'D',
  theme = 'dark',
  studies = ['MASimple@tv-basicstudies', 'EMA@tv-basicstudies', 'Volume@tv-basicstudies'],
  height = 560,
}: TradingViewWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const containerId = useMemo(() => `tv-chart-${Math.random().toString(36).slice(2)}`, [])
  const studiesKey = studies.join(',')

  useEffect(() => {
    const createWidget = () => {
      if (!window.TradingView || !containerRef.current) return

      new window.TradingView.widget({
        container_id: containerId,
        autosize: true,
        symbol,
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
    const scriptExists = document.getElementById(scriptId)

    if (scriptExists) {
      if (window.TradingView) {
        createWidget()
      } else {
        scriptExists.addEventListener('load', createWidget, { once: true })
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
      if (containerRef.current) {
        containerRef.current.innerHTML = ''
      }
    }
  }, [symbol, interval, theme, containerId, studiesKey])

  return <div id={containerId} ref={containerRef} style={{ height }} className="w-full" />
}
