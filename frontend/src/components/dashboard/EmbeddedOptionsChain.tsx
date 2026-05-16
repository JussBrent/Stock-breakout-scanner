"use client"

import { useState, useEffect, useCallback } from "react"
import { RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import type { OptionsContract } from "./OptionsChain"

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/$/, "")

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { supabase } = await import("@/lib/supabase")
  const { data } = await supabase.auth.getSession()
  const token = data?.session?.access_token
  return { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }
}

interface EmbeddedOptionsChainProps {
  ticker: string
  currentPrice: number
  entryPrice?: number | null
  stopPrice?: number | null
  suggestedExpiry?: string | null
  direction?: "Long" | "Short" | null
  onTradeClick: (contract: OptionsContract) => void
}

interface ChainData {
  expirations: string[]
  calls: OptionsContract[]
  puts: OptionsContract[]
}

function fmt(n: number | null | undefined): string {
  return n != null ? n.toFixed(2) : "—"
}
function fmtPct(n: number | null | undefined): string {
  return n != null ? `${(n * 100).toFixed(0)}%` : "—"
}

export function EmbeddedOptionsChain({
  ticker,
  currentPrice,
  entryPrice,
  stopPrice,
  suggestedExpiry,
  direction,
  onTradeClick,
}: EmbeddedOptionsChainProps) {
  const [chain, setChain] = useState<ChainData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchChain = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const headers = await getAuthHeaders()
      const res = await fetch(`${API_URL}/api/options/chain/${ticker}?limit=50`, { headers })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setChain({ expirations: data.expirations ?? [], calls: data.calls ?? [], puts: data.puts ?? [] })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load options")
    } finally {
      setLoading(false)
    }
  }, [ticker])

  useEffect(() => { fetchChain() }, [fetchChain])

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse px-1">
        <div className="h-3 bg-white/10 rounded w-28" />
        <div className="grid grid-cols-2 gap-3">
          {[0, 1].map(i => (
            <div key={i} className="space-y-1.5">
              {[0, 1, 2, 3, 4].map(j => <div key={j} className="h-7 bg-white/5 rounded" />)}
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error || !chain) {
    return (
      <div className="flex items-center justify-between px-1 py-2">
        <p className="text-xs text-red-400">{error ?? "No options data"}</p>
        <button onClick={fetchChain} className="text-xs text-white/40 hover:text-white underline">Retry</button>
      </div>
    )
  }

  // Prioritise the AI-suggested expiry, then fill up to 2 from the available list.
  // If suggestedExpiry isn't an exact match, pick the nearest available date on or after it.
  const expiryDates = (() => {
    const all = chain.expirations // already sorted ascending by backend
    if (!suggestedExpiry) return all.slice(0, 2)

    // Find the closest available expiry on or after the suggested date
    const match = all.find(e => e >= suggestedExpiry) ?? all[0]
    const rest = all.filter(e => e !== match)
    return [match, ...rest].slice(0, 2)
  })()

  const nearestStrike = (contracts: OptionsContract[], price: number): number | null => {
    const sorted = contracts
      .filter(c => c.strike != null)
      .sort((a, b) => Math.abs((a.strike ?? 0) - price) - Math.abs((b.strike ?? 0) - price))
    return sorted[0]?.strike ?? null
  }

  const filterContracts = (contracts: OptionsContract[], expiry: string): OptionsContract[] => {
    const forExpiry = contracts.filter(c => c.expiration === expiry && c.strike != null)
    const sorted = [...forExpiry].sort((a, b) => Math.abs((a.strike ?? 0) - currentPrice) - Math.abs((b.strike ?? 0) - currentPrice))
    return sorted.slice(0, 10).sort((a, b) => (a.strike ?? 0) - (b.strike ?? 0))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-semibold text-white/80 uppercase tracking-wider">Options Chain</h4>
          <span className="px-1.5 py-0.5 text-[10px] font-mono bg-white/5 text-white/40 rounded">{ticker}</span>
        </div>
        <button onClick={fetchChain} className="p-1 text-white/30 hover:text-white transition-colors" title="Refresh">
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
      </div>

      {expiryDates.length === 0 && (
        <p className="text-xs text-white/40">No expiry dates available.</p>
      )}

      {expiryDates.map(expiry => {
        const calls = filterContracts(chain.calls, expiry)
        const puts = filterContracts(chain.puts, expiry)
        const recPrice = entryPrice ?? currentPrice
        const recCallStrike = nearestStrike(calls, recPrice)
        const recPutStrike = nearestStrike(puts, recPrice)
        const stopCallStrike = stopPrice ? nearestStrike(calls, stopPrice) : null
        const stopPutStrike = stopPrice ? nearestStrike(puts, stopPrice) : null

        const recStrike = direction === "Short" ? recPutStrike : recCallStrike

        const ColHeader = () => (
          <tr className="border-b border-white/10">
            {["Strike", "Bid", "Ask", "IV", "Δ"].map(h => (
              <th key={h} className="px-1.5 py-1 text-left text-[9px] font-mono uppercase text-white/30">{h}</th>
            ))}
          </tr>
        )

        const ContractRow = ({ c, isCall }: { c: OptionsContract; isCall: boolean }) => {
          const isRec = c.strike === (isCall ? recCallStrike : recPutStrike) && (direction ? (isCall ? direction === "Long" : direction === "Short") : true)
          const isStop = c.strike === (isCall ? stopCallStrike : stopPutStrike) && stopPrice != null
          return (
            <tr
              className={cn(
                "text-[11px] cursor-pointer transition-colors hover:bg-white/5",
                isRec && "bg-emerald-500/10 border-l-2 border-emerald-500",
                isStop && !isRec && "bg-red-500/10 border-l-2 border-red-500"
              )}
              onClick={() => onTradeClick(c)}
            >
              <td className={cn("px-1.5 py-1 font-semibold", isRec ? "text-emerald-300" : isStop ? "text-red-300" : "text-white")}>
                ${fmt(c.strike)}
              </td>
              <td className="px-1.5 py-1 text-white/60">{fmt(c.bid)}</td>
              <td className="px-1.5 py-1 text-white/60">{fmt(c.ask)}</td>
              <td className="px-1.5 py-1 text-blue-300">{fmtPct(c.iv)}</td>
              <td className={cn("px-1.5 py-1", isCall ? "text-emerald-400" : "text-red-400")}>
                {fmt(c.delta)}
              </td>
            </tr>
          )
        }

        const recContract = direction === "Short"
          ? puts.find(c => c.strike === recPutStrike)
          : calls.find(c => c.strike === recCallStrike)

        return (
          <div key={expiry} className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-white/50 bg-white/5 px-2 py-0.5 rounded">{expiry}</span>
              {suggestedExpiry && expiry >= suggestedExpiry && expiry === expiryDates[0] && (
                <span className="text-[9px] font-semibold uppercase tracking-wider text-purple-400 bg-purple-500/10 border border-purple-500/20 px-1.5 py-0.5 rounded">AI pick</span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {/* Calls */}
              <div>
                <p className="text-[10px] font-semibold text-emerald-400 uppercase mb-1">Calls</p>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead><ColHeader /></thead>
                    <tbody>
                      {calls.length > 0
                        ? calls.map(c => <ContractRow key={c.ticker} c={c} isCall={true} />)
                        : <tr><td colSpan={5} className="px-1.5 py-2 text-[10px] text-white/30">No data</td></tr>
                      }
                    </tbody>
                  </table>
                </div>
              </div>
              {/* Puts */}
              <div>
                <p className="text-[10px] font-semibold text-red-400 uppercase mb-1">Puts</p>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead><ColHeader /></thead>
                    <tbody>
                      {puts.length > 0
                        ? puts.map(c => <ContractRow key={c.ticker} c={c} isCall={false} />)
                        : <tr><td colSpan={5} className="px-1.5 py-2 text-[10px] text-white/30">No data</td></tr>
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            {/* Trade recommended row */}
            {direction && recContract && (
              <div className="flex items-center justify-between px-3 py-2 bg-white/5 border border-white/10 rounded-lg">
                <span className="text-xs text-white/50">
                  Recommended: <span className={cn("font-semibold", direction === "Long" ? "text-emerald-400" : "text-red-400")}>
                    {direction === "Long" ? "CALL" : "PUT"} ${fmt(recStrike)}
                  </span> exp {expiry}
                </span>
                <button
                  onClick={() => onTradeClick(recContract)}
                  className="px-3 py-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors"
                >
                  Trade this
                </button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
