import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { aiScanSymbol, analyzeContent, addToWatchlist, type AISymbolAnalysis } from "@/lib/api"
import {
  Upload,
  Search,
  AlertCircle,
  Loader,
  X,
  BarChart3,
  Sparkles,
  TrendingUp,
  ShieldAlert,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Crosshair,
  Star,
  Check,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { TradeModal } from "./TradeModal"
import { TradingViewWidget } from "./TradingViewWidget"

type ScanMode = "symbol" | "image" | "content"

export function StockScanner() {
  const [mode, setMode] = useState<ScanMode>("symbol")
  const [symbol, setSymbol] = useState("")
  const [textContent, setTextContent] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [symbolResult, setSymbolResult] = useState<AISymbolAnalysis | null>(null)
  const [contentResult, setContentResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [tradeModalOpen, setTradeModalOpen] = useState(false)
  const [focusAdded, setFocusAdded] = useState(false)

  const resetResults = () => {
    setSymbolResult(null)
    setContentResult(null)
    setError(null)
    setFocusAdded(false)
  }

  const handleAddToFocusList = async () => {
    if (!symbolResult || focusAdded) return
    try {
      await addToWatchlist(symbolResult.symbol)
    } finally {
      setFocusAdded(true)
    }
  }

  const switchMode = (m: ScanMode) => {
    setMode(m)
    resetResults()
  }

  const handleScanSymbol = async () => {
    const sym = symbol.trim().toUpperCase().split(" ")[0]
    if (!sym || !/^[A-Z]{1,10}$/.test(sym)) {
      setError("Enter a valid ticker symbol (letters only, e.g. AAPL)")
      return
    }
    setIsScanning(true)
    resetResults()
    try {
      const data = await aiScanSymbol(sym)
      setSymbolResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyse symbol")
    } finally {
      setIsScanning(false)
    }
  }

  const handleScanImage = async () => {
    if (!selectedFile) return
    setIsScanning(true)
    resetResults()
    try {
      const base64 = await fileToBase64(selectedFile)
      const mediaType = selectedFile.type || "image/png"
      const analysis = await analyzeContent({ imageBase64: base64, mediaType })
      setContentResult(analysis)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyse image")
    } finally {
      setIsScanning(false)
    }
  }

  const handleScanContent = async () => {
    if (!textContent.trim()) return
    setIsScanning(true)
    resetResults()
    try {
      const analysis = await analyzeContent({ textContent: textContent.trim() })
      setContentResult(analysis)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyse content")
    } finally {
      setIsScanning(false)
    }
  }

  const handleScan = () => {
    if (mode === "symbol") handleScanSymbol()
    else if (mode === "image") handleScanImage()
    else handleScanContent()
  }

  const canScan = () => {
    if (isScanning) return false
    if (mode === "symbol") return !!symbol.trim()
    if (mode === "image") return !!selectedFile
    return !!textContent.trim()
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setSelectedFile(file)
  }

  // Helpers
  const recommendationColor = (rec: string) => {
    switch (rec) {
      case "Strong Buy": return "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
      case "Buy":        return "bg-green-500/20 text-green-400 border-green-500/40"
      case "Watch":      return "bg-cyan-500/20 text-cyan-400 border-cyan-500/40"
      case "Hold":       return "bg-yellow-500/20 text-yellow-400 border-yellow-500/40"
      default:           return "bg-red-500/20 text-red-400 border-red-500/40"
    }
  }
  const riskColor = (risk: string) => risk === "Low" ? "text-emerald-400" : risk === "Medium" ? "text-yellow-400" : "text-red-400"
  const scoreColor = (s: number) => s >= 70 ? "text-emerald-400" : s >= 45 ? "text-yellow-400" : "text-red-400"
  const emaStatus = (price: number, ema: number | null) => {
    if (ema === null) return null
    return price > ema
      ? <span className="text-emerald-400 text-xs">▲ above</span>
      : <span className="text-red-400 text-xs">▼ below</span>
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Input Card */}
      <Card className="relative overflow-hidden bg-linear-to-br from-white/7 to-white/2 border-white/10 backdrop-blur-xl shadow-2xl">
        <div className="absolute inset-0 bg-linear-to-br from-primary/5 via-transparent to-emerald-500/5 pointer-events-none" />
        <div className="relative p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-xl" />
                <div className="relative p-3 rounded-2xl bg-linear-to-br from-primary/20 to-primary/10 border border-primary/20">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white tracking-tight">AI Stock Scanner</h3>
                <p className="text-sm text-white/50 mt-0.5">Multi-modal analysis powered by advanced AI</p>
              </div>
            </div>
          </div>

          {/* Mode tabs */}
          <div className="flex gap-1 mb-8 p-1 bg-white/5 rounded-xl border border-white/10">
            {([
              { key: "symbol" as const, icon: Search, label: "Stock Symbol" },
              { key: "image" as const, icon: Upload, label: "Chart Image" },
              { key: "content" as const, icon: BarChart3, label: "News Content" },
            ]).map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                onClick={() => switchMode(key)}
                className={cn(
                  "flex-1 px-5 py-3 text-sm font-medium rounded-lg transition-all duration-200",
                  mode === key
                    ? "bg-white/10 text-white shadow-lg ring-1 ring-white/20"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                )}
              >
                <Icon className="h-4 w-4 inline-block mr-2 -mt-0.5" />
                {label}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {/* Symbol input */}
            {mode === "symbol" && (
              <>
                <label className="text-xs font-semibold text-white/70 uppercase tracking-widest">Stock Symbol</label>
                <Input
                  placeholder="e.g. AAPL, TSLA, NVDA"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && handleScan()}
                  maxLength={10}
                  className="h-14 bg-white/5 border-white/10 text-white text-lg placeholder:text-white/40 focus:bg-white/7 focus:border-primary/50"
                />
                <p className="text-xs text-white/40 flex items-center gap-1.5">
                  <span className="h-1 w-1 rounded-full bg-primary/50 inline-block" />
                  Sean will analyse trend, EMAs, volume, ADR, and breakout potential using live market data
                </p>
              </>
            )}

            {/* Chart image upload */}
            {mode === "image" && (
              <>
                <label className="text-xs font-semibold text-white/70 uppercase tracking-widest">Upload Chart Screenshot</label>
                <div className="relative group">
                  <div className="border-2 border-dashed border-white/20 rounded-2xl p-10 text-center hover:border-primary/50 hover:bg-white/5 transition-all cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <div className="inline-block mb-3 p-3 bg-white/5 rounded-xl border border-white/10">
                      <Upload className="h-7 w-7 text-white/60" />
                    </div>
                    <p className="text-white font-medium mb-1">Drop your chart here or click to browse</p>
                    <p className="text-xs text-white/40">PNG, JPG, GIF up to 10MB</p>
                  </div>
                </div>
                {selectedFile && (
                  <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
                    <BarChart3 className="h-5 w-5 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{selectedFile.name}</p>
                      <p className="text-xs text-white/40">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <button onClick={() => setSelectedFile(null)} className="p-1.5 hover:bg-white/10 rounded-lg">
                      <X className="h-4 w-4 text-white/50" />
                    </button>
                  </div>
                )}
                <p className="text-xs text-white/40 flex items-center gap-1.5">
                  <span className="h-1 w-1 rounded-full bg-primary/50 inline-block" />
                  Sean will identify patterns, support/resistance, and potential setups from your chart
                </p>
              </>
            )}

            {/* News/content text */}
            {mode === "content" && (
              <>
                <label className="text-xs font-semibold text-white/70 uppercase tracking-widest">News or Analysis Content</label>
                <textarea
                  placeholder="Paste news articles, earnings reports, analyst opinions, or any market commentary..."
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  className="w-full h-40 bg-white/5 border border-white/10 text-white placeholder:text-white/40 rounded-xl p-4 resize-none focus:bg-white/7 focus:border-primary/50 transition-all leading-relaxed"
                />
                <p className="text-xs text-white/40 flex items-center gap-1.5">
                  <span className="h-1 w-1 rounded-full bg-primary/50 inline-block" />
                  Sean will extract key stocks, sentiment, and trade opportunities from the text
                </p>
              </>
            )}

            <Button
              onClick={handleScan}
              disabled={!canScan()}
              size="lg"
              className="w-full h-14 bg-linear-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-semibold text-base shadow-lg shadow-emerald-500/25 disabled:opacity-50 transition-all"
            >
              {isScanning ? (
                <><Loader className="mr-2.5 h-5 w-5 animate-spin" />Sean is analysing...</>
              ) : (
                <><Sparkles className="mr-2.5 h-5 w-5" />Start AI Analysis</>
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* Error */}
      {error && (
        <Card className="bg-red-500/10 border-red-500/20 p-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-white mb-1">Analysis Failed</p>
              <p className="text-sm text-white/60">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="text-white/40 hover:text-white"><X className="h-4 w-4" /></button>
          </div>
        </Card>
      )}

      {/* Content result (image / news) */}
      {contentResult && (
        <Card className="relative overflow-hidden bg-linear-to-br from-white/7 to-white/2 border-white/10 backdrop-blur-xl shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-500">
          <div className="absolute inset-0 bg-linear-to-br from-emerald-500/5 via-transparent to-primary/5 pointer-events-none" />
          <div className="relative p-8 space-y-6">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h3 className="text-xl font-bold text-white">Sean's Analysis</h3>
            </div>
            <div className="text-white/80 leading-relaxed whitespace-pre-wrap">{contentResult}</div>
            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <p className="text-xs text-white/30">Not financial advice.</p>
              <Button onClick={resetResults} variant="outline" size="sm" className="border-white/20 text-white/60 hover:text-white hover:bg-white/5">
                <X className="mr-1.5 h-3.5 w-3.5" />New Scan
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Symbol result */}
      {symbolResult && (
        <Card className="relative overflow-hidden bg-linear-to-br from-white/7 to-white/2 border-white/10 backdrop-blur-xl shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-500">
          <div className="absolute inset-0 bg-linear-to-br from-emerald-500/5 via-transparent to-primary/5 pointer-events-none" />
          <div className="relative p-8 space-y-8">
            <div className="rounded-xl overflow-hidden bg-black/60 border border-white/10 h-[420px]">
              <TradingViewWidget
                symbol={symbolResult.symbol}
                interval="D"
                theme="dark"
                height={420}
                entry={symbolResult.suggested_entry}
                stop={symbolResult.suggested_stop}
                target={symbolResult.suggested_target}
                direction={symbolResult.direction as 'Long' | 'Short' | null}
              />
            </div>

            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-3xl font-bold text-white">{symbolResult.symbol}</h2>
                  {symbolResult.direction && (
                    <Badge className={cn(
                      "border px-3 py-1.5 text-sm font-bold flex items-center gap-1.5",
                      symbolResult.direction === "Long"
                        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                        : "bg-red-500/20 text-red-400 border-red-500/40"
                    )}>
                      {symbolResult.direction === "Long"
                        ? <ArrowUpRight className="h-4 w-4" />
                        : <ArrowDownRight className="h-4 w-4" />}
                      {symbolResult.direction.toUpperCase()}
                    </Badge>
                  )}
                  <Badge className={cn("border px-3 py-1 text-sm font-semibold", recommendationColor(symbolResult.recommendation))}>
                    {symbolResult.recommendation}
                  </Badge>
                  {symbolResult.passes_breakout_filter && (
                    <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs">Breakout Setup</Badge>
                  )}
                </div>
                <p className="text-white/50 text-sm">{symbolResult.trend}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="text-right">
                  <p className="text-xs text-white/40 mb-1">Opportunity Score</p>
                  <p className={cn("text-5xl font-bold", scoreColor(symbolResult.opportunity_score))}>{symbolResult.opportunity_score}</p>
                  <p className="text-xs text-white/30 mt-1">Confidence {symbolResult.confidence}%</p>
                </div>
                <button
                  onClick={handleAddToFocusList}
                  disabled={focusAdded}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border",
                    focusAdded
                      ? "bg-pink-500/20 border-pink-500/40 text-pink-400 cursor-default"
                      : "bg-white/5 border-white/10 text-white/50 hover:text-pink-400 hover:border-pink-500/30 hover:bg-pink-500/10"
                  )}
                >
                  {focusAdded ? <Check className="h-3 w-3" /> : <Star className="h-3 w-3" />}
                  {focusAdded ? "In Focus List" : "Add to Focus List"}
                </button>
              </div>
            </div>

            {/* Price + EMA */}
            <div className="grid grid-cols-4 gap-3">
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <p className="text-xs text-white/50 mb-1">Price</p>
                <p className="text-xl font-bold text-white">${symbolResult.price.toFixed(2)}</p>
              </div>
              {([
                { label: "EMA 21", val: symbolResult.ema21 },
                { label: "EMA 50", val: symbolResult.ema50 },
                { label: "EMA 200", val: symbolResult.ema200 },
              ] as const).map(({ label, val }) => (
                <div key={label} className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <p className="text-xs text-white/50 mb-1">{label}</p>
                  {val !== null ? (
                    <div>
                      <p className="text-xl font-bold text-white">${val.toFixed(2)}</p>
                      <div>{emaStatus(symbolResult.price, val)}</div>
                    </div>
                  ) : <p className="text-white/30 text-sm">N/A</p>}
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <p className="text-xs text-white/50 mb-1">ADR (14-day)</p>
                <p className="text-lg font-bold text-white">{symbolResult.adr_pct_14.toFixed(2)}%</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <p className="text-xs text-white/50 mb-1">Avg Vol (50d)</p>
                <p className="text-lg font-bold text-white">
                  {symbolResult.avg_vol_50 >= 1_000_000 ? `${(symbolResult.avg_vol_50 / 1_000_000).toFixed(1)}M` : `${(symbolResult.avg_vol_50 / 1_000).toFixed(0)}K`}
                </p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <p className="text-xs text-white/50 mb-1">Risk Level</p>
                <p className={cn("text-lg font-bold", riskColor(symbolResult.risk_level))}>{symbolResult.risk_level}</p>
              </div>
            </div>

            {/* Breakout setup */}
            {symbolResult.passes_breakout_filter && symbolResult.trigger_price && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="h-4 w-4 text-emerald-400" />
                  <h4 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider">Breakout Setup — {symbolResult.setup_type}</h4>
                  <span className="ml-auto text-2xl font-bold text-emerald-400">{symbolResult.breakout_score}/100</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><p className="text-white/50 mb-0.5">Breakout Level</p><p className="font-bold text-white">${symbolResult.trigger_price.toFixed(2)}</p></div>
                  <div><p className="text-white/50 mb-0.5">Distance</p><p className="font-bold text-white">{symbolResult.distance_pct?.toFixed(2)}% away</p></div>
                </div>
              </div>
            )}

            {/* AI analysis */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <h4 className="text-sm font-semibold text-white/80 uppercase tracking-wider">Sean's Analysis</h4>
              </div>
              <p className="text-white/80 leading-relaxed">{symbolResult.analysis}</p>
              {symbolResult.key_factors.length > 0 && (
                <div className="grid gap-2">
                  {symbolResult.key_factors.map((f, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-white/70">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary/60 shrink-0" />{f}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Trade Setup Card */}
            {(symbolResult.suggested_entry || symbolResult.entry_notes || symbolResult.stop_notes) && (
              <div className={cn(
                "rounded-xl border p-5 space-y-4",
                symbolResult.direction === "Long"
                  ? "bg-emerald-500/5 border-emerald-500/20"
                  : symbolResult.direction === "Short"
                  ? "bg-red-500/5 border-red-500/20"
                  : "bg-white/5 border-white/10"
              )}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Crosshair className="h-4 w-4 text-white/70" />
                    <h4 className="text-sm font-semibold text-white uppercase tracking-wider">Trade Setup</h4>
                  </div>
                  {symbolResult.suggested_entry && symbolResult.suggested_stop && symbolResult.suggested_target && (
                    (() => {
                      const risk = Math.abs(symbolResult.suggested_entry! - symbolResult.suggested_stop!)
                      const reward = Math.abs(symbolResult.suggested_target! - symbolResult.suggested_entry!)
                      const rr = risk > 0 ? (reward / risk).toFixed(1) : "—"
                      return (
                        <Badge className={cn(
                          "border px-3 py-1 text-sm font-bold",
                          Number(rr) >= 2 ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                            : Number(rr) >= 1 ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/40"
                            : "bg-red-500/20 text-red-400 border-red-500/40"
                        )}>
                          R:R {rr}:1
                        </Badge>
                      )
                    })()
                  )}
                </div>

                {/* Price levels */}
                {(symbolResult.suggested_entry || symbolResult.suggested_stop || symbolResult.suggested_target) && (
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5 mb-1">
                        <TrendingUp className="h-3.5 w-3.5 text-cyan-400" />
                        <p className="text-[10px] font-semibold text-cyan-400 uppercase tracking-wider">Entry</p>
                      </div>
                      <p className="text-xl font-bold text-white">
                        {symbolResult.suggested_entry ? `$${symbolResult.suggested_entry.toFixed(2)}` : "—"}
                      </p>
                    </div>
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5 mb-1">
                        <ShieldAlert className="h-3.5 w-3.5 text-red-400" />
                        <p className="text-[10px] font-semibold text-red-400 uppercase tracking-wider">Stop</p>
                      </div>
                      <p className="text-xl font-bold text-white">
                        {symbolResult.suggested_stop ? `$${symbolResult.suggested_stop.toFixed(2)}` : "—"}
                      </p>
                    </div>
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5 mb-1">
                        <Target className="h-3.5 w-3.5 text-emerald-400" />
                        <p className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">Target</p>
                      </div>
                      <p className="text-xl font-bold text-white">
                        {symbolResult.suggested_target ? `$${symbolResult.suggested_target.toFixed(2)}` : "—"}
                      </p>
                    </div>
                  </div>
                )}

                {/* Expiry + Notes */}
                <div className="space-y-3">
                  {symbolResult.suggested_expiry && (
                    <div className="flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 rounded-lg px-4 py-2.5">
                      <span className="text-[10px] font-semibold text-purple-400 uppercase tracking-wider">Contract Expiry</span>
                      <span className="text-sm font-bold text-white ml-auto">{symbolResult.suggested_expiry}</span>
                    </div>
                  )}
                  {(symbolResult.entry_notes || symbolResult.stop_notes) && (
                    <div className="grid grid-cols-2 gap-3">
                      {symbolResult.entry_notes && (
                        <div className="bg-white/5 rounded-lg p-3">
                          <p className="text-xs text-cyan-400 font-medium mb-1">Entry Notes</p>
                          <p className="text-sm text-white/70">{symbolResult.entry_notes}</p>
                        </div>
                      )}
                      {symbolResult.stop_notes && (
                        <div className="bg-white/5 rounded-lg p-3">
                          <p className="text-xs text-orange-400 font-medium mb-1">Stop Notes</p>
                          <p className="text-sm text-white/70">{symbolResult.stop_notes}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Trade button */}
                <Button
                  onClick={() => setTradeModalOpen(true)}
                  className={cn(
                    "w-full h-12 font-semibold text-base shadow-lg transition-all",
                    symbolResult.direction === "Short"
                      ? "bg-linear-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white shadow-red-500/25"
                      : "bg-linear-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white shadow-emerald-500/25"
                  )}
                >
                  <Crosshair className="mr-2 h-4.5 w-4.5" />
                  {symbolResult.direction === "Short" ? "Short" : "Buy"} {symbolResult.symbol}
                  {symbolResult.suggested_entry ? ` @ $${symbolResult.suggested_entry.toFixed(2)}` : ""}
                </Button>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <p className="text-xs text-white/30">Not financial advice. Always use a stop-loss and size positions appropriately.</p>
              <Button onClick={() => { resetResults(); setSymbol("") }} variant="outline" size="sm" className="border-white/20 text-white/60 hover:text-white hover:bg-white/5">
                <X className="mr-1.5 h-3.5 w-3.5" />New Scan
              </Button>
            </div>
          </div>
        </Card>
      )}
      {/* Trade Modal */}
      {symbolResult && (
        <TradeModal
          open={tradeModalOpen}
          onClose={() => setTradeModalOpen(false)}
          symbol={symbolResult.symbol}
          action={symbolResult.direction === "Short" ? "SELL" : "BUY"}
          price={symbolResult.suggested_entry ?? undefined}
        />
      )}
    </div>
  )
}

/** Convert a File to raw base64 string (no data: prefix) */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // Strip the "data:image/png;base64," prefix
      resolve(result.split(",")[1])
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
