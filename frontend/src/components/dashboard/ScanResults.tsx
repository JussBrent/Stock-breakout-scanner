import { useState, useEffect } from "react"
import { aiAnalyzeScan, type AIStockRating } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ChevronDown, ChevronUp, TrendingUp, Target, Activity, Brain, AlertTriangle, BarChart3, CheckCircle2, Loader } from "lucide-react"

function AIInsightPanel({ rating }: { rating: AIStockRating }) {
  const getRiskColor = (risk: string) => {
    switch (risk.toLowerCase()) {
      case "low":
        return "text-emerald-400"
      case "high":
        return "text-red-400"
      default:
        return "text-yellow-400"
    }
  }

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
              Opportunity Score
            </p>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-3 bg-white/10 rounded-full overflow-hidden border border-white/10">
                <div
                  className="h-full bg-gradient-to-r from-primary to-emerald-400 rounded-full transition-all duration-500"
                  style={{ width: `${rating.opportunity_score}%` }}
                />
              </div>
              <span className="text-base font-bold text-primary min-w-[48px] text-right">{rating.opportunity_score}</span>
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
                  style={{ width: `${rating.confidence}%` }}
                />
              </div>
              <span className="text-base font-bold text-emerald-400 min-w-[48px] text-right">{rating.confidence}%</span>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">
              Risk Level
            </p>
            <Badge variant="outline" className={`border-primary/40 bg-primary/5 text-sm px-3 py-1 ${getRiskColor(rating.risk_level)}`}>
              <AlertTriangle className="mr-1.5 h-3.5 w-3.5" />
              {rating.risk_level}
            </Badge>
          </div>
          <div>
            <p className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-3">
              AI Analysis
            </p>
            <p className="text-sm text-white/70 leading-relaxed">{rating.analysis}</p>
          </div>
        </div>
      </Card>

      <Card className="bg-white/5 border-white/10 p-6 shadow-lg">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 rounded-lg bg-emerald-400/15">
            <BarChart3 className="h-5 w-5 text-emerald-400" />
          </div>
          <h4 className="font-bold text-lg text-white">Key Factors</h4>
        </div>
        <ul className="space-y-3 mb-6">
          {rating.key_factors.map((factor, index) => (
            <li key={index} className="flex items-start gap-3 text-sm group">
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary flex-shrink-0" />
              <span className="text-white/70 group-hover:text-white transition-colors">{factor}</span>
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
              <p className="text-sm text-white/70 leading-relaxed">{rating.recommendation}</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

export function ScanResults() {
  const [expandedStock, setExpandedStock] = useState<string | null>(null)
  const [ratings, setRatings] = useState<AIStockRating[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadAIRatings()
  }, [])

  const loadAIRatings = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await aiAnalyzeScan({}, 10) // Get top 10 stocks
      setRatings(response.ratings)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load AI ratings")
      console.error("Error loading AI ratings:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const getSignalBadge = (score: number) => {
    if (score >= 90)
      return { label: "STRONG BUY", color: "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" }
    if (score >= 75) return { label: "BUY", color: "bg-primary/80 text-white shadow-md shadow-primary/10" }
    if (score >= 60) return { label: "HOLD", color: "bg-amber-500/80 text-white" }
    return { label: "WATCH", color: "bg-white/20 text-white/60" }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <Loader className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-white/60">Analyzing stocks with AI...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <AlertTriangle className="h-8 w-8 text-red-400 mx-auto" />
          <p className="text-red-400">{error}</p>
          <Button onClick={loadAIRatings} variant="outline" className="border-white/20 text-white hover:bg-white/10">
            Retry
          </Button>
        </div>
      </div>
    )
  }

  if (ratings.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <BarChart3 className="h-8 w-8 text-white/40 mx-auto" />
          <p className="text-white/60">No stocks found matching criteria</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-white/60">Showing {ratings.length} AI-rated opportunities</p>
        <Button onClick={loadAIRatings} variant="ghost" size="sm" className="text-white/60 hover:text-white hover:bg-white/5">
          <Activity className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-white/10 bg-white/5">
            <tr className="text-left">
              <th className="px-6 py-4 text-xs font-semibold text-white/60 uppercase tracking-wider">Symbol</th>
              <th className="px-6 py-4 text-xs font-semibold text-white/60 uppercase tracking-wider">
                <div className="flex items-center gap-1">
                  <Target className="h-3 w-3" />
                  Opportunity
                </div>
              </th>
              <th className="px-6 py-4 text-xs font-semibold text-white/60 uppercase tracking-wider">
                <div className="flex items-center gap-1">
                  <Brain className="h-3 w-3" />
                  Confidence
                </div>
              </th>
              <th className="px-6 py-4 text-xs font-semibold text-white/60 uppercase tracking-wider">
                <div className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Risk
                </div>
              </th>
              <th className="px-6 py-4 text-xs font-semibold text-white/60 uppercase tracking-wider">Recommendation</th>
              <th className="px-6 py-4 text-xs font-semibold text-white/60 uppercase tracking-wider">Signal</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {ratings.map((rating) => {
              const signal = getSignalBadge(rating.opportunity_score)
              const isExpanded = expandedStock === rating.symbol

              return (
                <>
                  <tr key={rating.symbol} className="hover:bg-white/5 transition-all duration-200 group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 text-sm font-bold group-hover:from-primary/30 group-hover:to-primary/10 transition-all">
                          {rating.symbol.charAt(0)}
                        </div>
                        <span className="font-bold text-base text-white">{rating.symbol}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="h-12 w-12 rounded-full border-4 border-primary/20 flex items-center justify-center bg-primary/5">
                            <span className="text-lg font-bold text-primary">{rating.opportunity_score}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 max-w-[120px] h-2 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-400 to-emerald-300 rounded-full transition-all duration-500"
                            style={{ width: `${rating.confidence}%` }}
                          />
                        </div>
                        <span className="font-semibold text-sm text-emerald-400">{rating.confidence}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <Badge
                        variant="outline"
                        className={`text-xs px-3 py-1 ${
                          rating.risk_level.toLowerCase() === "low"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                            : rating.risk_level.toLowerCase() === "high"
                            ? "bg-red-500/10 text-red-400 border-red-500/30"
                            : "bg-yellow-500/10 text-yellow-400 border-yellow-500/30"
                        }`}
                      >
                        {rating.risk_level}
                      </Badge>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-sm font-medium text-white/80">{rating.recommendation}</span>
                    </td>
                    <td className="px-6 py-5">
                      <Badge className={`${signal.color} px-3 py-1 text-xs font-bold`}>{signal.label}</Badge>
                    </td>
                    <td className="px-6 py-5">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedStock(isExpanded ? null : rating.symbol)}
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
                      <td colSpan={7} className="px-0 py-0">
                        <div className="bg-gradient-to-r from-primary/5 via-primary/3 to-transparent">
                          <AIInsightPanel rating={rating} />
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
    </div>
  )
}
