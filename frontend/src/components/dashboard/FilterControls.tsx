import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ChevronDown, 
  ChevronUp, 
  X, 
  Filter,
  TrendingUp,
  DollarSign,
  BarChart3,
  Activity,
  Calendar,
  Zap,
  Star
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { PresetManager } from './PresetManager'

export interface FilterOptions {
  // Technical Indicators
  minScore: number
  maxDistance: number
  setupTypes: Set<string>
  emaAlignedOnly: boolean
  minAdr: number
  
  // Price & Volume
  minPrice: number
  maxPrice: number
  minVolume: number
  minAvgVolume: number
  minRelVolume: number
  
  // Market Data
  markets: Set<string>
  watchlists: Set<string>
  indices: Set<string>
  sectors: Set<string>
  
  // Fundamental Filters
  minMarketCap: number
  maxMarketCap: number
  minPE: number
  maxPE: number
  minPEG: number
  maxPEG: number
  minROE: number
  minEPSGrowth: number
  minRevenueGrowth: number
  minDivYield: number
  maxBeta: number
  
  // EMA Filters
  priceAboveEMA21: boolean
  priceAboveEMA50: boolean
  priceAboveEMA200: boolean
  ema21AboveEMA50: boolean
  ema50AboveEMA200: boolean
  
  // Performance
  minPerfWeek: number
  minPerfMonth: number
  minPerfQuarter: number
  
  // Analyst & Earnings
  analystRating: Set<string>
  hasRecentEarnings: boolean
  hasUpcomingEarnings: boolean
  daysUntilEarnings: number
}

interface FilterControlsProps {
  filters: FilterOptions
  onChange: (filters: FilterOptions) => void
  resultCount: number
  totalCount: number
}

const SETUP_TYPES = ['FLAT_TOP', 'WEDGE', 'FLAG', 'BASE', 'UNKNOWN']
const MARKETS = ['NASDAQ', 'NYSE', 'AMEX', 'OTC']
const INDICES = ['S&P 500', 'DOW 30', 'NASDAQ 100', 'Russell 2000']
const SECTORS = [
  'Technology',
  'Healthcare',
  'Financial',
  'Consumer Cyclical',
  'Consumer Defensive',
  'Industrials',
  'Energy',
  'Materials',
  'Real Estate',
  'Utilities',
  'Communication Services'
]
const ANALYST_RATINGS = ['Strong Buy', 'Buy', 'Hold', 'Sell', 'Strong Sell']
const MARKET_CAP_PRESETS = [
  { label: 'Mega (>$200B)', min: 200_000_000_000, max: Infinity },
  { label: 'Large ($10B-$200B)', min: 10_000_000_000, max: 200_000_000_000 },
  { label: 'Mid ($2B-$10B)', min: 2_000_000_000, max: 10_000_000_000 },
  { label: 'Small ($300M-$2B)', min: 300_000_000, max: 2_000_000_000 },
  { label: 'Micro (<$300M)', min: 0, max: 300_000_000 },
]

export function FilterControls({ filters, onChange, resultCount, totalCount }: FilterControlsProps) {
  const { isAdmin } = useAuth()
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['technical', 'price'])
  )
  const [showAllFilters, setShowAllFilters] = useState(false)
  const [showPresetManager, setShowPresetManager] = useState(false)

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(section)) {
      newExpanded.delete(section)
    } else {
      newExpanded.add(section)
    }
    setExpandedSections(newExpanded)
  }

  const resetFilters = () => {
    onChange({
      minScore: 0,
      maxDistance: 10,
      setupTypes: new Set(SETUP_TYPES),
      emaAlignedOnly: false,
      minAdr: 0,
      minPrice: 0,
      maxPrice: Infinity,
      minVolume: 0,
      minAvgVolume: 0,
      minRelVolume: 0,
      markets: new Set(MARKETS),
      watchlists: new Set(),
      indices: new Set(),
      sectors: new Set(SECTORS),
      minMarketCap: 0,
      maxMarketCap: Infinity,
      minPE: 0,
      maxPE: Infinity,
      minPEG: 0,
      maxPEG: Infinity,
      minROE: 0,
      minEPSGrowth: 0,
      minRevenueGrowth: 0,
      minDivYield: 0,
      maxBeta: Infinity,
      priceAboveEMA21: false,
      priceAboveEMA50: false,
      priceAboveEMA200: false,
      ema21AboveEMA50: false,
      ema50AboveEMA200: false,
      minPerfWeek: -Infinity,
      minPerfMonth: -Infinity,
      minPerfQuarter: -Infinity,
      analystRating: new Set(ANALYST_RATINGS),
      hasRecentEarnings: false,
      hasUpcomingEarnings: false,
      daysUntilEarnings: 30,
    })
  }

  const getActiveFilterCount = () => {
    let count = 0
    if (filters.minScore > 0) count++
    if (filters.maxDistance < 10) count++
    if (filters.setupTypes.size < SETUP_TYPES.length) count++
    if (filters.emaAlignedOnly) count++
    if (filters.minAdr > 0) count++
    if (filters.minPrice > 0) count++
    if (filters.maxPrice < Infinity) count++
    if (filters.minVolume > 0) count++
    if (filters.markets.size < MARKETS.length) count++
    if (filters.sectors.size < SECTORS.length) count++
    if (filters.minMarketCap > 0) count++
    if (filters.maxMarketCap < Infinity) count++
    if (filters.priceAboveEMA21 || filters.priceAboveEMA50 || filters.priceAboveEMA200) count++
    if (filters.minPE > 0 || filters.maxPE < Infinity) count++
    if (filters.analystRating.size < ANALYST_RATINGS.length) count++
    return count
  }

  const FilterSection = ({ 
    title, 
    icon: Icon, 
    section, 
    children 
  }: { 
    title: string
    icon: React.ComponentType<{ className?: string }>
    section: string
    children: React.ReactNode 
  }) => {
    const isExpanded = expandedSections.has(section)
    
    return (
      <div className="border border-white/10 rounded-lg overflow-hidden bg-white/[0.02]">
        <button
          onClick={() => toggleSection(section)}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/[0.03] transition-colors"
        >
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-cyan-400" />
            <span className="font-medium text-white text-sm">{title}</span>
          </div>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-zinc-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-zinc-400" />
          )}
        </button>
        {isExpanded && (
          <div className="px-4 py-4 border-t border-white/10 space-y-4">
            {children}
          </div>
        )}
      </div>
    )
  }

  const RangeFilter = ({
    label,
    value,
    min,
    max,
    step,
    suffix = '',
    onChange: onValueChange
  }: {
    label: string
    value: number
    min: number
    max: number
    step: number
    suffix?: string
    onChange: (value: number) => void
  }) => (
    <div className="space-y-2">
      <label className="text-sm font-medium text-zinc-300 flex items-center justify-between">
        {label}
        <span className="text-cyan-400 font-semibold">
          {value === Infinity ? '∞' : value === -Infinity ? '-∞' : value.toFixed(step < 1 ? 1 : 0)}{suffix}
        </span>
      </label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value === Infinity ? max : value === -Infinity ? min : value}
        onChange={(e) => onValueChange(parseFloat(e.target.value))}
        className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
      />
      <div className="flex justify-between text-xs text-zinc-500">
        <span>{min}{suffix}</span>
        <span>{max === Infinity ? '∞' : max}{suffix}</span>
      </div>
    </div>
  )

  const ToggleFilter = ({
    label,
    checked,
    onChange: onValueChange,
    description
  }: {
    label: string
    checked: boolean
    onChange: (checked: boolean) => void
    description?: string
  }) => (
    <div className="space-y-1">
      <label className="flex items-center gap-3 cursor-pointer group">
        <div className="relative">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onValueChange(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-cyan-500/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
        </div>
        <span className="text-sm text-zinc-300 group-hover:text-white transition-colors">{label}</span>
      </label>
      {description && <p className="text-xs text-zinc-500 ml-14">{description}</p>}
    </div>
  )

  const MultiSelectFilter = ({
    label,
    options,
    selected,
    onChange: onValueChange,
    colorMap
  }: {
    label: string
    options: string[]
    selected: Set<string>
    onChange: (selected: Set<string>) => void
    colorMap?: Record<string, string>
  }) => {
    const handleToggle = (option: string) => {
      const newSelected = new Set(selected)
      if (newSelected.has(option)) {
        newSelected.delete(option)
      } else {
        newSelected.add(option)
      }
      onValueChange(newSelected)
    }

    const selectAll = () => onValueChange(new Set(options))
    const clearAll = () => onValueChange(new Set())

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-zinc-300">{label}</label>
          <div className="flex gap-2 text-xs">
            <button
              onClick={selectAll}
              className="text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              All
            </button>
            <span className="text-zinc-600">|</span>
            <button
              onClick={clearAll}
              className="text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              None
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {options.map((option) => {
            const isSelected = selected.has(option)
            const colorClass = colorMap?.[option] || 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 hover:bg-cyan-500/30'
            
            return (
              <button
                key={option}
                onClick={() => handleToggle(option)}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-lg border transition-all",
                  isSelected
                    ? colorClass
                    : 'bg-zinc-800/50 text-zinc-500 border-zinc-700 hover:bg-zinc-800'
                )}
              >
                {option}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  const setupColorMap: Record<string, string> = {
    FLAT_TOP: 'bg-blue-500/20 text-blue-300 border-blue-500/50 hover:bg-blue-500/30',
    WEDGE: 'bg-purple-500/20 text-purple-300 border-purple-500/50 hover:bg-purple-500/30',
    FLAG: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 hover:bg-cyan-500/30',
    BASE: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 hover:bg-emerald-500/30',
    UNKNOWN: 'bg-gray-500/20 text-gray-300 border-gray-500/50 hover:bg-gray-500/30',
  }

  const activeFilterCount = getActiveFilterCount()

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-900/95 to-zinc-900 border border-white/10 rounded-xl p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-500/10 rounded-lg">
                <Filter className="h-5 w-5 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">Advanced Filters</h3>
                <p className="text-sm text-zinc-400 mt-0.5">
                  Showing <span className="text-cyan-400 font-semibold">{resultCount}</span> of {totalCount} stocks
                </p>
              </div>
            </div>
            {activeFilterCount > 0 && (
              <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30">
                {activeFilterCount} active
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3">
            {isAdmin && (
              <Button
                onClick={() => setShowPresetManager(!showPresetManager)}
                variant="outline"
                size="sm"
                className={cn(
                  "border-white/10 text-zinc-300 hover:bg-white/5 hover:text-white",
                  showPresetManager && "bg-white/5 text-white"
                )}
              >
                <Star className="h-4 w-4 mr-2" />
                Presets
              </Button>
            )}
            <Button
              onClick={resetFilters}
              variant="outline"
              size="sm"
              className="border-white/10 text-zinc-300 hover:bg-white/5 hover:text-white"
            >
              <X className="h-4 w-4 mr-2" />
              Reset All
            </Button>
            <Button
              onClick={() => setShowAllFilters(!showAllFilters)}
              size="sm"
              className="bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 border border-cyan-500/30"
            >
              {showAllFilters ? 'Show Less' : 'Show All Filters'}
              {showAllFilters ? (
                <ChevronUp className="h-4 w-4 ml-2" />
              ) : (
                <ChevronDown className="h-4 w-4 ml-2" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Preset Manager - Admin Only */}
      {isAdmin && showPresetManager && (
        <div className="bg-zinc-900/50 border border-white/10 rounded-lg p-6">
          <PresetManager
            currentFilters={filters}
            onLoadPreset={onChange}
            onClose={() => setShowPresetManager(false)}
          />
        </div>
      )}

      {/* Filter Sections */}
      <div className="grid grid-cols-1 gap-4">
        {/* Technical Indicators - Always Visible */}
        <FilterSection title="Technical Indicators" icon={Activity} section="technical">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <RangeFilter
              label="Min Breakout Score"
              value={filters.minScore}
              min={0}
              max={100}
              step={5}
              onChange={(val) => onChange({ ...filters, minScore: val })}
            />
            <RangeFilter
              label="Max Distance to Trigger"
              value={filters.maxDistance}
              min={0}
              max={10}
              step={0.1}
              suffix="%"
              onChange={(val) => onChange({ ...filters, maxDistance: val })}
            />
            <RangeFilter
              label="Min ADR (14-day)"
              value={filters.minAdr}
              min={0}
              max={10}
              step={0.1}
              suffix="%"
              onChange={(val) => onChange({ ...filters, minAdr: val })}
            />
          </div>
          
          <MultiSelectFilter
            label="Setup Types"
            options={SETUP_TYPES}
            selected={filters.setupTypes}
            onChange={(val) => onChange({ ...filters, setupTypes: val })}
            colorMap={setupColorMap}
          />
        </FilterSection>

        {/* Price & Volume - Always Visible */}
        <FilterSection title="Price & Volume" icon={DollarSign} section="price">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <RangeFilter
              label="Min Price"
              value={filters.minPrice}
              min={0}
              max={1000}
              step={10}
              suffix="$"
              onChange={(val) => onChange({ ...filters, minPrice: val })}
            />
            <RangeFilter
              label="Max Price"
              value={filters.maxPrice === Infinity ? 1000 : filters.maxPrice}
              min={0}
              max={1000}
              step={10}
              suffix="$"
              onChange={(val) => onChange({ ...filters, maxPrice: val === 1000 ? Infinity : val })}
            />
            <RangeFilter
              label="Min Avg Volume (M)"
              value={filters.minAvgVolume / 1_000_000}
              min={0}
              max={100}
              step={1}
              suffix="M"
              onChange={(val) => onChange({ ...filters, minAvgVolume: val * 1_000_000 })}
            />
            <RangeFilter
              label="Min Relative Volume"
              value={filters.minRelVolume}
              min={0}
              max={5}
              step={0.1}
              suffix="x"
              onChange={(val) => onChange({ ...filters, minRelVolume: val })}
            />
          </div>
        </FilterSection>

        {showAllFilters && (
          <>
            {/* EMA Filters */}
            <FilterSection title="EMA Alignment" icon={TrendingUp} section="ema">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <ToggleFilter
                  label="Price > EMA(21)"
                  checked={filters.priceAboveEMA21}
                  onChange={(val) => onChange({ ...filters, priceAboveEMA21: val })}
                  description="Price trading above 21-day EMA"
                />
                <ToggleFilter
                  label="Price > EMA(50)"
                  checked={filters.priceAboveEMA50}
                  onChange={(val) => onChange({ ...filters, priceAboveEMA50: val })}
                  description="Price trading above 50-day EMA"
                />
                <ToggleFilter
                  label="Price > EMA(200)"
                  checked={filters.priceAboveEMA200}
                  onChange={(val) => onChange({ ...filters, priceAboveEMA200: val })}
                  description="Price trading above 200-day EMA"
                />
                <ToggleFilter
                  label="EMA(21) > EMA(50)"
                  checked={filters.ema21AboveEMA50}
                  onChange={(val) => onChange({ ...filters, ema21AboveEMA50: val })}
                  description="Short-term above mid-term"
                />
                <ToggleFilter
                  label="EMA(50) > EMA(200)"
                  checked={filters.ema50AboveEMA200}
                  onChange={(val) => onChange({ ...filters, ema50AboveEMA200: val })}
                  description="Mid-term above long-term"
                />
                <ToggleFilter
                  label="Full EMA Alignment"
                  checked={filters.emaAlignedOnly}
                  onChange={(val) => onChange({ ...filters, emaAlignedOnly: val })}
                  description="Price > EMA21 > EMA50 > EMA200"
                />
              </div>
            </FilterSection>

            {/* Market & Sector */}
            <FilterSection title="Market & Sector" icon={BarChart3} section="market">
              <div className="space-y-4">
                <MultiSelectFilter
                  label="Markets"
                  options={MARKETS}
                  selected={filters.markets}
                  onChange={(val) => onChange({ ...filters, markets: val })}
                />
                <MultiSelectFilter
                  label="Indices"
                  options={INDICES}
                  selected={filters.indices}
                  onChange={(val) => onChange({ ...filters, indices: val })}
                />
                <MultiSelectFilter
                  label="Sectors"
                  options={SECTORS}
                  selected={filters.sectors}
                  onChange={(val) => onChange({ ...filters, sectors: val })}
                />
              </div>
            </FilterSection>

            {/* Fundamentals */}
            <FilterSection title="Fundamentals" icon={DollarSign} section="fundamentals">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-zinc-300 mb-2 block">Market Cap Presets</label>
                  <div className="flex flex-wrap gap-2">
                    {MARKET_CAP_PRESETS.map((preset) => (
                      <button
                        key={preset.label}
                        onClick={() => onChange({ 
                          ...filters, 
                          minMarketCap: preset.min,
                          maxMarketCap: preset.max 
                        })}
                        className={cn(
                          "px-3 py-1.5 text-xs font-medium rounded-lg border transition-all",
                          filters.minMarketCap === preset.min && filters.maxMarketCap === preset.max
                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                            : 'bg-zinc-800/50 text-zinc-500 border-zinc-700 hover:bg-zinc-800'
                        )}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <RangeFilter
                    label="Min P/E Ratio"
                    value={filters.minPE}
                    min={0}
                    max={100}
                    step={5}
                    onChange={(val) => onChange({ ...filters, minPE: val })}
                  />
                  <RangeFilter
                    label="Max P/E Ratio"
                    value={filters.maxPE === Infinity ? 100 : filters.maxPE}
                    min={0}
                    max={100}
                    step={5}
                    onChange={(val) => onChange({ ...filters, maxPE: val === 100 ? Infinity : val })}
                  />
                  <RangeFilter
                    label="Min PEG Ratio"
                    value={filters.minPEG}
                    min={0}
                    max={5}
                    step={0.1}
                    onChange={(val) => onChange({ ...filters, minPEG: val })}
                  />
                  <RangeFilter
                    label="Max PEG Ratio"
                    value={filters.maxPEG === Infinity ? 5 : filters.maxPEG}
                    min={0}
                    max={5}
                    step={0.1}
                    onChange={(val) => onChange({ ...filters, maxPEG: val === 5 ? Infinity : val })}
                  />
                  <RangeFilter
                    label="Min ROE"
                    value={filters.minROE}
                    min={0}
                    max={50}
                    step={1}
                    suffix="%"
                    onChange={(val) => onChange({ ...filters, minROE: val })}
                  />
                  <RangeFilter
                    label="Max Beta"
                    value={filters.maxBeta === Infinity ? 3 : filters.maxBeta}
                    min={0}
                    max={3}
                    step={0.1}
                    onChange={(val) => onChange({ ...filters, maxBeta: val === 3 ? Infinity : val })}
                  />
                  <RangeFilter
                    label="Min EPS Growth"
                    value={filters.minEPSGrowth}
                    min={-50}
                    max={100}
                    step={5}
                    suffix="%"
                    onChange={(val) => onChange({ ...filters, minEPSGrowth: val })}
                  />
                  <RangeFilter
                    label="Min Revenue Growth"
                    value={filters.minRevenueGrowth}
                    min={-50}
                    max={100}
                    step={5}
                    suffix="%"
                    onChange={(val) => onChange({ ...filters, minRevenueGrowth: val })}
                  />
                  <RangeFilter
                    label="Min Dividend Yield"
                    value={filters.minDivYield}
                    min={0}
                    max={10}
                    step={0.5}
                    suffix="%"
                    onChange={(val) => onChange({ ...filters, minDivYield: val })}
                  />
                </div>
              </div>
            </FilterSection>

            {/* Performance */}
            <FilterSection title="Performance" icon={TrendingUp} section="performance">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <RangeFilter
                  label="Min Weekly Performance"
                  value={filters.minPerfWeek}
                  min={-50}
                  max={50}
                  step={1}
                  suffix="%"
                  onChange={(val) => onChange({ ...filters, minPerfWeek: val })}
                />
                <RangeFilter
                  label="Min Monthly Performance"
                  value={filters.minPerfMonth}
                  min={-50}
                  max={100}
                  step={5}
                  suffix="%"
                  onChange={(val) => onChange({ ...filters, minPerfMonth: val })}
                />
                <RangeFilter
                  label="Min Quarterly Performance"
                  value={filters.minPerfQuarter}
                  min={-50}
                  max={200}
                  step={10}
                  suffix="%"
                  onChange={(val) => onChange({ ...filters, minPerfQuarter: val })}
                />
              </div>
            </FilterSection>

            {/* Analyst & Earnings */}
            <FilterSection title="Analyst Ratings & Earnings" icon={Calendar} section="earnings">
              <div className="space-y-4">
                <MultiSelectFilter
                  label="Analyst Ratings"
                  options={ANALYST_RATINGS}
                  selected={filters.analystRating}
                  onChange={(val) => onChange({ ...filters, analystRating: val })}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ToggleFilter
                    label="Has Recent Earnings"
                    checked={filters.hasRecentEarnings}
                    onChange={(val) => onChange({ ...filters, hasRecentEarnings: val })}
                    description="Reported earnings in last 30 days"
                  />
                  <ToggleFilter
                    label="Has Upcoming Earnings"
                    checked={filters.hasUpcomingEarnings}
                    onChange={(val) => onChange({ ...filters, hasUpcomingEarnings: val })}
                    description="Earnings scheduled within filter range"
                  />
                </div>

                {filters.hasUpcomingEarnings && (
                  <RangeFilter
                    label="Days Until Earnings"
                    value={filters.daysUntilEarnings}
                    min={1}
                    max={90}
                    step={1}
                    suffix=" days"
                    onChange={(val) => onChange({ ...filters, daysUntilEarnings: val })}
                  />
                )}
              </div>
            </FilterSection>
          </>
        )}
      </div>
    </div>
  )
}
