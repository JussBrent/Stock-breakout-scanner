import { useEffect, useRef } from 'react'

type TradingViewWidgetProps = {
  symbol: string
  interval?: string
  theme?: 'dark' | 'light'
  height?: number
  entry?: number | null
  stop?: number | null
  target?: number | null
  direction?: 'Long' | 'Short' | null
}

declare global {
  interface Window {
    TradingView?: any
  }
}

function sanitizeSymbol(raw: string): string {
  const cleaned = raw.trim().toUpperCase().replace(/[^A-Z0-9.:]/g, '')
  return cleaned || 'SPY'
}

const LEVEL_CONFIGS = [
  { key: 'entry' as const, color: '#06b6d4', labelFn: (price: number, isShort: boolean) =>
      `${isShort ? 'Short Entry' : 'Buy Entry'}  $${price.toFixed(2)}` },
  { key: 'stop'  as const, color: '#ef4444', labelFn: (price: number) =>
      `Stop Loss  $${price.toFixed(2)}` },
  { key: 'target' as const, color: '#10b981', labelFn: (price: number) =>
      `Target  $${price.toFixed(2)}` },
] as const

let widgetCounter = 0

export function TradingViewWidget({
  symbol,
  interval = 'D',
  theme = 'dark',
  height = 560,
  entry,
  stop,
  target,
  direction,
}: TradingViewWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const containerId = useRef(`tv-chart-${++widgetCounter}`).current
  // Track all pending timeouts so cleanup is complete
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  const clearTimers = () => {
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
  }

  const addTimer = (t: ReturnType<typeof setTimeout>) => {
    timersRef.current.push(t)
  }

  useEffect(() => {
    let mounted = true
    const container = containerRef.current
    if (!container) return

    const tvSymbol = sanitizeSymbol(symbol)

    const createWidget = () => {
      if (!mounted || !window.TradingView || !container) return
      container.innerHTML = ''

      const widget = new window.TradingView.widget({
        container_id: containerId,
        width: container.offsetWidth || 800,
        height,
        symbol: tvSymbol,
        interval,
        theme: theme === 'light' ? 'light' : 'dark',
        timezone: 'Etc/UTC',
        style: '1',
        locale: 'en',
        toolbar_bg: '#0B1018',
        enable_publishing: false,
        allow_symbol_change: false,
        hide_side_toolbar: true,
        withdateranges: true,
        range: '6M',
        studies: ['MASimple@tv-basicstudies', 'EMA@tv-basicstudies', 'Volume@tv-basicstudies'],
        support_host: 'https://www.tradingview.com',
      })

      const levels = { entry, stop, target }
      const hasLevels = entry || stop || target
      if (hasLevels) {
        widget.onChartReady(() => {
          if (!mounted) return
          const chart = widget.activeChart()
          const isShort = direction === 'Short'

          for (const cfg of LEVEL_CONFIGS) {
            const price = levels[cfg.key]
            if (!price) continue
            chart.createOrderLine()
              .setPrice(price)
              .setText(cfg.labelFn(price, isShort))
              .setQuantity('')
              .setLineColor(cfg.color)
              .setBodyBackgroundColor(cfg.color)
              .setBodyTextColor('#ffffff')
              .setBodyBorderColor(cfg.color)
              .setLineWidth(2)
          }
        })
      }
    }

    // Delay to ensure container is painted before widget measures it.
    // After the delay, check readyState to avoid a race where the script
    // finished loading before our listener is attached.
    addTimer(setTimeout(() => {
      const scriptId = 'tradingview-widget-script'
      const scriptEl = document.getElementById(scriptId) as HTMLScriptElement | null

      if (scriptEl) {
        if (window.TradingView) {
          createWidget()
        } else {
          // Guard against the load event already having fired
          if ((scriptEl as any).readyState === 'loaded' || (scriptEl as any).readyState === 'complete') {
            createWidget()
          } else {
            scriptEl.addEventListener('load', createWidget, { once: true })
          }
        }
      } else {
        const script = document.createElement('script')
        script.id = scriptId
        script.src = 'https://s3.tradingview.com/tv.js'
        script.async = true
        script.onload = createWidget
        document.head.appendChild(script)
      }
    }, 150))

    return () => {
      mounted = false
      clearTimers()
      addTimer(setTimeout(() => {
        if (container) container.innerHTML = ''
      }, 0))
    }
  }, [symbol, interval, theme, containerId, height, entry, stop, target, direction])

  return <div id={containerId} ref={containerRef} style={{ height }} className="w-full" />
}
