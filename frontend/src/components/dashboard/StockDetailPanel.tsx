import { BreakoutScan } from '@/hooks/useScanResults'
import { X } from 'lucide-react'
import { StockChart } from './StockChart'

interface StockDetailPanelProps {
  scan: BreakoutScan | null
  onClose: () => void
}

export function StockDetailPanel({ scan, onClose }: StockDetailPanelProps) {
  if (!scan) return null

  const formatNumber = (value: number, decimals: number = 2) => {
    return value.toFixed(decimals)
  }

  const formatMarketCap = (value?: number) => {
    if (!value) return 'N/A'
    if (value >= 1_000_000_000_000) {
      return `$${(value / 1_000_000_000_000).toFixed(2)} Trillion`
    }
    if (value >= 1_000_000_000) {
      return `$${(value / 1_000_000_000).toFixed(2)} Billion`
    }
    return `$${(value / 1_000_000).toFixed(2)} Million`
  }

  const formatVolume = (value: number) => {
    if (value >= 1_000_000) {
      return `${(value / 1_000_000).toFixed(2)} Million`
    }
    return `${(value / 1_000).toFixed(0)} Thousand`
  }

  const emaAligned = scan.price > scan.ema21 && scan.ema21 > scan.ema50 && scan.ema50 > scan.ema200
  const priceTo21 = ((scan.price / scan.ema21 - 1) * 100).toFixed(2)
  const ema21To50 = ((scan.ema21 / scan.ema50 - 1) * 100).toFixed(2)
  const ema50To200 = ((scan.ema50 / scan.ema200 - 1) * 100).toFixed(2)

  return (
    <div className="fixed inset-y-0 right-0 w-full md:w-[900px] bg-zinc-900 border-l border-zinc-800 shadow-2xl overflow-y-auto z-50">
      {/* Header */}
      <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 p-6 flex items-center justify-between z-10">
        <div>
          <h2 className="text-2xl font-bold text-white">{scan.symbol}</h2>
          <p className="text-sm text-zinc-400">{formatMarketCap(scan.market_cap)}</p>
        </div>
        <button
          onClick={onClose}
          className="p-2 text-zinc-400 hover:text-white transition-colors rounded-lg hover:bg-zinc-800"
        >
          <X size={24} />
        </button>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Price Chart with EMAs */}
        <div className="bg-zinc-800/50 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-zinc-400 uppercase mb-4">Price Action & Trend Analysis</h3>
          <StockChart scan={scan} />
        </div>
        {/* Price & Trigger Section */}
        <div className="bg-zinc-800/50 rounded-lg p-4 space-y-3">
          <h3 className="text-sm font-semibold text-zinc-400 uppercase">Breakout Setup</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-zinc-500 mb-1">Current Price</p>
              <p className="text-2xl font-bold text-white">${formatNumber(scan.price)}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 mb-1">Trigger Price</p>
              <p className="text-2xl font-bold text-cyan-400">${formatNumber(scan.trigger_price)}</p>
            </div>
          </div>
          <div className="pt-3 border-t border-zinc-700">
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-400">Distance to Trigger</span>
              <span className="text-lg font-bold text-cyan-400">{formatNumber(scan.distance_pct)}%</span>
            </div>
            <div className="mt-2 bg-zinc-700 rounded-full h-2 overflow-hidden">
              <div
                className="bg-cyan-500 h-full transition-all duration-500"
                style={{ width: `${Math.min(100, (scan.distance_pct / 5) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Score Section */}
        <div className="bg-zinc-800/50 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-zinc-400 uppercase mb-3">Quality Score</h3>
          <div className="flex items-end gap-4">
            <div className="text-5xl font-bold text-cyan-400">{scan.breakout_score}</div>
            <div className="flex-1 pb-2">
              <div className="bg-zinc-700 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    scan.breakout_score >= 80
                      ? 'bg-green-500'
                      : scan.breakout_score >= 70
                      ? 'bg-yellow-500'
                      : 'bg-orange-500'
                  }`}
                  style={{ width: `${scan.breakout_score}%` }}
                />
              </div>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className={`px-3 py-1 text-sm font-medium rounded-lg ${
              scan.setup_type === 'FLAT_TOP' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
              scan.setup_type === 'WEDGE' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
              scan.setup_type === 'FLAG' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' :
              scan.setup_type === 'BASE' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
              'bg-gray-500/20 text-gray-300 border border-gray-500/30'
            }`}>
              {scan.setup_type.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* EMA Analysis Section */}
        <div className="bg-zinc-800/50 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-400 uppercase">EMA Analysis</h3>
            {emaAligned && (
              <span className="px-2 py-1 bg-green-500/20 text-green-300 text-xs font-medium rounded border border-green-500/30">
                ✓ Aligned
              </span>
            )}
          </div>

          {/* Price vs EMA21 */}
          <div className="flex items-center justify-between py-2 border-b border-zinc-700">
            <div>
              <p className="text-sm text-zinc-300">Price vs EMA21</p>
              <p className="text-xs text-zinc-500">${formatNumber(scan.price)} vs ${formatNumber(scan.ema21)}</p>
            </div>
            <div className="text-right">
              <p className={`text-sm font-semibold ${parseFloat(priceTo21) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {parseFloat(priceTo21) >= 0 ? '+' : ''}{priceTo21}%
              </p>
              <p className="text-xs text-zinc-500">
                {scan.price > scan.ema21 ? '✓ above' : '✗ below'}
              </p>
            </div>
          </div>

          {/* EMA21 vs EMA50 */}
          <div className="flex items-center justify-between py-2 border-b border-zinc-700">
            <div>
              <p className="text-sm text-zinc-300">EMA21 vs EMA50</p>
              <p className="text-xs text-zinc-500">${formatNumber(scan.ema21)} vs ${formatNumber(scan.ema50)}</p>
            </div>
            <div className="text-right">
              <p className={`text-sm font-semibold ${parseFloat(ema21To50) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {parseFloat(ema21To50) >= 0 ? '+' : ''}{ema21To50}%
              </p>
              <p className="text-xs text-zinc-500">
                {scan.ema21 > scan.ema50 ? '✓ above' : '✗ below'}
              </p>
            </div>
          </div>

          {/* EMA50 vs EMA200 */}
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm text-zinc-300">EMA50 vs EMA200</p>
              <p className="text-xs text-zinc-500">${formatNumber(scan.ema50)} vs ${formatNumber(scan.ema200)}</p>
            </div>
            <div className="text-right">
              <p className={`text-sm font-semibold ${parseFloat(ema50To200) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {parseFloat(ema50To200) >= 0 ? '+' : ''}{ema50To200}%
              </p>
              <p className="text-xs text-zinc-500">
                {scan.ema50 > scan.ema200 ? '✓ above' : '✗ below'}
              </p>
            </div>
          </div>
        </div>

        {/* Volatility & Volume Section */}
        <div className="bg-zinc-800/50 rounded-lg p-4 space-y-3">
          <h3 className="text-sm font-semibold text-zinc-400 uppercase">Volatility & Volume</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-300">ADR (14-day)</span>
              <span className="text-sm font-semibold text-white">{formatNumber(scan.adr_pct_14)}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-300">Avg Volume (50-day)</span>
              <span className="text-sm font-semibold text-white">{formatVolume(scan.avg_vol_50)}</span>
            </div>
          </div>
        </div>

        {/* Notes Section */}
        {scan.notes && scan.notes.length > 0 && (
          <div className="bg-zinc-800/50 rounded-lg p-4 space-y-3">
            <h3 className="text-sm font-semibold text-zinc-400 uppercase">Pattern Notes</h3>
            <div className="flex flex-wrap gap-2">
              {scan.notes.map((note, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 bg-zinc-700 text-zinc-300 text-xs rounded border border-zinc-600"
                >
                  {note}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Scanned At */}
        <div className="text-center text-xs text-zinc-500 pt-4 border-t border-zinc-800">
          Scanned {new Date(scan.scanned_at).toLocaleString()}
        </div>
      </div>
    </div>
  )
}
