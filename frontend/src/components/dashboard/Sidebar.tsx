import { cn } from "@/lib/utils"
import { LayoutDashboard, Brain, Target, TrendingUp, Settings, BarChart3, Activity } from "lucide-react"
import { Link, useLocation } from "react-router-dom"

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/admin" },
  { icon: Brain, label: "AI Insights", href: "/ai-insights" },
  { icon: Target, label: "Scanner", href: "/scanner" },
  { icon: TrendingUp, label: "Stock Momentum", href: "/stock-momentum" },
  { icon: BarChart3, label: "Analytics", href: "/analytics" },
  { icon: Activity, label: "Focus List", href: "/focus-list" },
  { icon: Settings, label: "Settings", href: "/settings" },
]

export function Sidebar() {
  const location = useLocation()

  return (
    <aside className="fixed left-0 top-20 bottom-0 w-64 border-r border-white/10 bg-black/95 backdrop-blur-xl z-40 overflow-y-auto">
      <div className="p-4">
        <div className="mb-6 px-3">
          <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider">Navigation</h2>
        </div>
        
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.href
            
            return (
              <Link
                key={item.label}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-gradient-to-r from-primary/15 to-primary/5 text-primary shadow-sm border border-primary/20"
                    : "text-white/70 hover:bg-white/5 hover:text-white",
                )}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span className="flex-1 text-left">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="mt-8 px-3 pt-6 border-t border-white/10">
          <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-emerald-400/5 border border-primary/20">
            <h3 className="text-sm font-bold text-white mb-2">Quick Navigation</h3>
            <p className="text-xs text-white/60 leading-relaxed">
              Use AI Insights for trading advice, Scanner for analysis, and Focus List to track your stocks.
            </p>
          </div>
        </div>
      </div>
    </aside>
  )
}
