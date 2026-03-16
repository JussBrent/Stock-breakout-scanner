import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sidebar } from "@/components/dashboard/Sidebar"
import { getWatchlist, addToWatchlist, removeFromWatchlist, WatchlistItem } from "@/lib/api"
import { Heart, X, Plus, Star, Loader2, AlertCircle } from "lucide-react"
import { motion } from "framer-motion"

export default function FocusListPage() {
  const [focusItems, setFocusItems] = useState<WatchlistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newSymbol, setNewSymbol] = useState("")
  const [showAddForm, setShowAddForm] = useState(false)
  const [adding, setAdding] = useState(false)

  // Fetch watchlist on mount
  useEffect(() => {
    fetchWatchlist()
  }, [])

  const fetchWatchlist = async () => {
    try {
      setLoading(true)
      setError(null)
      const items = await getWatchlist()
      setFocusItems(items)
    } catch (err: any) {
      setError(err.message || "Failed to load watchlist")
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = async (symbol: string) => {
    try {
      await removeFromWatchlist(symbol)
      setFocusItems(focusItems.filter((item) => item.symbol !== symbol))
    } catch (err: any) {
      setError(err.message || "Failed to remove from watchlist")
    }
  }

  const handleAddStock = async () => {
    if (!newSymbol.trim()) return
    try {
      setAdding(true)
      setError(null)
      const newItem = await addToWatchlist(newSymbol.trim())
      setFocusItems([newItem, ...focusItems])
      setNewSymbol("")
      setShowAddForm(false)
    } catch (err: any) {
      setError(err.message || "Failed to add to watchlist")
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="min-h-screen bg-black">
      <Sidebar />

      <div className="ml-[72px]">
        {/* Header */}
        <header className="fixed top-0 left-[72px] right-0 z-50 border-b border-white/5 bg-gradient-to-r from-neutral-950 via-neutral-900 to-neutral-950 backdrop-blur-xl">
          <div className="flex h-16 items-center justify-between px-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <div className="p-2 rounded-lg bg-gradient-to-br from-pink-500/20 to-rose-500/20 ring-1 ring-white/10">
                <Star className="h-5 w-5 text-pink-400" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-white tracking-tight">Focus List</h1>
                <p className="text-xs text-neutral-400 font-light">
                  Your watchlist of monitored stocks
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <Badge className="bg-gradient-to-r from-pink-500/20 to-rose-500/20 text-pink-400 border border-pink-500/30 px-3 py-1.5 h-fit rounded-lg font-medium">
                <Heart className="h-3.5 w-3.5 mr-1.5" />
                {focusItems.length} Stocks
              </Badge>
              <Button
                onClick={() => setShowAddForm(!showAddForm)}
                className="bg-gradient-to-r from-pink-600 to-rose-600 text-white hover:from-pink-700 hover:to-rose-700 shadow-lg"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Stock
              </Button>
            </motion.div>
          </div>
        </header>

        <main className="pt-24 p-8">
          {/* Error Message */}
          {error && (
            <Card className="bg-red-500/10 border-red-500/30 p-4 mb-6 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
              <p className="text-sm text-red-400">{error}</p>
              <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-300">
                <X className="h-4 w-4" />
              </button>
            </Card>
          )}

          {/* Add Stock Form */}
          {showAddForm && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <Card className="bg-white/[0.02] border-white/10 shadow-xl p-6 mb-6">
                <h3 className="text-lg font-semibold text-white mb-4">Add Stock to Focus List</h3>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter stock symbol (e.g., AAPL, TSLA, NVDA)..."
                    value={newSymbol}
                    onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === "Enter" && handleAddStock()}
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/50"
                    disabled={adding}
                  />
                  <Button
                    onClick={handleAddStock}
                    disabled={!newSymbol.trim() || adding}
                    className="bg-pink-600 text-white hover:bg-pink-700"
                  >
                    {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
                  </Button>
                  <Button
                    onClick={() => setShowAddForm(false)}
                    variant="outline"
                    className="border-white/20 text-white"
                    disabled={adding}
                  >
                    Cancel
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Loading State */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-8 w-8 text-pink-400 animate-spin mb-4" />
              <p className="text-white/60">Loading your watchlist...</p>
            </div>
          ) : focusItems.length > 0 ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-4">
              {focusItems.map((item, index) => (
                <motion.div
                  key={item.symbol}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + index * 0.05 }}
                >
                  <Card className="bg-white/[0.02] border-white/10 shadow-xl p-6 hover:border-white/20 transition-all duration-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-white">{item.symbol}</h3>
                          {item.alert_enabled && (
                            <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50 h-fit">
                              Alert Active
                            </Badge>
                          )}
                        </div>

                        <div className="grid grid-cols-3 gap-4 mt-4">
                          <div>
                            <p className="text-xs text-white/50 mb-1">Added</p>
                            <p className="text-sm font-medium text-white">
                              {new Date(item.added_at).toLocaleDateString()}
                            </p>
                          </div>

                          {item.alert_price && (
                            <div>
                              <p className="text-xs text-white/50 mb-1">Alert Price</p>
                              <p className="text-sm font-medium text-yellow-400">
                                ${item.alert_price.toFixed(2)}
                              </p>
                            </div>
                          )}

                          {item.notes && (
                            <div className="col-span-3 mt-2">
                              <p className="text-xs text-white/50 mb-1">Notes</p>
                              <p className="text-sm text-white/80">{item.notes}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => handleRemove(item.symbol)}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                      >
                        <X className="h-5 w-5 text-white/60 hover:text-white" />
                      </button>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
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
