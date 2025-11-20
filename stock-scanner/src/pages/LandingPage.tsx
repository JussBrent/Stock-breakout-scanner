import { Button } from "@/components/ui/button"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top navigation */}
      <header className="relative z-20 border-b border-border/60 bg-background/60 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-8">
          {/* Logo + product name */}
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold">
              SB
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold tracking-wide">
                StockBreakout
              </span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-[0.16em]">
                Scanning Studio
              </span>
            </div>
          </div>

          {/* Nav links */}
          <nav className="hidden items-center gap-8 text-sm text-muted-foreground sm:flex">
            <button className="hover:text-foreground transition-colors">
              Product
            </button>
            <button className="hover:text-foreground transition-colors">
              Pricing
            </button>
            <button className="hover:text-foreground transition-colors">
              Resources
            </button>
          </nav>

          {/* Auth / CTAs */}
          <div className="flex items-center gap-3">
            <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Log in
            </button>
            <Button size="sm" className="rounded-full px-5">
              Get started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero section */}
      <main className="relative isolate overflow-hidden">
        {/* Background media vibe */}
        <div className="pointer-events-none absolute inset-0">
          {/* soft gradient overlay */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.24),_transparent_55%),radial-gradient(circle_at_bottom,_rgba(94,234,212,0.16),_transparent_55%)] opacity-70" />
          {/* fake “video / chart” block at bottom like Squarespace */}
          <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-background via-background/60 to-transparent" />
        </div>

        <section className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl flex-col items-center justify-center px-4 pb-16 pt-10 sm:px-8 sm:pt-20">
          {/* Hero text */}
          <div className="max-w-2xl text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-primary">
              STOCK BREAKOUT SCANNER
            </p>

            <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl">
              Turn hours of stock scanning
              <span className="text-primary"> into seconds.</span>
            </h1>

            <p className="mt-4 text-balance text-sm text-muted-foreground sm:text-base">
              StockBreakout Studio automates your coach&apos;s 8 EMA breakout
              playbook—scanning U.S. equities, ranking setups by AI strength
              score, and building a Focus List you can trade from in minutes.
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
              <Button className="rounded-full px-8 py-5 text-base font-medium">
                Get started free
              </Button>

              <Button
                variant="outline"
                className="rounded-full border-border/70 bg-background/60 px-6 py-4 text-sm text-foreground backdrop-blur"
              >
                Watch a live scan demo
              </Button>
            </div>

            {/* Trust / social proof line */}
            <p className="mt-4 text-xs text-muted-foreground">
              Built for breakout traders who currently spend 1–2 hours a night
              building watchlists.
            </p>
          </div>

          {/* “Preview” strip under hero – similar to Squarespace lower panel */}
          <div className="mt-16 w-full max-w-3xl rounded-2xl border border-border/60 bg-card/80 p-4 shadow-lg shadow-black/40 backdrop-blur">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-medium text-foreground">
                Focus List preview
              </span>
              <span>AI-ranked breakout candidates · U.S. equities</span>
            </div>

            <div className="mt-4 grid gap-3 text-xs sm:grid-cols-3">
              <div className="rounded-xl bg-background/70 p-3">
                <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  Symbol
                </p>
                <p className="mt-1 text-sm font-semibold">NVDA</p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Watch for breakout above <span className="font-medium">$183.40</span>
                </p>
              </div>

              <div className="rounded-xl bg-background/70 p-3">
                <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  Setup quality
                </p>
                <p className="mt-1 text-sm font-semibold">92 · Strong A+</p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  8 EMA trend + volume expansion
                </p>
              </div>

              <div className="rounded-xl bg-background/70 p-3">
                <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  Scan time
                </p>
                <p className="mt-1 text-sm font-semibold">17:03 ET</p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Added to tonight&apos;s Focus List
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
