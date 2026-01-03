import { BreakoutScan } from '@/hooks/useScanResults'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  ComposedChart,
  Bar,
} from 'recharts'

interface StockChartProps {
  scan: BreakoutScan
}

// Generate realistic mock price data (last 60 days)
function generateHistoricalData(scan: BreakoutScan) {
  const days = 60
  const data = []
  
  // Start price 12% below current for realistic uptrend
  let basePrice = scan.price * 0.88
  const volatility = scan.adr_pct_14 / 100
  const trend = (scan.price - basePrice) / days // gradual uptrend
  
  const today = new Date()
  
  for (let i = 0; i < days; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() - (days - i))
    
    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) continue
    
    const dateStr = `${date.getMonth() + 1}/${date.getDate()}`
    
    // Generate price with realistic movement
    const random = (Math.random() - 0.5) * 2
    const dailyMove = basePrice * volatility * random
    const trendMove = trend * i
    
    const price = basePrice + trendMove + dailyMove
    
    // Volume - higher on big moves
    const baseVolume = scan.avg_vol_50 / 1_000_000 // Convert to millions
    const volumeMultiplier = 0.7 + Math.random() * 0.6 + Math.abs(dailyMove / basePrice) * 5
    const volume = baseVolume * volumeMultiplier
    
    // Simple EMA calculations (approximated for visualization)
    const ema21 = scan.ema21 + (price - scan.price) * 0.95
    const ema50 = scan.ema50 + (price - scan.price) * 0.90
    const ema200 = scan.ema200 + (price - scan.price) * 0.80
    
    data.push({
      date: dateStr,
      price: Number(price.toFixed(2)),
      ema21: Number(ema21.toFixed(2)),
      ema50: Number(ema50.toFixed(2)),
      ema200: Number(ema200.toFixed(2)),
      volume: Number(volume.toFixed(2)),
      trigger: scan.trigger_price,
    })
    
    basePrice = price
  }
  
  return data
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-3 shadow-xl">
        <p className="text-white font-semibold mb-2">{payload[0].payload.date}</p>
        <p className="text-cyan-400 text-sm">Price: ${payload[0].value?.toFixed(2)}</p>
        {payload[1] && <p className="text-cyan-300 text-sm">EMA21: ${payload[1].value?.toFixed(2)}</p>}
        {payload[2] && <p className="text-yellow-500 text-sm">EMA50: ${payload[2].value?.toFixed(2)}</p>}
        {payload[3] && <p className="text-purple-500 text-sm">EMA200: ${payload[3].value?.toFixed(2)}</p>}
      </div>
    )
  }
  return null
}

export function StockChart({ scan }: StockChartProps) {
  const data = generateHistoricalData(scan)
  
  const emaAligned = scan.price > scan.ema21 && scan.ema21 > scan.ema50 && scan.ema50 > scan.ema200

  return (
    <div className="space-y-4">
      {/* Chart Legend */}
      <div className="flex flex-wrap items-center gap-3 text-xs mb-3">
        <div className="flex items-center gap-2">
          <div className="h-0.5 w-4 bg-cyan-400"></div>
          <span className="text-zinc-400">Price:</span>
          <span className="text-white font-semibold">${scan.price.toFixed(2)}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-0.5 w-4 bg-cyan-300"></div>
          <span className="text-zinc-400">EMA21:</span>
          <span className="text-white font-semibold">${scan.ema21.toFixed(2)}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-0.5 w-4 bg-yellow-500"></div>
          <span className="text-zinc-400">EMA50:</span>
          <span className="text-white font-semibold">${scan.ema50.toFixed(2)}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-0.5 w-4 bg-purple-500"></div>
          <span className="text-zinc-400">EMA200:</span>
          <span className="text-white font-semibold">${scan.ema200.toFixed(2)}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-0.5 w-4 border-t-2 border-dashed border-amber-500"></div>
          <span className="text-zinc-400">Trigger:</span>
          <span className="text-amber-400 font-semibold">${scan.trigger_price.toFixed(2)}</span>
        </div>
      </div>
      
      {/* EMA Alignment Status */}
      <div className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-lg">
        {emaAligned ? (
          <>
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-500/20">
              <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-green-400">Full EMA Alignment ✓</p>
              <p className="text-xs text-zinc-500">Price {'>'} EMA21 {'>'} EMA50 {'>'} EMA200 — Strong uptrend confirmed</p>
            </div>
            <div className="px-3 py-1 bg-green-500/20 rounded-full">
              <span className="text-xs font-semibold text-green-400">BULLISH</span>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-yellow-500/20">
              <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-yellow-400">Partial EMA Alignment</p>
              <p className="text-xs text-zinc-500">Review individual EMA positions for trend confirmation</p>
            </div>
            <div className="px-3 py-1 bg-yellow-500/20 rounded-full">
              <span className="text-xs font-semibold text-yellow-400">NEUTRAL</span>
            </div>
          </>
        )}
      </div>
      
      {/* Price & EMAs Chart */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis 
              dataKey="date" 
              stroke="#71717a"
              style={{ fontSize: '11px' }}
              tick={{ fill: '#71717a' }}
            />
            <YAxis 
              stroke="#71717a"
              style={{ fontSize: '11px' }}
              tick={{ fill: '#71717a' }}
              domain={['auto', 'auto']}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
              iconType="line"
            />
            
            {/* Trigger line */}
            <ReferenceLine 
              y={scan.trigger_price} 
              stroke="#f59e0b" 
              strokeDasharray="5 5"
              strokeWidth={2}
              label={{ 
                value: 'Trigger', 
                position: 'right',
                fill: '#f59e0b',
                fontSize: 11,
              }}
            />
            
            {/* EMA 200 */}
            <Line 
              type="monotone" 
              dataKey="ema200" 
              stroke="#a855f7" 
              strokeWidth={2}
              dot={false}
              name="EMA 200"
            />
            
            {/* EMA 50 */}
            <Line 
              type="monotone" 
              dataKey="ema50" 
              stroke="#eab308" 
              strokeWidth={2}
              dot={false}
              name="EMA 50"
            />
            
            {/* EMA 21 */}
            <Line 
              type="monotone" 
              dataKey="ema21" 
              stroke="#67e8f9" 
              strokeWidth={2}
              dot={false}
              name="EMA 21"
            />
            
            {/* Price (on top) */}
            <Line 
              type="monotone" 
              dataKey="price" 
              stroke="#22d3ee" 
              strokeWidth={3}
              dot={false}
              name="Price"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      {/* Volume Chart */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
        <h4 className="text-xs font-semibold text-zinc-400 mb-3 uppercase">Volume (Millions)</h4>
        <ResponsiveContainer width="100%" height={120}>
          <ComposedChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis 
              dataKey="date" 
              stroke="#71717a"
              style={{ fontSize: '10px' }}
              tick={{ fill: '#71717a' }}
            />
            <YAxis 
              stroke="#71717a"
              style={{ fontSize: '10px' }}
              tick={{ fill: '#71717a' }}
            />
            <Tooltip content={({ active, payload }: any) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-2 shadow-xl">
                    <p className="text-white text-xs font-semibold">{payload[0].payload.date}</p>
                    <p className="text-green-400 text-xs">Volume: {payload[0].value?.toFixed(2)}M</p>
                  </div>
                )
              }
              return null
            }} />
            <Bar 
              dataKey="volume" 
              fill="#22c55e" 
              opacity={0.6}
              radius={[2, 2, 0, 0]}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      
      {/* Chart Info */}
      <div className="grid grid-cols-3 gap-3 text-xs">
        <div className="p-3 bg-zinc-800/50 rounded-lg">
          <p className="text-zinc-500 mb-1">Distance to Trigger</p>
          <p className="text-lg font-bold text-cyan-400">{scan.distance_pct.toFixed(2)}%</p>
          <p className="text-xs text-zinc-600 mt-1">
            ${(scan.trigger_price - scan.price).toFixed(2)} upside
          </p>
        </div>
        <div className="p-3 bg-zinc-800/50 rounded-lg">
          <p className="text-zinc-500 mb-1">ADR (14-day)</p>
          <p className="text-lg font-bold text-white">{scan.adr_pct_14.toFixed(2)}%</p>
          <p className="text-xs text-zinc-600 mt-1">Daily volatility</p>
        </div>
        <div className="p-3 bg-zinc-800/50 rounded-lg">
          <p className="text-zinc-500 mb-1">Breakout Score</p>
          <p className={`text-lg font-bold ${
            scan.breakout_score >= 80 ? 'text-green-400' :
            scan.breakout_score >= 70 ? 'text-yellow-400' : 'text-orange-400'
          }`}>
            {scan.breakout_score}/100
          </p>
          <p className="text-xs text-zinc-600 mt-1">
            {scan.breakout_score >= 80 ? 'Excellent' :
             scan.breakout_score >= 70 ? 'Good' : 'Fair'} setup
          </p>
        </div>
      </div>
    </div>
  )
}
