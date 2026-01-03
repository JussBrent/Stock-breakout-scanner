import { useState } from "react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sidebar } from "@/components/dashboard/Sidebar"
import { MetricsCards } from "@/components/dashboard/MetricsCards"
import { Charts } from "@/components/dashboard/Charts"
import { ScanResults } from "@/components/dashboard/ScanResults"
import { PlayIcon, PauseIcon, Zap, Crown, Brain, Settings, TrendingUp, Target, Bell, Eye, AlertCircle, BarChart3, Activity } from "lucide-react"
import { cn } from "@/lib/utils"
import { mockStockData, getAIInsight } from "@/lib/mock-data"

export default function AdminDashboardPage() {
  const [isScanning, setIsScanning] = useState(false)
  const [marketOpen, setMarketOpen] = useState(true)
  const [scanProfile, setScanProfile] = useState<"default" | "custom">("default")
  const [membershipTier, setMembershipTier] = useState<"free" | "standard" | "premium">("premium")
  const [selectedStock, setSelectedStock] = useState(mockStockData[0])
  const insight = getAIInsight(selectedStock.symbol)

  const handleScan = () => {
    setIsScanning(true)
    setTimeout(() => setIsScanning(false), 2000)
  }

  const getMembershipBadge = () => {
    if (membershipTier === "premium") {
      return (
        <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
          <Crown className="mr-1 h-3 w-3" />
          Premium
        </Badge>
      )
    }
    if (membershipTier === "standard") {
      return <Badge className="bg-white/10 text-white border-white/20">Standard</Badge>
    }
    return <Badge className="bg-white/10 text-white border-white/20">Free Plan</Badge>
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="ml-64">
        <header className="fixed top-0 left-64 right-0 z-50 border-b border-white/10 bg-black/95 backdrop-blur-xl">
          <div className="flex h-20 items-center justify-between px-8">
            <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-black">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                >
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-serif text-base font-semibold tracking-tight text-white">
                  StockBreakout
                </span>
                <span className="text-[10px] uppercase tracking-widest text-white/60">
                  Scanner
                </span>
              </div>
            </Link>

            <div className="flex items-center gap-4">
              <Badge
                variant={marketOpen ? "default" : "secondary"}
                className={cn(
                  "h-7 px-3",
                  marketOpen ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20" : "bg-white/10 text-white/60 border-white/20",
                )}
              >
                {marketOpen ? (
                  <>
                    <span className="mr-2 inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    Market Open
                  </>
                ) : (
                  "Market Closed"
                )}
              </Badge>
              <div className="flex items-center gap-2">
                <Button
                  variant={scanProfile === "default" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setScanProfile("default")}
                  className={scanProfile === "default" ? "bg-primary text-white hover:bg-primary/90" : "bg-white/5 text-white border-white/20 hover:bg-white/10"}
                >
                  <Zap className="mr-1.5 h-3.5 w-3.5" />
                  Default Scan
                </Button>
                <Button
                  variant={scanProfile === "custom" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setScanProfile("custom")}
                  className={scanProfile === "custom" ? "bg-primary text-white hover:bg-primary/90" : "bg-white/5 text-white border-white/20 hover:bg-white/10"}
                  disabled={membershipTier === "free"}
                >
                  Custom Scan
                  {membershipTier === "free" && <span className="ml-1 text-xs">(Premium)</span>}
                </Button>
              </div>

              {getMembershipBadge()}

              <Button
                onClick={handleScan}
                disabled={isScanning}
                size="lg"
                className="bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20"
              >
                {isScanning ? (
                  <>
                    <PauseIcon className="mr-2 h-4 w-4 animate-pulse" />
                    Scanning...
                  </>
                ) : (
                  <>
                    <PlayIcon className="mr-2 h-4 w-4" />
                    Run Scan
                  </>
                )}
              </Button>
            </div>
          </div>

          {scanProfile === "default" && (
            <div className="border-t border-white/10 bg-primary/5 px-8 py-3">
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-white/60">Timeframe:</span>
                  <span className="text-white font-medium">Daily</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-white/60">Volume:</span>
                  <span className="text-white font-medium">&gt; 1M</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-white/60">Min Score:</span>
                  <span className="text-white font-medium">85</span>
                </div>
              </div>
            </div>
          )}
        </header>

        <main className="pt-32 p-8 space-y-8">
          {/* Metrics Cards */}
          <MetricsCards />

          {/* Stock Momentum & Breakout Panels */}
          <div className="grid gap-6 lg:grid-cols-2" id="momentum">
            <Card className="bg-white/[0.02] border-white/10 shadow-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 rounded-xl bg-emerald-500/15">
                  <TrendingUp className="h-6 w-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-bold text-xl text-white">Stock Momentum</h3>
                  <p className="text-xs text-white/60">Real-time momentum indicators</p>
                </div>
              </div>
              <div className="space-y-4">
                {mockStockData.slice(0, 3).map((stock) => (
                  <div key={stock.symbol} className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary/20 to-emerald-400/10 flex items-center justify-center">
                        <span className="text-sm font-bold text-primary">{stock.symbol.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="font-bold text-white">{stock.symbol}</p>
                        <p className="text-xs text-white/60">{stock.trendStatus}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-lg font-bold text-white">${stock.price.toFixed(2)}</p>
                      <div className="flex items-center gap-1 text-emerald-400 text-sm">
                        <TrendingUp className="h-3 w-3" />
                        <span>+{stock.upside.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="bg-white/[0.02] border-white/10 shadow-xl p-6" id="breakout-alerts">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 rounded-xl bg-primary/15">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-xl text-white">Breakout Alerts</h3>
                  <p className="text-xs text-white/60">Active breakout opportunities</p>
                </div>
              </div>
              <div className="space-y-4">
                {mockStockData.filter(s => s.price >= s.breakoutLevel).map((stock) => (
                  <div key={stock.symbol} className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 to-primary/5 border border-emerald-500/20">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-white">{stock.symbol}</p>
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">
                          Active
                        </Badge>
                      </div>
                      <p className="font-mono text-lg font-bold text-emerald-400">${stock.price.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/60">Breakout: ${stock.breakoutLevel.toFixed(2)}</span>
                      <span className="text-white/60">{stock.volumeStatus} Volume</span>
                    </div>
                  </div>
                ))}
                {mockStockData.filter(s => s.price < s.breakoutLevel).slice(0, 1).map((stock) => (
                  <div key={stock.symbol} className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/5 border border-amber-500/20">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-white">{stock.symbol}</p>
                        <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">
                          Watch
                        </Badge>
                      </div>
                      <p className="font-mono text-lg font-bold text-white">${stock.price.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/60">Target: ${stock.breakoutLevel.toFixed(2)}</span>
                      <span className="text-white/60">-{((stock.breakoutLevel - stock.price) / stock.price * 100).toFixed(1)}% away</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* AI Insights Panel */}
          <Card className="bg-white/[0.02] border-white/10 shadow-xl" id="ai-insights">
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/15">
                  <Brain className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="font-bold text-xl text-white">AI Insights</h2>
                  <p className="text-sm text-white/60">Deep learning analysis powered by machine learning</p>
                </div>
                <Badge className="ml-auto bg-primary/20 text-primary border-primary/30">
                  Live Analysis
                </Badge>
              </div>
            </div>
            <div className="p-6">
              <div className="grid gap-6 lg:grid-cols-4 mb-6">
                {mockStockData.map((stock) => (
                  <Card
                    key={stock.symbol}
                    className={`p-5 cursor-pointer transition-all duration-200 ${
                      selectedStock.symbol === stock.symbol
                        ? "bg-gradient-to-br from-primary/10 to-primary/5 border-primary/40 shadow-lg"
                        : "bg-white/5 border-white/10 hover:border-primary/30 hover:bg-white/10"
                    }`}
                    onClick={() => setSelectedStock(stock)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary/20 to-emerald-400/10 flex items-center justify-center">
                        <span className="text-xs font-bold text-primary">{stock.symbol.charAt(0)}</span>
                      </div>
                      <Badge className="text-xs bg-emerald-500/10 border-emerald-500/30 text-emerald-400">
                        {stock.aiConfidence}%
                      </Badge>
                    </div>
                    <h3 className="font-bold text-lg mb-1 text-white">{stock.symbol}</h3>
                    <p className="text-xs text-white/60 mb-3">{stock.company}</p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/60">Score</span>
                      <span className="font-bold text-primary">{stock.score}</span>
                    </div>
                  </Card>
                ))}
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20 p-6">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="p-2 rounded-lg bg-primary/15">
                      <Brain className="h-5 w-5 text-primary" />
                    </div>
                    <h4 className="font-bold text-lg text-white">Pattern Analysis</h4>
                  </div>
                  <div className="space-y-5">
                    <div>
                      <p className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">
                        Pattern Detected
                      </p>
                      <Badge className="border-primary/40 text-primary bg-primary/5 text-sm px-3 py-1">
                        <BarChart3 className="mr-1.5 h-3.5 w-3.5" />
                        {insight.pattern}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">
                        Historical Success Rate
                      </p>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-3 bg-white/10 rounded-full overflow-hidden border border-white/10">
                          <div
                            className="h-full bg-gradient-to-r from-primary to-emerald-400 rounded-full transition-all duration-500"
                            style={{ width: `${insight.successRate}%` }}
                          />
                        </div>
                        <span className="text-base font-bold text-primary min-w-[48px] text-right">{insight.successRate}%</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">
                        AI Confidence Score
                      </p>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-3 bg-white/10 rounded-full overflow-hidden border border-white/10">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-400 to-emerald-300 rounded-full transition-all duration-500"
                            style={{ width: `${selectedStock.aiConfidence}%` }}
                          />
                        </div>
                        <span className="text-base font-bold text-emerald-400 min-w-[48px] text-right">{selectedStock.aiConfidence}%</span>
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className="bg-white/5 border-white/10 p-6">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="p-2 rounded-lg bg-amber-500/15">
                      <AlertCircle className="h-5 w-5 text-amber-500" />
                    </div>
                    <h4 className="font-bold text-lg text-white">Risk Assessment</h4>
                  </div>
                  <ul className="space-y-3 mb-6">
                    {insight.riskNotes.map((note, index) => (
                      <li key={index} className="flex items-start gap-3 text-sm">
                        <div className="mt-0.5 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                        <span className="text-white/70">{note}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="pt-5 border-t border-white/10">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-emerald-400/15 mt-0.5">
                        <TrendingUp className="h-4 w-4 text-emerald-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold mb-2 text-white">Trading Recommendation</p>
                        <p className="text-sm text-white/70 leading-relaxed">{insight.recommendation}</p>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </Card>

          {/* Charts */}
          <div id="analytics">
            <Charts />
          </div>

          {/* Settings Panel */}
          <Card className="bg-white/[0.02] border-white/10 shadow-xl" id="settings">
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/15">
                  <Settings className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="font-bold text-xl text-white">Quick Settings</h2>
                  <p className="text-sm text-white/60">Configure your scanning preferences</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="grid gap-6 md:grid-cols-3">
                <Card className="bg-white/5 border-white/10 p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-primary/15">
                      <Bell className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-bold text-white">Notifications</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white/70">Push Alerts</span>
                      <div className="h-6 w-11 rounded-full bg-primary relative">
                        <div className="absolute right-1 top-1 h-4 w-4 rounded-full bg-white" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white/70">Email Digest</span>
                      <div className="h-6 w-11 rounded-full bg-white/20 relative">
                        <div className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white/60" />
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className="bg-white/5 border-white/10 p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-primary/15">
                      <Eye className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-bold text-white">Display</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white/70">Show AI Scores</span>
                      <div className="h-6 w-11 rounded-full bg-primary relative">
                        <div className="absolute right-1 top-1 h-4 w-4 rounded-full bg-white" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white/70">Compact View</span>
                      <div className="h-6 w-11 rounded-full bg-white/20 relative">
                        <div className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white/60" />
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className="bg-white/5 border-white/10 p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-primary/15">
                      <Activity className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-bold text-white">Auto-Refresh</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white/70">Real-time Data</span>
                      <div className="h-6 w-11 rounded-full bg-primary relative">
                        <div className="absolute right-1 top-1 h-4 w-4 rounded-full bg-white" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white/70">5 min intervals</span>
                      <div className="h-6 w-11 rounded-full bg-white/20 relative">
                        <div className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white/60" />
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </Card>

          {/* Focus List */}
          <Card className="bg-white/[0.02] border-white/10 shadow-xl backdrop-blur-sm" id="focus-list">
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">Focus List</h2>
                  <p className="text-sm text-white/60 mt-1">
                    Detailed analysis of top opportunities
                  </p>
                </div>
                <Badge className="text-sm border-white/20 text-white/80 bg-white/5">
                  4 opportunities found
                </Badge>
              </div>
            </div>
            <ScanResults />
          </Card>
        </main>
      </div>
    </div>
  )
}
