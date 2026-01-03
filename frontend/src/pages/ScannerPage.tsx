import { Sidebar } from "@/components/dashboard/Sidebar"
import { StockScanner } from "@/components/dashboard/StockScanner"
import { Zap, Search } from "lucide-react"

export default function ScannerPage() {
  return (
    <div className="min-h-screen bg-black">
      <Sidebar />

      <div className="ml-64">
        {/* Header */}
        <header className="fixed top-0 left-64 right-0 z-50 border-b border-white/10 bg-black/95 backdrop-blur-xl">
          <div className="flex h-20 items-center justify-between px-8">
            <div className="flex items-center gap-4">
              <div className="p-2.5 rounded-xl bg-primary/15">
                <Search className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent">
                  Stock Scanner
                </h1>
                <p className="text-sm text-white/60 mt-0.5">AI-powered analysis by name, image, or content</p>
              </div>
            </div>
          </div>
        </header>

        <main className="pt-32 p-8">
          <StockScanner />
        </main>
      </div>
    </div>
  )
}
