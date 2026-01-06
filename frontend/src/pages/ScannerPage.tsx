import { Sidebar } from "@/components/dashboard/Sidebar"
import { StockScanner } from "@/components/dashboard/StockScanner"
import { Sparkles, Target } from "lucide-react"
import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"

export default function ScannerPage() {
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
              <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 ring-1 ring-white/10">
                <Target className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-white tracking-tight">Advanced Stock Scanner</h1>
                <p className="text-xs text-neutral-400 font-light">
                  Analyze stocks by name, chart screenshot, or content
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-4"
            >
              <Badge className="bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 h-fit rounded-lg font-medium">
                <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                AI Powered
              </Badge>
            </motion.div>
          </div>
        </header>

        <main className="pt-24 p-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <StockScanner />
          </motion.div>
        </main>
      </div>
    </div>
  )
}
