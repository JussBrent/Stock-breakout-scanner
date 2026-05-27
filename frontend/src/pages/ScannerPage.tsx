import { Sidebar } from "@/components/dashboard/Sidebar"
import { StockScanner } from "@/components/dashboard/StockScanner"
import { Target } from "lucide-react"

export default function ScannerPage() {
  return (
    <div className="flex min-h-screen bg-[#0a0a0a] text-white">
      <Sidebar />
      <div className="flex-1 ml-[var(--sidebar-w,60px)] transition-[margin-left] duration-300 ease-in-out min-h-screen">
        {/* Header */}
        <header className="fixed top-0 left-[var(--sidebar-w,60px)] transition-[left] duration-300 ease-in-out right-0 z-50 h-12 border-b border-white/8 bg-[#0d0d0d] flex items-center px-6 gap-3">
          <Target className="h-4 w-4 text-white/40 shrink-0" />
          <span className="text-sm font-semibold text-white tracking-tight">Scanner</span>
          <span className="text-white/20 text-sm">/</span>
          <span className="text-xs text-white/40 font-mono">Stock · Chart · News Analysis</span>
        </header>
        <main className="pt-12 p-6">
          <StockScanner />
        </main>
      </div>
    </div>
  )
}
