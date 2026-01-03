import { Card } from "@/components/ui/card"
import { TrendingUp, Target, Zap, Activity } from "lucide-react"

const metrics = [
  { label: "AVG SCORE", value: "90.3", icon: Activity, trend: "+3.2", trendUp: true },
  { label: "AVG UPSIDE", value: "18.4%", icon: TrendingUp, trend: "+2.1%", trendUp: true },
  { label: "STRONG BUYS", value: "2", icon: Target, trend: "of 4", trendUp: null },
  { label: "AVG RSI", value: "65", icon: Zap, trend: "+5", trendUp: true },
]

export function MetricsCards() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric) => {
        const Icon = metric.icon
        return (
          <Card
            key={metric.label}
            className="bg-gradient-to-br from-white/5 to-white/[0.02] border-white/10 p-6 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="p-2.5 rounded-xl bg-primary/10 group-hover:bg-primary/15 transition-colors">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              {metric.trendUp !== null && (
                <div
                  className={`flex items-center gap-1 text-xs font-medium ${
                    metric.trendUp ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  <TrendingUp className={`h-3 w-3 ${!metric.trendUp && "rotate-180"}`} />
                  {metric.trend}
                </div>
              )}
              {metric.trendUp === null && <span className="text-xs text-white/50">{metric.trend}</span>}
            </div>
            <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
              {metric.label}
            </h3>
            <p className="text-4xl font-bold bg-gradient-to-br from-primary to-emerald-400 bg-clip-text text-transparent">
              {metric.value}
            </p>
          </Card>
        )
      })}
    </div>
  )
}
