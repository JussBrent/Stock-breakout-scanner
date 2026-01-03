import { useState } from 'react'

export interface FilterOptions {
  minScore: number
  maxDistance: number
  setupTypes: Set<string>
  emaAlignedOnly: boolean
  minAdr: number
}

interface FilterControlsProps {
  filters: FilterOptions
  onChange: (filters: FilterOptions) => void
  resultCount: number
  totalCount: number
}

const SETUP_TYPES = ['FLAT_TOP', 'WEDGE', 'FLAG', 'BASE', 'UNKNOWN']

export function FilterControls({ filters, onChange, resultCount, totalCount }: FilterControlsProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  const handleToggleSetupType = (type: string) => {
    const newTypes = new Set(filters.setupTypes)
    if (newTypes.has(type)) {
      newTypes.delete(type)
    } else {
      newTypes.add(type)
    }
    onChange({ ...filters, setupTypes: newTypes })
  }

  const handleSelectAllSetups = () => {
    onChange({ ...filters, setupTypes: new Set(SETUP_TYPES) })
  }

  const handleDeselectAllSetups = () => {
    onChange({ ...filters, setupTypes: new Set() })
  }

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold text-white">Filters</h3>
          <span className="text-sm text-zinc-400">
            Showing <span className="text-cyan-400 font-semibold">{resultCount}</span> of {totalCount} setups
          </span>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-zinc-400 hover:text-white transition-colors"
        >
          {isExpanded ? '−' : '+'}
        </button>
      </div>

      {isExpanded && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Score Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300 flex items-center justify-between">
              Min Score
              <span className="text-cyan-400 font-semibold">{filters.minScore}</span>
            </label>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={filters.minScore}
              onChange={(e) => onChange({ ...filters, minScore: parseInt(e.target.value) })}
              className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
            <div className="flex justify-between text-xs text-zinc-500">
              <span>0</span>
              <span>100</span>
            </div>
          </div>

          {/* Distance Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300 flex items-center justify-between">
              Max Distance
              <span className="text-cyan-400 font-semibold">{filters.maxDistance.toFixed(1)}%</span>
            </label>
            <input
              type="range"
              min="0"
              max="5"
              step="0.1"
              value={filters.maxDistance}
              onChange={(e) => onChange({ ...filters, maxDistance: parseFloat(e.target.value) })}
              className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
            <div className="flex justify-between text-xs text-zinc-500">
              <span>0%</span>
              <span>5%</span>
            </div>
          </div>

          {/* ADR Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300 flex items-center justify-between">
              Min ADR%
              <span className="text-cyan-400 font-semibold">{filters.minAdr.toFixed(1)}%</span>
            </label>
            <input
              type="range"
              min="0"
              max="5"
              step="0.1"
              value={filters.minAdr}
              onChange={(e) => onChange({ ...filters, minAdr: parseFloat(e.target.value) })}
              className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
            <div className="flex justify-between text-xs text-zinc-500">
              <span>0%</span>
              <span>5%</span>
            </div>
          </div>

          {/* EMA Alignment Toggle */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">EMA Alignment</label>
            <label className="flex items-center gap-3 cursor-pointer">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={filters.emaAlignedOnly}
                  onChange={(e) => onChange({ ...filters, emaAlignedOnly: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
              </div>
              <span className="text-sm text-zinc-300">Only show aligned EMAs</span>
            </label>
            <p className="text-xs text-zinc-500">Price {'>'} EMA21 {'>'} EMA50 {'>'} EMA200</p>
          </div>
        </div>
      )}

      {/* Setup Type Filters */}
      {isExpanded && (
        <div className="mt-6 pt-6 border-t border-zinc-800">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-zinc-300">Setup Types</label>
            <div className="flex gap-2">
              <button
                onClick={handleSelectAllSetups}
                className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                Select All
              </button>
              <span className="text-zinc-600">|</span>
              <button
                onClick={handleDeselectAllSetups}
                className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                Clear All
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {SETUP_TYPES.map((type) => {
              const isSelected = filters.setupTypes.has(type)
              const colors: Record<string, string> = {
                FLAT_TOP: 'bg-blue-500/20 text-blue-300 border-blue-500/50 hover:bg-blue-500/30',
                WEDGE: 'bg-purple-500/20 text-purple-300 border-purple-500/50 hover:bg-purple-500/30',
                FLAG: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 hover:bg-cyan-500/30',
                BASE: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 hover:bg-emerald-500/30',
                UNKNOWN: 'bg-gray-500/20 text-gray-300 border-gray-500/50 hover:bg-gray-500/30',
              }
              
              return (
                <button
                  key={type}
                  onClick={() => handleToggleSetupType(type)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg border transition-all ${
                    isSelected
                      ? colors[type]
                      : 'bg-zinc-800/50 text-zinc-500 border-zinc-700 hover:bg-zinc-800'
                  } ${isSelected ? 'ring-2 ring-offset-2 ring-offset-zinc-900' : ''}`}
                >
                  {type.replace('_', ' ')}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
