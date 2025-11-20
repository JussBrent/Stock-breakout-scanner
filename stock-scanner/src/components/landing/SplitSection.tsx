export default function SplitSection() {
  return (
    <>
      {/* Section A: Image left, content right */}
      <section className="relative overflow-hidden py-32">
        <div className="mx-auto max-w-7xl px-6 sm:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            {/* Image */}
            <div className="order-2 lg:order-1">
              <div className="overflow-hidden rounded-3xl border border-border/60 bg-muted/30 shadow-2xl">
                <img
                  src="/stock-chart-with-breakout-patterns-and-technical-i.jpg"
                  alt="Scanning System"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>

            {/* Content */}
            <div className="order-1 lg:order-2">
              <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Intelligent Automation
              </p>
              <h2 className="mb-6 font-serif text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
                Turn hours of stock scanning{' '}
                <span className="text-muted-foreground">into seconds.</span>
              </h2>
              <p className="mb-6 text-base leading-relaxed text-muted-foreground">
                StockBreakout Scanner automates your coach's 8 EMA breakout
                playbook—scanning U.S. equities, ranking setups by AI strength
                score, and building a Focus List you can trade from in minutes.
              </p>
              <p className="text-base leading-relaxed text-muted-foreground">
                What used to take 1–2 hours of manual chart analysis each night
                now happens automatically. Spend less time scanning, more time
                trading.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <div className="rounded-xl border border-border/60 bg-card/50 px-6 py-4">
                  <p className="font-serif text-2xl font-semibold">2,000+</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Stocks scanned nightly
                  </p>
                </div>
                <div className="rounded-xl border border-border/60 bg-card/50 px-6 py-4">
                  <p className="font-serif text-2xl font-semibold">&lt;30s</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Average scan time
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section B: Content left, image right */}
      <section className="relative overflow-hidden border-t border-border/60 bg-muted/30 py-32">
        <div className="mx-auto max-w-7xl px-6 sm:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            {/* Content */}
            <div>
              <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Advanced Customization
              </p>
              <h2 className="mb-6 font-serif text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
                Build scans that match{' '}
                <span className="text-muted-foreground">your strategy.</span>
              </h2>
              <p className="mb-6 text-base leading-relaxed text-muted-foreground">
                Beyond our default coach methodology, create custom scan
                profiles tailored to your exact trading approach. Filter by
                price range, volume patterns, technical indicators, and more.
              </p>
              <ul className="space-y-4">
                <li className="flex gap-3">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-6 w-6 shrink-0 text-foreground"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <div>
                    <p className="font-semibold">Custom Technical Filters</p>
                    <p className="text-sm text-muted-foreground">
                      RSI, MACD, moving averages, and 50+ indicators
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-6 w-6 shrink-0 text-foreground"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <div>
                    <p className="font-semibold">Volume & Price Criteria</p>
                    <p className="text-sm text-muted-foreground">
                      Set minimum volume, price range, and liquidity thresholds
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-6 w-6 shrink-0 text-foreground"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <div>
                    <p className="font-semibold">Save & Reuse Profiles</p>
                    <p className="text-sm text-muted-foreground">
                      Create unlimited scan profiles for different market
                      conditions
                    </p>
                  </div>
                </li>
              </ul>
            </div>

            {/* Image */}
            <div>
              <div className="overflow-hidden rounded-3xl border border-border/60 bg-muted/30 shadow-2xl">
                <img
                  src="/advanced-trading-filters-interface-with-custom-par.jpg"
                  alt="Custom Scan Builder"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
