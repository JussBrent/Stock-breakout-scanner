import { useState } from "react"
import { mockStockData, getAIInsight, type StockData, type AIInsight } from "@/lib/mock-data"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ChevronDown, ChevronUp, TrendingUp, Target, Activity, Brain, AlertTriangle, BarChart3, CheckCircle2 } from "lucide-react"

function AIInsightPanel({ stock, insight }: { stock: StockData; insight: AIInsight }) {
  return (
    <div className="p-6 grid gap-6 md:grid-cols-2">
      <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20 p-6 shadow-lg">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 rounded-lg bg-primary/15">
            <Brain className="h-5 w-5 text-primary" />
          </div>
          <h4 className="font-bold text-lg text-white">AI Analysis</h4>
          <Badge className="ml-auto bg-primary/20 text-primary border-primary/30">Powered by AI</Badge>
        </div>
        <div className="space-y-5">
          <div>
            <p className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">
              Pattern Detected
            </p>
            <Badge variant="outline" className="border-primary/40 text-primary bg-primary/5 text-sm px-3 py-1">
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
                  style={{ width: `${stock.aiConfidence}%` }}
                />
              </div>
              <span className="text-base font-bold text-emerald-400 min-w-[48px] text-right">{stock.aiConfidence}%</span>
            </div>
          </div>
        </div>
      </Card>

      <Card className="bg-white/5 border-white/10 p-6 shadow-lg">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 rounded-lg bg-amber-500/15">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
          </div>
          <h4 className="font-bold text-lg text-white">Risk Assessment</h4>
        </div>
        <ul className="space-y-3 mb-6">
          {insight.riskNotes.map((note, index) => (
            <li key={index} className="flex items-start gap-3 text-sm group">
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary flex-shrink-0" />
              <span className="text-white/70 group-hover:text-white transition-colors">{note}</span>
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
  )
}

export function ScanResults() {
  const [expandedStock, setExpandedStock] = useState<string | null>(null)

  const getSignalBadge = (score: number) => {
    if (score >= 90)
      return { label: "STRONG BUY", color: "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" }
    if (score >= 85) return { label: "BUY", color: "bg-primary/80 text-white shadow-md shadow-primary/10" }
    return { label: "WATCH", color: "bg-amber-500/80 text-white" }
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="border-b border-white/10 bg-white/5">
          <tr className="text-left">
            <th className="px-6 py-4 text-xs font-semibold text-white/60 uppercase tracking-wider">Symbol</th>
            <th className="px-6 py-4 text-xs font-semibold text-white/60 uppercase tracking-wider">Company</th>
            <th className="px-6 py-4 text-xs font-semibold text-white/60 uppercase tracking-wider">
              Current Price
            </th>
            <th className="px-6 py-4 text-xs font-semibold text-white/60 uppercase tracking-wider">
              <div className="flex items-center gap-1">
                <Target className="h-3 w-3" />
                Breakout Level
              </div>
            </th>
            <th className="px-6 py-4 text-xs font-semibold text-white/60 uppercase tracking-wider">
              <div className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                Upside
              </div>
            </th>
            <th className="px-6 py-4 text-xs font-semibold text-white/60 uppercase tracking-wider">
              <div className="flex items-center gap-1">
                <Activity className="h-3 w-3" />
                Strength Score
              </div>
            </th>
            <th className="px-6 py-4 text-xs font-semibold text-white/60 uppercase tracking-wider">Signal</th>
            <th className="px-6 py-4"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/10">
          {mockStockData.map((stock) => {
            const signal = getSignalBadge(stock.score)
            const insight = getAIInsight(stock.symbol)
            const isExpanded = expandedStock === stock.symbol

            return (
              <>
                <tr key={stock.symbol} className="hover:bg-white/5 transition-all duration-200 group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 text-sm font-bold group-hover:from-primary/30 group-hover:to-primary/10 transition-all">
                        {stock.symbol.charAt(0)}
                      </div>
                      <span className="font-bold text-base text-white">{stock.symbol}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-sm text-white/70">{stock.company}</span>
                  </td>
                  <td className="px-6 py-5">
                    <span className="font-mono text-base font-semibold text-white">${stock.price.toFixed(2)}</span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-base font-semibold text-primary">
                        ${stock.breakoutLevel.toFixed(2)}
                      </span>
                      {stock.price < stock.breakoutLevel && (
                        <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-400 border-amber-500/30">
                          Watch
                        </Badge>
                      )}
                      {stock.price >= stock.breakoutLevel && (
                        <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                          Active
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 text-emerald-400">
                        <TrendingUp className="h-4 w-4" />
                        <span className="font-semibold text-base">{stock.upside.toFixed(2)}%</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="h-12 w-12 rounded-full border-4 border-primary/20 flex items-center justify-center bg-primary/5">
                          <span className="text-lg font-bold text-primary">{stock.score}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <Badge className={`${signal.color} px-3 py-1 text-xs font-bold`}>{signal.label}</Badge>
                  </td>
                  <td className="px-6 py-5">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedStock(isExpanded ? null : stock.symbol)}
                      className="hover:bg-primary/10"
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-primary" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-white/70" />
                      )}
                    </Button>
                  </td>
                </tr>
                {isExpanded && (
                  <tr>
                    <td colSpan={8} className="px-0 py-0">
                      <div className="bg-gradient-to-r from-primary/5 via-primary/3 to-transparent">
                        <AIInsightPanel stock={stock} insight={insight} />
                      </div>
                    </td>
                  </tr>
                )}
              </>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
