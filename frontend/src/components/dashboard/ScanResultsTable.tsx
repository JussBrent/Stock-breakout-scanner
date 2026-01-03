import { useState } from 'react'
import { BreakoutScan } from '@/hooks/useScanResults'

interface ScanResultsTableProps {
  results: BreakoutScan[]
  onRowClick: (scan: BreakoutScan) => void
}

export function ScanResultsTable({ results, onRowClick }: ScanResultsTableProps) {
  const [sortColumn, setSortColumn] = useState<keyof BreakoutScan>('breakout_score')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  const handleSort = (column: keyof BreakoutScan) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('desc')
    }
  }

  const sortedResults = [...results].sort((a, b) => {
    const aValue = a[sortColumn]
    const bValue = b[sortColumn]
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue
    }
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue)
    }
    
    return 0
  })

  const formatNumber = (value: number, decimals: number = 2) => {
    return value.toFixed(decimals)
  }

  const formatMarketCap = (value?: number) => {
    if (!value) return 'N/A'
    if (value >= 1_000_000_000_000) {
      return `$${(value / 1_000_000_000_000).toFixed(2)}T`
    }
    if (value >= 1_000_000_000) {
      return `$${(value / 1_000_000_000).toFixed(2)}B`
    }
    return `$${(value / 1_000_000).toFixed(2)}M`
  }

  const formatVolume = (value: number) => {
    if (value >= 1_000_000) {
      return `${(value / 1_000_000).toFixed(1)}M`
    }
    return `${(value / 1_000).toFixed(0)}K`
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400'
    if (score >= 70) return 'text-yellow-400'
    return 'text-orange-400'
  }

  const getSetupBadgeColor = (setupType: string) => {
    const colors: Record<string, string> = {
      FLAT_TOP: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      WEDGE: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      FLAG: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
      BASE: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      UNKNOWN: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
    }
    return colors[setupType] || colors.UNKNOWN
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-zinc-900/50 border-b border-zinc-800">
          <tr>
            <th 
              className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase cursor-pointer hover:text-zinc-200 transition-colors"
              onClick={() => handleSort('symbol')}
            >
              Symbol {sortColumn === 'symbol' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th 
              className="px-4 py-3 text-right text-xs font-medium text-zinc-400 uppercase cursor-pointer hover:text-zinc-200 transition-colors"
              onClick={() => handleSort('price')}
            >
              Price {sortColumn === 'price' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th 
              className="px-4 py-3 text-right text-xs font-medium text-zinc-400 uppercase cursor-pointer hover:text-zinc-200 transition-colors"
              onClick={() => handleSort('trigger_price')}
            >
              Trigger {sortColumn === 'trigger_price' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th 
              className="px-4 py-3 text-right text-xs font-medium text-zinc-400 uppercase cursor-pointer hover:text-zinc-200 transition-colors"
              onClick={() => handleSort('distance_pct')}
            >
              Distance {sortColumn === 'distance_pct' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th 
              className="px-4 py-3 text-right text-xs font-medium text-zinc-400 uppercase cursor-pointer hover:text-zinc-200 transition-colors"
              onClick={() => handleSort('adr_pct_14')}
            >
              ADR% {sortColumn === 'adr_pct_14' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th 
              className="px-4 py-3 text-right text-xs font-medium text-zinc-400 uppercase cursor-pointer hover:text-zinc-200 transition-colors"
              onClick={() => handleSort('ema21')}
            >
              EMA21 {sortColumn === 'ema21' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th 
              className="px-4 py-3 text-right text-xs font-medium text-zinc-400 uppercase cursor-pointer hover:text-zinc-200 transition-colors"
              onClick={() => handleSort('ema50')}
            >
              EMA50 {sortColumn === 'ema50' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th 
              className="px-4 py-3 text-right text-xs font-medium text-zinc-400 uppercase cursor-pointer hover:text-zinc-200 transition-colors"
              onClick={() => handleSort('ema200')}
            >
              EMA200 {sortColumn === 'ema200' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th 
              className="px-4 py-3 text-center text-xs font-medium text-zinc-400 uppercase cursor-pointer hover:text-zinc-200 transition-colors"
              onClick={() => handleSort('setup_type')}
            >
              Setup {sortColumn === 'setup_type' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th 
              className="px-4 py-3 text-right text-xs font-medium text-zinc-400 uppercase cursor-pointer hover:text-zinc-200 transition-colors"
              onClick={() => handleSort('breakout_score')}
            >
              Score {sortColumn === 'breakout_score' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800/50">
          {sortedResults.map((scan) => {
            const emaAligned = scan.price > scan.ema21 && scan.ema21 > scan.ema50 && scan.ema50 > scan.ema200
            
            return (
              <tr
                key={scan.id}
                onClick={() => onRowClick(scan)}
                className="hover:bg-zinc-800/30 cursor-pointer transition-colors"
              >
                <td className="px-4 py-3">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-white">{scan.symbol}</span>
                    <span className="text-xs text-zinc-500">{formatMarketCap(scan.market_cap)}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex flex-col items-end">
                    <span className="text-sm text-white">${formatNumber(scan.price)}</span>
                    <span className="text-xs text-zinc-500">{formatVolume(scan.avg_vol_50)} vol</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="text-sm text-zinc-300">${formatNumber(scan.trigger_price)}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="text-sm text-cyan-400">{formatNumber(scan.distance_pct)}%</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="text-sm text-zinc-300">{formatNumber(scan.adr_pct_14)}%</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex flex-col items-end">
                    <span className={`text-sm ${scan.price > scan.ema21 ? 'text-green-400' : 'text-red-400'}`}>
                      ${formatNumber(scan.ema21)}
                    </span>
                    {scan.price > scan.ema21 ? (
                      <span className="text-xs text-green-500">✓ above</span>
                    ) : (
                      <span className="text-xs text-red-500">✗ below</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex flex-col items-end">
                    <span className={`text-sm ${scan.ema21 > scan.ema50 ? 'text-green-400' : 'text-red-400'}`}>
                      ${formatNumber(scan.ema50)}
                    </span>
                    {scan.ema21 > scan.ema50 ? (
                      <span className="text-xs text-green-500">✓ aligned</span>
                    ) : (
                      <span className="text-xs text-red-500">✗ crossed</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex flex-col items-end">
                    <span className={`text-sm ${scan.ema50 > scan.ema200 ? 'text-green-400' : 'text-red-400'}`}>
                      ${formatNumber(scan.ema200)}
                    </span>
                    {emaAligned ? (
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-green-500">✓ full</span>
                        <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                      </div>
                    ) : (
                      <span className="text-xs text-red-500">✗ partial</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`inline-block px-2 py-1 text-xs font-medium rounded border ${getSetupBadgeColor(scan.setup_type)}`}>
                    {scan.setup_type.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className={`text-lg font-bold ${getScoreColor(scan.breakout_score)}`}>
                    {scan.breakout_score}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      
      {sortedResults.length === 0 && (
        <div className="text-center py-12 text-zinc-500">
          No breakout setups found matching your filters
        </div>
      )}
    </div>
  )
}
