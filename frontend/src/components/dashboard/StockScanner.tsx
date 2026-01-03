import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScanDiagnostic, mockScanResults } from "@/lib/mock-data"
import {
  Zap,
  Upload,
  Search,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Loader,
  X,
  BarChart3,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface ScanInput {
  type: "stock_name" | "screenshot" | "content"
  value: string
  file?: File
}

export function StockScanner() {
  const [scanInput, setScanInput] = useState<ScanInput>({ type: "stock_name", value: "" })
  const [isScanning, setIsScanning] = useState(false)
  const [scanResults, setScanResults] = useState(mockScanResults[0])
  const [showResults, setShowResults] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const handleScan = async () => {
    if (!scanInput.value.trim() && !selectedFile) return

    setIsScanning(true)
    // Simulate scan process
    setTimeout(() => {
      setScanResults(mockScanResults[0])
      setShowResults(true)
      setIsScanning(false)
    }, 2500)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setScanInput({ type: "screenshot", value: file.name, file })
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "positive":
        return <CheckCircle2 className="h-4 w-4 text-emerald-400" />
      case "negative":
        return <AlertCircle className="h-4 w-4 text-red-400" />
      case "warning":
        return <AlertCircle className="h-4 w-4 text-yellow-400" />
      default:
        return <BarChart3 className="h-4 w-4 text-blue-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "positive":
        return "bg-emerald-500/10 border-emerald-500/30"
      case "negative":
        return "bg-red-500/10 border-red-500/30"
      case "warning":
        return "bg-yellow-500/10 border-yellow-500/30"
      default:
        return "bg-blue-500/10 border-blue-500/30"
    }
  }

  return (
    <div className="space-y-6">
      {/* Scan Input Section */}
      <Card className="bg-white/[0.02] border-white/10 shadow-xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-primary/15">
            <Zap className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white">Advanced Stock Scanner</h3>
            <p className="text-sm text-white/60">Analyze stocks by name, image, or content</p>
          </div>
        </div>

        {/* Input Tabs */}
        <div className="flex gap-2 mb-6 border-b border-white/10">
          <button
            onClick={() => {
              setScanInput({ type: "stock_name", value: "" })
              setSelectedFile(null)
            }}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
              scanInput.type === "stock_name"
                ? "border-primary text-primary"
                : "border-transparent text-white/60 hover:text-white"
            )}
          >
            Stock Name
          </button>
          <button
            onClick={() => {
              setScanInput({ type: "screenshot", value: "" })
              setSelectedFile(null)
            }}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
              scanInput.type === "screenshot"
                ? "border-primary text-primary"
                : "border-transparent text-white/60 hover:text-white"
            )}
          >
            Chart Screenshot
          </button>
          <button
            onClick={() => {
              setScanInput({ type: "content", value: "" })
              setSelectedFile(null)
            }}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
              scanInput.type === "content"
                ? "border-primary text-primary"
                : "border-transparent text-white/60 hover:text-white"
            )}
          >
            Stock Content
          </button>
        </div>

        {/* Input Areas */}
        <div className="space-y-4">
          {scanInput.type === "stock_name" && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80">Stock Symbol or Name</label>
              <Input
                placeholder="e.g., NVDA, Apple, Tesla..."
                value={scanInput.value}
                onChange={(e) => setScanInput({ type: "stock_name", value: e.target.value })}
                onKeyPress={(e) => e.key === "Enter" && handleScan()}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/50"
              />
              <p className="text-xs text-white/50">
                Enter a stock ticker or company name and let AI analyze it
              </p>
            </div>
          )}

          {scanInput.type === "screenshot" && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <Upload className="h-8 w-8 text-white/50 mx-auto mb-3" />
                <p className="text-white/80 font-medium">Upload Chart Screenshot</p>
                <p className="text-xs text-white/50 mt-1">
                  PNG, JPG, or GIF. AI will analyze patterns and trends.
                </p>
              </div>

              {selectedFile && (
                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10">
                  <div className="flex-1">
                    <p className="text-sm text-white">{selectedFile.name}</p>
                    <p className="text-xs text-white/50">{(selectedFile.size / 1024).toFixed(2)} KB</p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedFile(null)
                      setScanInput({ type: "screenshot", value: "" })
                    }}
                    className="p-1 hover:bg-white/10 rounded"
                  >
                    <X className="h-4 w-4 text-white/60" />
                  </button>
                </div>
              )}
            </div>
          )}

          {scanInput.type === "content" && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80">Stock Information</label>
              <textarea
                placeholder="Paste news articles, analysis, earnings reports, or any stock-related content. AI will analyze and provide insights..."
                value={scanInput.value}
                onChange={(e) => setScanInput({ type: "content", value: e.target.value })}
                className="w-full h-32 bg-white/5 border border-white/10 text-white placeholder:text-white/50 rounded-lg p-3 resize-none"
              />
              <p className="text-xs text-white/50">
                Paste financial news, technical analysis, or market commentary
              </p>
            </div>
          )}

          <Button
            onClick={handleScan}
            disabled={isScanning || (!scanInput.value.trim() && !selectedFile)}
            size="lg"
            className="w-full bg-primary text-white hover:bg-primary/90"
          >
            {isScanning ? (
              <>
                <Loader className="mr-2 h-4 w-4 animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Run AI Scan
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Results Section */}
      {showResults && (
        <Card className="bg-white/[0.02] border-white/10 shadow-xl p-8 animate-in fade-in slide-in-from-bottom-4">
          <div className="mb-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold text-white">Scan Results</h3>
                <p className="text-sm text-white/60 mt-1">
                  {scanResults.inputType === "stock_name"
                    ? `Analysis for ${scanResults.input}`
                    : scanResults.inputType === "screenshot"
                      ? "Chart Analysis Results"
                      : "Content Analysis Results"}
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent">
                  {scanResults.overallScore}
                </div>
                <p className="text-xs text-white/60">Overall Score</p>
              </div>
            </div>

            <Badge className={cn("bg-emerald-500/20 text-emerald-400 border-emerald-500/50")}>
              <TrendingUp className="h-3 w-3 mr-1.5" />
              {scanResults.recommendation}
            </Badge>
          </div>

          {/* Diagnostics */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-white/80">Diagnostic Details</h4>
            {scanResults.diagnostics.map((diagnostic, idx) => (
              <div
                key={idx}
                className={cn(
                  "border rounded-lg p-4 space-y-2",
                  getStatusColor(diagnostic.status)
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(diagnostic.status)}
                    <h5 className="font-medium text-white">{diagnostic.category}</h5>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-12 h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-emerald-400"
                        style={{ width: `${diagnostic.confidence}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-white/70">{diagnostic.confidence}%</span>
                  </div>
                </div>
                <p className="text-sm text-white/80">{diagnostic.message}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t border-white/10">
            <Button
              onClick={() => {
                setShowResults(false)
                setScanInput({ type: "stock_name", value: "" })
                setSelectedFile(null)
              }}
              variant="outline"
              className="border-white/20 text-white hover:bg-white/5"
            >
              Clear & New Scan
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}
