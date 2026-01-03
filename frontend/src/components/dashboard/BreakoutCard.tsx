import { useState } from 'react'
import { BreakoutScan } from '@/hooks/useScanResults'
import { ChevronDown, ChevronUp, TrendingUp } from 'lucide-react'
import { StockChart } from './StockChart'

interface BreakoutCardProps {
  scan: BreakoutScan
}

export function BreakoutCard({ scan }: BreakoutCardProps) {
  const [expanded, setExpanded] = useState(false)
  
  const emaAligned = scan.price > scan.ema21 && scan.ema21 > scan.ema50 && scan.ema50 > scan.ema200
  const distancePercent = scan.distance_pct
  const isActionable = distancePercent <= 3 // Within 3% of trigger
  
  // Setup quality calculation
  const getSetupQuality = () => {
    let score = 0
    if (emaAligned) score += 30
    if (distancePercent <= 2) score += 35 // Close to trigger is good
    if (scan.breakout_score >= 80) score += 20
    if (scan.adr_pct_14 >= 2.5) score += 15
    return Math.min(score, 100)
  }
  
  const setupQuality = getSetupQuality()
  
  const getQualityLabel = () => {
    if (setupQuality >= 85) return { label: '🔥 EXCELLENT', color: 'text-green-400 bg-green-500/20' }
    if (setupQuality >= 75) return { label: '✓ GOOD', color: 'text-cyan-400 bg-cyan-500/20' }
    if (setupQuality >= 65) return { label: '⚠ FAIR', color: 'text-yellow-400 bg-yellow-500/20' }
    return { label: '✗ POOR', color: 'text-red-400 bg-red-500/20' }
  }
  
  const quality = getQualityLabel()

  return (
    <div className="border border-zinc-800 rounded-lg overflow-hidden bg-gradient-to-b from-zinc-900/50 to-zinc-900/20 hover:border-zinc-700 transition-all">
      {/* Header */}
      <div 
        onClick={() => setExpanded(!expanded)}
        className="p-4 cursor-pointer hover:bg-zinc-800/30 transition-colors"
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <h3 className="text-xl font-bold text-white">{scan.symbol}</h3>
              <p className="text-xs text-zinc-500">Market Cap: {(scan.market_cap! / 1_000_000_000).toFixed(1)}B</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className={`px-3 py-1 rounded-full text-sm font-bold ${quality.color}`}>
              {quality.label}
            </div>
            <p className="text-2xl font-bold text-cyan-400">${scan.price.toFixed(2)}</p>
          </div>
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-5 gap-2 text-xs">
          <div className="bg-zinc-800/50 rounded p-2">
            <p className="text-zinc-500 mb-0.5">Score</p>
            <p className={`font-bold ${
              scan.breakout_score >= 80 ? 'text-green-400' :
              scan.breakout_score >= 70 ? 'text-yellow-400' : 'text-orange-400'
            }`}>{scan.breakout_score}/100</p>
          </div>
          <div className="bg-zinc-800/50 rounded p-2">
            <p className="text-zinc-500 mb-0.5">Distance</p>
            <p className={`font-bold ${isActionable ? 'text-green-400' : 'text-yellow-400'}`}>
              {scan.distance_pct.toFixed(2)}%
            </p>
          </div>
          <div className="bg-zinc-800/50 rounded p-2">
            <p className="text-zinc-500 mb-0.5">Trigger</p>
            <p className="font-bold text-amber-400">${scan.trigger_price.toFixed(2)}</p>
          </div>
          <div className="bg-zinc-800/50 rounded p-2">
            <p className="text-zinc-500 mb-0.5">ADR %</p>
            <p className="font-bold text-white">{scan.adr_pct_14.toFixed(2)}%</p>
          </div>
          <div className="bg-zinc-800/50 rounded p-2">
            <p className="text-zinc-500 mb-0.5">Setup</p>
            <p className="font-bold text-cyan-400 text-xs">{scan.setup_type.replace('_', ' ')}</p>
          </div>
        </div>

        {/* EMA Status Bar */}
        <div className="mt-3 p-2 bg-zinc-800/50 rounded flex items-center justify-between">
          <div className="flex items-center gap-2">
            {emaAligned ? (
              <>
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-xs font-semibold text-green-400">Full EMA Alignment ✓</span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                <span className="text-xs font-semibold text-yellow-400">Partial EMA</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-1">
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </div>
      </div>

      {/* Expandable Chart Section */}
      {expanded && (
        <div className="border-t border-zinc-800 p-4 bg-zinc-900/30">
          {/* EMA Details */}
          <div className="mb-4 grid grid-cols-4 gap-2 text-xs">
            <div className="bg-zinc-800/50 rounded p-3 border border-cyan-500/30">
              <p className="text-zinc-500 mb-1">Price vs EMA21</p>
              <p className={`text-lg font-bold ${scan.price > scan.ema21 ? 'text-green-400' : 'text-red-400'}`}>
                ${scan.ema21.toFixed(2)}
              </p>
              <p className="text-xs text-zinc-600 mt-1">
                {scan.price > scan.ema21 ? '✓ Above' : '✗ Below'}
              </p>
            </div>
            <div className="bg-zinc-800/50 rounded p-3 border border-yellow-500/30">
              <p className="text-zinc-500 mb-1">EMA21 vs EMA50</p>
              <p className={`text-lg font-bold ${scan.ema21 > scan.ema50 ? 'text-green-400' : 'text-red-400'}`}>
                ${scan.ema50.toFixed(2)}
              </p>
              <p className="text-xs text-zinc-600 mt-1">
                {scan.ema21 > scan.ema50 ? '✓ Aligned' : '✗ Crossed'}
              </p>
            </div>
            <div className="bg-zinc-800/50 rounded p-3 border border-purple-500/30">
              <p className="text-zinc-500 mb-1">EMA50 vs EMA200</p>
              <p className={`text-lg font-bold ${scan.ema50 > scan.ema200 ? 'text-green-400' : 'text-red-400'}`}>
                ${scan.ema200.toFixed(2)}
              </p>
              <p className="text-xs text-zinc-600 mt-1">
                {scan.ema50 > scan.ema200 ? '✓ Aligned' : '✗ Crossed'}
              </p>
            </div>
            <div className="bg-zinc-800/50 rounded p-3 border border-amber-500/30">
              <p className="text-zinc-500 mb-1">Breakout Level</p>
              <p className="text-lg font-bold text-amber-400">
                ${scan.trigger_price.toFixed(2)}
              </p>
              <p className="text-xs text-zinc-600 mt-1">
                {isActionable ? '✓ Actionable' : '⚠ Waiting'}
              </p>
            </div>
          </div>

          {/* Setup Quality Analysis */}
          <div className="mb-4 p-3 bg-zinc-800/50 rounded border border-zinc-700">
            <p className="text-xs font-semibold text-zinc-400 mb-2 uppercase">Setup Analysis</p>
            <div className="space-y-1.5 text-xs">
              {scan.notes && scan.notes.map((note, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-500"></div>
                  <span className="text-zinc-300 capitalize">{note}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Chart */}
          <div className="border border-zinc-700 rounded-lg overflow-hidden">
            <StockChart scan={scan} />
          </div>
        </div>
      )}
    </div>
  )
}
