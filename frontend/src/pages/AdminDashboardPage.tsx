import { useState, useMemo, useEffect } from "react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sidebar } from "@/components/dashboard/Sidebar"
import { ScanResultsTable } from "@/components/dashboard/ScanResultsTable"
import { BreakoutCard } from "@/components/dashboard/BreakoutCard"
import { FilterControls, FilterOptions } from "@/components/dashboard/FilterControls"
import { StockDetailPanel } from "@/components/dashboard/StockDetailPanel"
import { TradingViewWidget } from "@/components/dashboard/TradingViewWidget"
import { useScanResults, BreakoutScan } from "@/hooks/useScanResults"
import { PlayIcon, Crown, RefreshCw, Grid3x3, List, BarChart4, Activity, ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

export default function AdminDashboardPage() {
  const { results, loading, error } = useScanResults()
  const [isScanning, setIsScanning] = useState(false)
  const [marketOpen] = useState(true)
  const [selectedStock, setSelectedStock] = useState<BreakoutScan | null>(null)
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards')
  const [focusSymbol, setFocusSymbol] = useState<string | null>(null)
  
  const [filters, setFilters] = useState<FilterOptions>({
    minScore: 70,
    maxDistance: 5,
    setupTypes: new Set(['FLAT_TOP', 'WEDGE', 'FLAG', 'BASE', 'UNKNOWN']),
    emaAlignedOnly: false,
    minAdr: 0,
  })

  // Apply filters
  const filteredResults = useMemo(() => {
    return results.filter((scan) => {
      // Score filter
      if (scan.breakout_score < filters.minScore) return false
      
      // Distance filter
      if (scan.distance_pct > filters.maxDistance) return false
      
      // Setup type filter
      if (!filters.setupTypes.has(scan.setup_type)) return false
      
      // EMA alignment filter
      if (filters.emaAlignedOnly) {
        const emaAligned = scan.price > scan.ema21 && 
                          scan.ema21 > scan.ema50 && 
                          scan.ema50 > scan.ema200
        if (!emaAligned) return false
      }
      
      // ADR filter
      if (scan.adr_pct_14 < filters.minAdr) return false
      
      return true
    })
  }, [results, filters])

  const handleScan = () => {
    setIsScanning(true)
    // In production, this would trigger a new scan
    setTimeout(() => setIsScanning(false), 2000)
  }

  useEffect(() => {
    if (filteredResults.length === 0) {
      setFocusSymbol(null)
      return
    }

    setFocusSymbol((prev) => {
      if (prev && filteredResults.some((scan) => scan.symbol === prev)) {
        return prev
      }
      return filteredResults[0]?.symbol ?? null
    })
  }, [filteredResults])

  const focusScan = useMemo(
    () => filteredResults.find((scan) => scan.symbol === focusSymbol) ?? filteredResults[0] ?? null,
    [filteredResults, focusSymbol]
  )

  return (
    <div className="min-h-screen bg-black">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="ml-[72px]">
        {/* Header */}
        <header className="fixed top-0 left-[72px] right-0 z-50 border-b border-white/5 bg-gradient-to-r from-neutral-950 via-neutral-900 to-neutral-950 backdrop-blur-xl">
          <div className="flex h-16 items-center justify-between px-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 ring-1 ring-white/10">
                <BarChart4 className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-white tracking-tight">Admin Dashboard</h1>
                <p className="text-xs text-neutral-400 font-light">
                  Real-time breakout scanner & market analysis
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <Badge className={cn(
                "h-fit px-3 py-1.5 rounded-lg font-medium",
                marketOpen 
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
                  : "bg-red-500/20 text-red-400 border border-red-500/30"
              )}>
                <span className={cn(
                  "mr-2 inline-block h-2 w-2 rounded-full",
                  marketOpen ? "bg-emerald-400 animate-pulse" : "bg-red-400"
                )} />
                {marketOpen ? "Market Open" : "Market Closed"}
              </Badge>

              <Button
                onClick={handleScan}
                disabled={isScanning || loading}
                className="bg-blue-600 text-white hover:bg-blue-700 shadow-lg"
              >
                {isScanning || loading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    {loading ? 'Loading...' : 'Scanning...'}
                  </>
                ) : (
                  <>
                    <PlayIcon className="mr-2 h-4 w-4" />
                    Refresh Scan
                  </>
                )}
              </Button>
            </motion.div>
          </div>
        </header>

        <main className="pt-24 p-8 space-y-8">
          {/* Filter Controls */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <FilterControls
              filters={filters}
              onChange={setFilters}
              resultCount={filteredResults.length}
              totalCount={results.length}
            />
          </motion.div>

          {/* Trading Desk Panel */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="grid xl:grid-cols-[2fr,1fr] gap-6">
            <Card className="bg-white/[0.03] border-white/10 shadow-xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                <div>
                  <p className="text-xs uppercase tracking-wide text-white/60">Live TradingView Chart</p>
                  <div className="flex items-baseline gap-3">
                    <h3 className="text-2xl font-semibold text-white">{focusScan?.symbol ?? 'No symbol'}</h3>
                    {focusScan && (
                      <Badge className="bg-white/10 text-white border-white/10">
                        Score {focusScan.breakout_score}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-white/60">Full drawing toolkit with multi-timeframe view</p>
                </div>
                {focusScan && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="border-white/20 text-white hover:bg-white/10"
                      onClick={() => setSelectedStock(focusScan)}
                    >
                      Open detail panel
                    </Button>
                    <Button
                      className="bg-primary text-white hover:bg-primary/90"
                      onClick={() => setFocusSymbol(focusScan.symbol)}
                    >
                      Pin symbol
                    </Button>
                  </div>
                )}
              </div>

              <div className="p-6 space-y-4">
                {focusScan ? (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                        <p className="text-xs text-white/60">Price</p>
                        <p className="text-lg font-semibold text-white">${focusScan.price.toFixed(2)}</p>
                      </div>
                      <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                        <p className="text-xs text-white/60">Trigger</p>
                        <p className="text-lg font-semibold text-cyan-300">${focusScan.trigger_price.toFixed(2)}</p>
                      </div>
                      <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                        <p className="text-xs text-white/60">Distance</p>
                        <p className="text-lg font-semibold text-white">{focusScan.distance_pct.toFixed(2)}%</p>
                      </div>
                      <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                        <p className="text-xs text-white/60">ADR (14)</p>
                        <p className="text-lg font-semibold text-white">{focusScan.adr_pct_14.toFixed(2)}%</p>
                      </div>
                    </div>
                    <div className="rounded-xl overflow-hidden bg-black/60 border border-white/10">
                      <TradingViewWidget symbol={focusScan.symbol} interval="D" theme="dark" />
                    </div>
                  </>
                ) : (
                  <div className="h-[560px] flex items-center justify-center text-white/60">
                    No symbols in view. Adjust your filters to populate the watchlist.
                  </div>
                )}
              </div>
            </Card>

            <Card className="bg-white/[0.02] border-white/10 shadow-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-white/10">
                <p className="text-xs uppercase tracking-wide text-white/60">Watchlist & analytics</p>
                <h3 className="text-xl font-semibold text-white mt-1">Breakout radar</h3>
                <p className="text-sm text-white/60">Tap to load any symbol into the live chart</p>
              </div>
              <div className="max-h-[640px] overflow-y-auto divide-y divide-white/5">
                {filteredResults.length === 0 && (
                  <div className="p-6 text-white/60">No symbols available. Loosen the filters to see candidates.</div>
                )}
                {filteredResults.map((scan) => {
                  const emaAligned = scan.price > scan.ema21 && scan.ema21 > scan.ema50 && scan.ema50 > scan.ema200
                  const isActive = focusSymbol === scan.symbol
                  return (
                    <button
                      key={scan.id}
                      onClick={() => {
                        setFocusSymbol(scan.symbol)
                        setSelectedStock(scan)
                      }}
                      className={cn(
                        "w-full text-left px-6 py-4 transition-colors",
                        isActive ? "bg-primary/15 border-l-4 border-primary" : "hover:bg-white/5"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-semibold text-white">{scan.symbol}</span>
                          <Badge className="bg-white/10 text-white border-white/10">{scan.setup_type.replace('_', ' ')}</Badge>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-semibold">${scan.price.toFixed(2)}</p>
                          <p className="text-xs text-white/60">{scan.distance_pct.toFixed(2)}% to trigger</p>
                        </div>
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-3 text-xs text-white/70">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex h-2 w-2 rounded-full bg-cyan-400" />
                          ADR {scan.adr_pct_14.toFixed(2)}%
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                          Score {scan.breakout_score}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="inline-flex h-2 w-2 rounded-full bg-amber-400" />
                          EMA {emaAligned ? 'aligned' : 'mixed'}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </Card>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-zinc-400">View:</span>
            <div className="flex gap-2">
              <Button
                onClick={() => setViewMode('cards')}
                className={cn(
                  "px-4 py-2 rounded-lg border transition-all",
                  viewMode === 'cards'
                    ? "bg-cyan-500 text-white border-cyan-400"
                    : "bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700"
                )}
              >
                <Grid3x3 size={16} className="mr-2" />
                Cards
              </Button>
              <Button
                onClick={() => setViewMode('table')}
                className={cn(
                  "px-4 py-2 rounded-lg border transition-all",
                  viewMode === 'table'
                    ? "bg-cyan-500 text-white border-cyan-400"
                    : "bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700"
                )}
              >
                <List size={16} className="mr-2" />
                Table
              </Button>
            </div>
          </div>
          </motion.div>

          {/* Error State */}
          {error && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card className="bg-red-500/10 border-red-500/30 p-4">
                <p className="text-red-400">Error loading scan results: {error}</p>
              </Card>
            </motion.div>
          )}

          {/* Cards View - Default */}
          {viewMode === 'cards' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <div>
              {loading ? (
                <div className="p-12 text-center">
                  <RefreshCw className="h-8 w-8 text-cyan-400 animate-spin mx-auto mb-4" />
                  <p className="text-white/60">Loading breakout setups...</p>
                </div>
              ) : filteredResults.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {filteredResults.map((scan) => (
                    <BreakoutCard key={scan.id} scan={scan} />
                  ))}
                </div>
              ) : (
                <Card className="bg-zinc-800/30 border-zinc-800 p-8 text-center">
                  <p className="text-zinc-400">No breakout setups match your filters</p>
                  <p className="text-xs text-zinc-600 mt-2">Try adjusting your filter criteria</p>
                </Card>
              )}
            </div>
            </motion.div>
          )}

          {/* Table View */}
          {viewMode === 'table' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="bg-white/[0.02] border-white/10 shadow-xl overflow-hidden">
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-white">Breakout Scanner Results</h2>
                    <p className="text-sm text-white/60 mt-1">
                      Live breakout opportunities with EMA trend analysis
                    </p>
                  </div>
                  {!loading && (
                    <Badge className="bg-primary/20 text-primary border-primary/30">
                      {filteredResults.length} Setups Found
                    </Badge>
                  )}
                </div>
              </div>
              
              {loading ? (
                <div className="p-12 text-center">
                  <RefreshCw className="h-8 w-8 text-cyan-400 animate-spin mx-auto mb-4" />
                  <p className="text-white/60">Loading scan results...</p>
                </div>
              ) : (
                <ScanResultsTable 
                  results={filteredResults} 
                  onRowClick={setSelectedStock}
                />
              )}
            </Card>
            </motion.div>
          )}
        </main>
      </div>

      {/* Stock Detail Panel */}
      <StockDetailPanel 
        scan={selectedStock}
        onClose={() => setSelectedStock(null)}
      />
    </div>
  )
}
