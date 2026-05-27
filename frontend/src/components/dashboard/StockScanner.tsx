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
Layers,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { TradeModal } from "./TradeModal"
import { TradingViewWidget } from "./TradingViewWidget"
import { EmbeddedOptionsChain } from "./EmbeddedOptionsChain"
import { OptionsTradePanel } from "./OptionsTradePanel"
import type { OptionsContract } from "./OptionsChain"

type ScanMode = "symbol" | "image" | "content"

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/$/, "")

async function getAuthHeaders(): Promise<Record<string, string>> {
const { supabase } = await import("@/lib/supabase")
const { data } = await supabase.auth.getSession()
const token = data?.session?.access_token
return { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }
}
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
const [optionsPanelContract, setOptionsPanelContract] = useState<OptionsContract | null>(null)
const [optionsPanelOpen, setOptionsPanelOpen] = useState(false)
const [loadingOptionsContract, setLoadingOptionsContract] = useState(false)

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

const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)

const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
const file = e.target.files?.[0]
if (file) {
setSelectedFile(file)
const url = URL.createObjectURL(file)
setImagePreviewUrl(url)
}
}
// Fetch recommended options contract and open OptionsTradePanel directly in trade tab
const handleBuyOptions = async () => {
if (!symbolResult) return
setLoadingOptionsContract(true)
try {
const headers = await getAuthHeaders()
const res = await fetch(`${API_URL}/api/options/chain/${symbolResult.symbol}?limit=50`, { headers })
if (!res.ok) throw new Error(`HTTP ${res.status}`)
const data = await res.json()

const allContracts: OptionsContract[] = symbolResult.direction === "Short"
? (data.puts ?? [])
: (data.calls ?? [])

// Find closest expiry to suggestedExpiry
const expirations: string[] = data.expirations ?? []
const targetExpiry = symbolResult.suggested_expiry
const bestExpiry = targetExpiry
? (expirations.find(e => e >= targetExpiry) ?? expirations[0])
: expirations[0]

// Filter to that expiry
const forExpiry = allContracts.filter((c: OptionsContract) => c.expiration === bestExpiry && c.strike != null)

// Find ATM/OTM strike closest to entry price
const refPrice = symbolResult.suggested_entry ?? symbolResult.price
const sorted = [...forExpiry].sort(
(a: OptionsContract, b: OptionsContract) => Math.abs((a.strike ?? 0) - refPrice) - Math.abs((b.strike ?? 0) - refPrice)
)
const recommended = sorted[0] ?? null

setOptionsPanelContract(recommended)
} catch {
// If fetch fails, open panel with no contract pre-selected (chain tab will show)
setOptionsPanelContract(null)
} finally {
setLoadingOptionsContract(false)
setOptionsPanelOpen(true)
}
}
// Helpers
const recommendationColor = (rec: string) => {
switch (rec) {
case "Strong Buy": return "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
case "Buy": return "bg-green-500/20 text-green-400 border-green-500/40"
case "Watch": return "bg-cyan-500/20 text-cyan-400 border-cyan-500/40"
case "Hold": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/40"
default: return "bg-red-500/20 text-red-400 border-red-500/40"
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

const isShort = symbolResult?.direction === "Short"
return (
<div className="max-w-4xl mx-auto space-y-6">
{/* Input Card */}
<Card className="bg-[#111] border-white/8">
<div className="p-5">
<div className="flex items-center gap-3 mb-5 pb-4 border-b border-white/8">
<Target className="h-4 w-4 text-white/40 shrink-0" />
<span className="text-sm font-semibold text-white tracking-tight">Scanner</span>
<span className="text-white/20 text-sm">/</span>
<span className="text-xs text-white/40 font-mono">Stock · Chart · News</span>
</div>

{/* Mode tabs */}
<div className="flex gap-1 mb-5 p-1 bg-white/5 rounded-xl border border-white/8">
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
<div className="relative rounded-xl overflow-hidden border border-white/10 bg-black/40">
{imagePreviewUrl && <img src={imagePreviewUrl} alt="Chart preview" className="w-full max-h-56 object-contain" />}
<div className="flex items-center gap-2 px-3 py-2 bg-black/40">
<BarChart3 className="h-4 w-4 text-primary shrink-0" />
<span className="text-xs text-white/60 flex-1 truncate">{selectedFile.name} · {(selectedFile.size / 1024).toFixed(0)}KB</span>
<button onClick={() => { setSelectedFile(null); setImagePreviewUrl(null) }} className="p-1 hover:bg-white/10 rounded-lg">
<X className="h-3.5 w-3.5 text-white/50" />
</button>
</div>
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
className="w-full h-10 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm disabled:opacity-50 transition-colors rounded-lg"
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
<Card className="relative overflow-hidden bg-[#111] border-white/8 animate-in fade-in slide-in-from-bottom-8 duration-500">
<div className="" />
<div className="p-5 space-y-5">
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
<Card className="relative overflow-hidden bg-[#111] border-white/8 animate-in fade-in slide-in-from-bottom-8 duration-500">
<div className="" />
<div className="p-5 space-y-5">
<div className="w-full">
<TradingViewWidget
symbol={symbolResult.symbol}
interval="D"
theme="dark"
height={420}
entry={symbolResult.suggested_entry}
stop={symbolResult.suggested_stop}
target={symbolResult.suggested_target}
direction={symbolResult.direction as 'Long' | 'Short' | null}
ema8={symbolResult.ema8}
ema21={symbolResult.ema21}
ema50={symbolResult.ema50}
triggerPrice={symbolResult.trigger_price}
setupType={symbolResult.setup_type}
/>
</div>

{/* Options recommendation banner — only shown when score is high */}
{(() => {
const dir = symbolResult.direction
const score = symbolResult.opportunity_score
if (!dir || score < 70) return null
const isLong = dir === "Long"
const reason = symbolResult.key_factors?.[0] || symbolResult.trend || (isLong ? "Bullish signal" : "Bearish signal")
return (
<div className={cn(
"rounded-xl border px-4 py-3 flex items-center justify-between gap-4 flex-wrap",
isLong
? "bg-emerald-500/10 border-emerald-500/20"
: "bg-red-500/10 border-red-500/20"
)}>
<div className="flex items-center gap-3 min-w-0">
<span className="text-xl shrink-0">{isLong ? "📈" : "📉"}</span>
<div className="min-w-0">
<p className={cn("font-semibold text-sm", isLong ? "text-emerald-400" : "text-red-400")}>
{isLong ? "CALLS recommended" : "PUTS recommended"}
</p>
<p className="text-xs text-white/50 truncate">{reason}</p>
</div>
</div>
<div className="flex items-center gap-5 text-xs shrink-0">
<div className="text-center">
<p className="text-white/40 mb-0.5">Strike</p>
<p className="text-white font-semibold">ATM / Slight OTM</p>
</div>
{symbolResult.suggested_expiry && (
<div className="text-center">
<p className="text-white/40 mb-0.5">Expiry</p>
<p className="text-white font-semibold">{symbolResult.suggested_expiry}</p>
</div>
)}
<div className="text-center">
<p className="text-white/40 mb-0.5">Confidence</p>
<p className={cn("font-semibold", scoreColor(symbolResult.confidence))}>{symbolResult.confidence}%</p>
</div>
</div>
</div>
)
})()}
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
<Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs">
{symbolResult.setup_type === 'FLAT_TOP' ? '📊 Flat Top'
: symbolResult.setup_type === 'FLAG' ? '🚩 Bull Flag'
: symbolResult.setup_type === 'WEDGE' ? '📐 Wedge'
: symbolResult.setup_type === 'BASE' ? '🏗️ Base Breakout'
: '⚡ Breakout Setup'}
</Badge>
)}
</div>
<p className="text-white/50 text-sm">{symbolResult.trend}</p>
</div>
<div className="flex flex-col items-end gap-2">
<div className="text-right">
<p className="text-xs text-white/40 mb-1">Setup Rating</p>
<p className={cn("text-5xl font-bold", scoreColor(symbolResult.opportunity_score))}>{(symbolResult.opportunity_score/10).toFixed(1)}</p>
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
{/* Price + EMA Alignment */}
<div className="grid grid-cols-2 gap-3">
<div className="bg-white/5 border border-white/10 rounded-xl p-4">
<p className="text-xs text-white/50 mb-1">Price</p>
<p className="text-xl font-bold text-white">${symbolResult.price.toFixed(2)}</p>
</div>
<div className="bg-white/5 border border-white/10 rounded-xl p-4">
<p className="text-xs text-white/50 mb-2">EMA Alignment</p>
<div className="space-y-1.5">
<div className="flex items-center justify-between text-xs">
<span className="text-white/50">EMA 8</span>
{symbolResult.ema8 != null
? <span className="flex items-center gap-1.5"><span className="text-white font-medium">${symbolResult.ema8.toFixed(2)}</span>{emaStatus(symbolResult.price, symbolResult.ema8)}</span>
: <span className="text-white/30">N/A</span>}
</div>
<div className="flex items-center justify-between text-xs">
<span className="text-white/50">EMA 21</span>
{symbolResult.ema21 != null
? <span className="flex items-center gap-1.5"><span className="text-white font-medium">${symbolResult.ema21.toFixed(2)}</span>{emaStatus(symbolResult.price, symbolResult.ema21)}</span>
: <span className="text-white/30">N/A</span>}
</div>
<div className="flex items-center justify-between text-xs">
<span className="text-white/50">EMA 50</span>
{symbolResult.ema50 != null
? <span className="flex items-center gap-1.5"><span className="text-white font-medium">${symbolResult.ema50.toFixed(2)}</span>{emaStatus(symbolResult.price, symbolResult.ema50)}</span>
: <span className="text-white/30">N/A</span>}
</div>
</div>
</div>
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
{/* Technical Analysis */}
<div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-3">
<div className="flex items-center gap-2 mb-1">
<BarChart3 className="h-4 w-4 text-primary" />
<h4 className="text-sm font-semibold text-white/80 uppercase tracking-wider">Technical Analysis</h4>
<span className="ml-auto text-xs text-white/40">{symbolResult.setup_type ?? "UNKNOWN"}</span>
</div>
<div className="grid grid-cols-2 gap-3 text-sm">
<div className="bg-white/5 rounded-lg p-3">
<p className="text-xs text-white/40 mb-1">Trend Structure</p>
<p className={cn("font-semibold", symbolResult.direction === "Long" ? "text-emerald-400" : symbolResult.direction === "Short" ? "text-red-400" : "text-white/60")}>
{symbolResult.trend}
</p>
</div>
<div className="bg-white/5 rounded-lg p-3">
<p className="text-xs text-white/40 mb-1">EMA Stack</p>
<p className={cn("font-semibold text-xs leading-relaxed", symbolResult.direction === "Long" ? "text-emerald-400" : "text-red-400")}>
{symbolResult.price > (symbolResult.ema8 ?? 0) && symbolResult.price > (symbolResult.ema21 ?? 0) && symbolResult.price > (symbolResult.ema50 ?? 0)
? "Price above all EMAs ✓"
: symbolResult.price < (symbolResult.ema8 ?? Infinity) && symbolResult.price < (symbolResult.ema21 ?? Infinity) && symbolResult.price < (symbolResult.ema50 ?? Infinity)
? "Price below all EMAs ✗"
: "Mixed EMA structure"}
</p>
</div>
<div className="bg-white/5 rounded-lg p-3">
<p className="text-xs text-white/40 mb-1">Setup Pattern</p>
<p className="font-semibold text-white">
{symbolResult.setup_type === "FLAT_TOP" ? "Flat Top Breakout"
: symbolResult.setup_type === "WEDGE" ? "Wedge Pattern"
: symbolResult.setup_type === "FLAG" ? "Bull/Bear Flag"
: symbolResult.setup_type === "BASE" ? "Consolidation Base"
: "No Clear Pattern"}
</p>
</div>
<div className="bg-white/5 rounded-lg p-3">
<p className="text-xs text-white/40 mb-1">Volatility (ADR)</p>
<p className={cn("font-semibold", symbolResult.adr_pct_14 >= 5 ? "text-emerald-400" : symbolResult.adr_pct_14 >= 2 ? "text-yellow-400" : "text-white/60")}>
{symbolResult.adr_pct_14.toFixed(2)}% {symbolResult.adr_pct_14 >= 5 ? "— High mover" : symbolResult.adr_pct_14 >= 2 ? "— Moderate" : "— Low range"}
</p>
</div>
</div>
{symbolResult.passes_breakout_filter && (
<div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2 text-xs text-emerald-400 font-medium flex items-center gap-2">
<span>✓</span> Passes breakout filter — watching for volume confirmation above trigger
</div>
)}
</div>
{/* Breakout setup */}
{symbolResult.passes_breakout_filter && symbolResult.trigger_price && (
<div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-5">
<div className="flex items-center gap-2 mb-3">
<Target className="h-4 w-4 text-emerald-400" />
<h4 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider">Breakout Setup — {symbolResult.setup_type}</h4>
<span className="ml-auto text-2xl font-bold text-emerald-400">{((symbolResult.breakout_score ?? 0)/10).toFixed(1)}/10</span>
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

{/* Fundamental Analysis — Bull Case */}
{(symbolResult.bull_case || (symbolResult.fundamental_snapshot && symbolResult.fundamental_snapshot.length > 0)) && (
<div className="bg-gradient-to-br from-amber-500/8 to-orange-500/5 border border-amber-500/20 rounded-xl p-5 space-y-3">
<div className="flex items-center gap-2">
<span className="text-base">🌱</span>
<h4 className="text-sm font-semibold text-amber-400 uppercase tracking-wider">Fundamental Analysis — Bull Case</h4>
</div>
{symbolResult.bull_case && (
<p className="text-white/80 text-sm leading-relaxed">{symbolResult.bull_case}</p>
)}
{symbolResult.fundamental_snapshot && symbolResult.fundamental_snapshot.length > 0 && (
<div className="space-y-2 pt-1">
{symbolResult.fundamental_snapshot.map((point, i) => (
<div key={i} className="flex items-start gap-2.5 bg-white/4 rounded-lg px-3 py-2">
<span className="text-amber-400/70 text-xs font-bold shrink-0 mt-0.5">{i + 1}</span>
<span className="text-xs text-white/70 leading-relaxed">{point}</span>
</div>
))}
</div>
)}
</div>
)}
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
{/* ── Unified Trade Buttons ── */}
<div className="space-y-2">
{/* Split button row: Buy Shares | Buy Options */}
<div className="grid grid-cols-2 gap-3">
{/* Buy Shares */}
<Button
onClick={() => setTradeModalOpen(true)}
className={cn(
"h-12 font-semibold text-base shadow-lg transition-all",
isShort
? "bg-linear-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white shadow-red-500/25"
: "bg-linear-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white shadow-emerald-500/25"
)}
>
<Crosshair className="mr-2 h-4 w-4" />
{isShort ? "Short" : "Buy"} Shares
</Button>

{/* Buy Options */}
<Button
onClick={handleBuyOptions}
disabled={loadingOptionsContract}
className={cn(
"h-12 font-semibold text-base shadow-lg transition-all border",
isShort
? "bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20 hover:border-red-500/50 shadow-red-500/10"
: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/50 shadow-emerald-500/10"
)}
>
{loadingOptionsContract ? (
<><Loader className="mr-2 h-4 w-4 animate-spin" />Loading contract...</>
) : (
<><Layers className="mr-2 h-4 w-4" />{isShort ? "Buy Puts" : "Buy Calls"}</>
)}
</Button>
</div>
{/* Hint line */}
<p className="text-[11px] text-white/30 text-center">
Opens with AI-recommended {isShort ? "put" : "call"} contract pre-selected
{symbolResult.suggested_expiry ? ` · Exp ${symbolResult.suggested_expiry}` : ""}
</p>
</div>
</div>
)}
{/* Embedded options chain — kept as browse/secondary reference */}
{symbolResult.direction && (
<div className="bg-white/3 border border-white/10 rounded-xl p-4">
<EmbeddedOptionsChain
ticker={symbolResult.symbol}
currentPrice={symbolResult.price}
entryPrice={symbolResult.suggested_entry}
stopPrice={symbolResult.suggested_stop}
suggestedExpiry={symbolResult.suggested_expiry}
direction={symbolResult.direction as "Long" | "Short" | null}
onTradeClick={(contract) => {
setOptionsPanelContract(contract)
setOptionsPanelOpen(true)
}}
/>
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
{/* Trade Modal (shares) */}
{symbolResult && (
<TradeModal
open={tradeModalOpen}
onClose={() => setTradeModalOpen(false)}
symbol={symbolResult.symbol}
action={symbolResult.direction === "Short" ? "SELL" : "BUY"}
price={symbolResult.suggested_entry ?? undefined}
/>
)}
{/* Options Trade Panel — opens directly to recommended contract */}
{symbolResult && optionsPanelOpen && (
<OptionsTradePanel
ticker={symbolResult.symbol}
isOpen={optionsPanelOpen}
onClose={() => { setOptionsPanelOpen(false); setOptionsPanelContract(null) }}
initialContract={optionsPanelContract ?? undefined}
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
resolve(result.split(",")[1])
}
reader.onerror = reject
reader.readAsDataURL(file)
})
}
