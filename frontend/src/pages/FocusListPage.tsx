import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sidebar } from "@/components/dashboard/Sidebar"
import { mockFocusListItems, FocusListItem } from "@/lib/mock-data"
import { Heart, X, Plus, TrendingUp, TrendingDown, Target, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"

export default function FocusListPage() {
  const [focusItems, setFocusItems] = useState<FocusListItem[]>(mockFocusListItems)
  const [newSymbol, setNewSymbol] = useState("")
  const [showAddForm, setShowAddForm] = useState(false)

  const removeFromFocus = (id: string) => {
    setFocusItems(focusItems.filter((item) => item.id !== id))
  }

  const handleAddStock = () => {
    if (newSymbol.trim()) {
      // Mock adding - in real app would fetch data
      const newItem: FocusListItem = {
        id: `focus-${Date.now()}`,
        symbol: newSymbol.toUpperCase(),
        company: `${newSymbol} Corp`,
        price: Math.random() * 500 + 100,
        change: (Math.random() - 0.5) * 20,
        changePercent: (Math.random() - 0.5) * 5,
        target: Math.random() * 500 + 150,
        dailyUpdate: "Recently added to your focus list. Monitoring for opportunities.",
        addedDate: new Date(),
      }
      setFocusItems([newItem, ...focusItems])
      setNewSymbol("")
      setShowAddForm(false)
    }
  }

  return (
    <div className="min-h-screen bg-black">
      <Sidebar />

      <div className="ml-64">
        {/* Header */}
        <header className="fixed top-0 left-64 right-0 z-50 border-b border-white/10 bg-black/95 backdrop-blur-xl">
          <div className="flex h-20 items-center justify-between px-8">
            <div className="flex items-center gap-4">
              <div className="p-2.5 rounded-xl bg-pink-500/15">
                <Heart className="h-6 w-6 text-pink-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-400 to-rose-400 bg-clip-text text-transparent">
                  Focus List
                </h1>
                <p className="text-sm text-white/60 mt-0.5">Stocks you're monitoring daily</p>
              </div>
            </div>

            <Button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-pink-600 text-white hover:bg-pink-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Stock
            </Button>
          </div>
        </header>

        <main className="pt-32 p-8">
          {/* Add Stock Form */}
          {showAddForm && (
            <Card className="bg-white/[0.02] border-white/10 shadow-xl p-6 mb-6 animate-in fade-in slide-in-from-top-2">
              <h3 className="text-lg font-semibold text-white mb-4">Add Stock to Focus List</h3>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter stock symbol (e.g., AAPL, TSLA, NVDA)..."
                  value={newSymbol}
                  onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
                  onKeyPress={(e) => e.key === "Enter" && handleAddStock()}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/50"
                />
                <Button
                  onClick={handleAddStock}
                  disabled={!newSymbol.trim()}
                  className="bg-pink-600 text-white hover:bg-pink-700"
                >
                  Add
                </Button>
                <Button
                  onClick={() => setShowAddForm(false)}
                  variant="outline"
                  className="border-white/20 text-white"
                >
                  Cancel
                </Button>
              </div>
            </Card>
          )}

          {/* Focus List Items */}
          {focusItems.length > 0 ? (
            <div className="space-y-4">
              {focusItems.map((item) => (
                <Card
                  key={item.id}
                  className="bg-white/[0.02] border-white/10 shadow-xl p-6 hover:border-white/20 transition-all duration-200"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-white">{item.symbol}</h3>
                        <Badge
                          className={cn(
                            "h-fit",
                            item.changePercent >= 0
                              ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/50"
                              : "bg-red-500/20 text-red-400 border-red-500/50"
                          )}
                        >
                          {item.changePercent >= 0 ? (
                            <TrendingUp className="h-3 w-3 mr-1" />
                          ) : (
                            <TrendingDown className="h-3 w-3 mr-1" />
                          )}
                          {item.changePercent >= 0 ? "+" : ""}
                          {item.changePercent.toFixed(2)}%
                        </Badge>
                      </div>
                      <p className="text-sm text-white/60">{item.company}</p>
                    </div>

                    <button
                      onClick={() => removeFromFocus(item.id)}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <X className="h-5 w-5 text-white/60 hover:text-white" />
                    </button>
                  </div>

                  <div className="grid grid-cols-4 gap-4 mb-6 pb-6 border-b border-white/10">
                    <div>
                      <p className="text-xs text-white/50 mb-1">Current Price</p>
                      <p className="text-lg font-bold text-white">${item.price.toFixed(2)}</p>
                    </div>

                    <div>
                      <p className="text-xs text-white/50 mb-1">Daily Change</p>
                      <p
                        className={cn(
                          "text-lg font-bold",
                          item.change >= 0 ? "text-emerald-400" : "text-red-400"
                        )}
                      >
                        {item.change >= 0 ? "+" : ""}${item.change.toFixed(2)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-white/50 mb-1">Target Price</p>
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-blue-400" />
                        <p className="text-lg font-bold text-white">${item.target.toFixed(2)}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-white/50 mb-1">Upside Potential</p>
                      <p className="text-lg font-bold text-emerald-400">
                        +{(((item.target - item.price) / item.price) * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <p className="text-xs text-white/50 mb-2 flex items-center gap-2">
                      <Calendar className="h-3 w-3" />
                      Daily Update
                    </p>
                    <p className="text-sm text-white/80 leading-relaxed">{item.dailyUpdate}</p>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <p className="text-xs text-white/40">
                      Added {Math.floor((Date.now() - item.addedDate.getTime()) / (24 * 60 * 60 * 1000))} days ago
                    </p>
                    <Button variant="outline" size="sm" className="border-white/20 text-white/80 hover:text-white">
                      View Details
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="bg-white/[0.02] border-white/10 shadow-xl p-12 text-center">
              <Heart className="h-12 w-12 text-white/20 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No stocks in your focus list</h3>
              <p className="text-white/60 mb-6">Add stocks you want to monitor daily for opportunities</p>
              <Button onClick={() => setShowAddForm(true)} className="bg-pink-600 text-white hover:bg-pink-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Stock
              </Button>
            </Card>
          )}
        </main>
      </div>
    </div>
  )
}
