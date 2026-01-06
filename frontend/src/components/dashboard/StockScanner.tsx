"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { mockScanResults } from "@/lib/mock-data"
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
  Sparkles,
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
        return "bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/15"
      case "negative":
        return "bg-red-500/10 border-red-500/30 hover:bg-red-500/15"
      case "warning":
        return "bg-yellow-500/10 border-yellow-500/30 hover:bg-yellow-500/15"
      default:
        return "bg-blue-500/10 border-blue-500/30 hover:bg-blue-500/15"
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Card className="relative overflow-hidden bg-gradient-to-br from-white/[0.07] to-white/[0.02] border-white/10 backdrop-blur-xl shadow-2xl">
        {/* Decorative gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-emerald-500/5 pointer-events-none" />

        <div className="relative p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-xl" />
                <div className="relative p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white tracking-tight">AI Stock Scanner</h3>
                <p className="text-sm text-white/50 mt-0.5">Multi-modal analysis powered by advanced AI</p>
              </div>
            </div>
            <Badge variant="outline" className="bg-primary/10 border-primary/30 text-primary px-3 py-1.5">
              <Zap className="h-3.5 w-3.5 mr-1.5" />
              Real-time Analysis
            </Badge>
          </div>

          <div className="flex gap-1 mb-8 p-1 bg-white/5 rounded-xl border border-white/10">
            <button
              onClick={() => {
                setScanInput({ type: "stock_name", value: "" })
                setSelectedFile(null)
              }}
              className={cn(
                "flex-1 px-5 py-3 text-sm font-medium rounded-lg transition-all duration-200",
                scanInput.type === "stock_name"
                  ? "bg-white/10 text-white shadow-lg ring-1 ring-white/20"
                  : "text-white/60 hover:text-white hover:bg-white/5",
              )}
            >
              <Search className="h-4 w-4 inline-block mr-2 -mt-0.5" />
              Stock Symbol
            </button>
            <button
              onClick={() => {
                setScanInput({ type: "screenshot", value: "" })
                setSelectedFile(null)
              }}
              className={cn(
                "flex-1 px-5 py-3 text-sm font-medium rounded-lg transition-all duration-200",
                scanInput.type === "screenshot"
                  ? "bg-white/10 text-white shadow-lg ring-1 ring-white/20"
                  : "text-white/60 hover:text-white hover:bg-white/5",
              )}
            >
              <Upload className="h-4 w-4 inline-block mr-2 -mt-0.5" />
              Chart Image
            </button>
            <button
              onClick={() => {
                setScanInput({ type: "content", value: "" })
                setSelectedFile(null)
              }}
              className={cn(
                "flex-1 px-5 py-3 text-sm font-medium rounded-lg transition-all duration-200",
                scanInput.type === "content"
                  ? "bg-white/10 text-white shadow-lg ring-1 ring-white/20"
                  : "text-white/60 hover:text-white hover:bg-white/5",
              )}
            >
              <BarChart3 className="h-4 w-4 inline-block mr-2 -mt-0.5" />
              News Content
            </button>
          </div>

          <div className="space-y-5">
            {scanInput.type === "stock_name" && (
              <div className="space-y-3">
                <label className="text-sm font-semibold text-white/90 tracking-wide uppercase text-xs">
                  Stock Symbol or Company Name
                </label>
                <Input
                  placeholder="Enter ticker (e.g., AAPL, TSLA, NVDA) or company name..."
                  value={scanInput.value}
                  onChange={(e) => setScanInput({ type: "stock_name", value: e.target.value })}
                  onKeyPress={(e) => e.key === "Enter" && handleScan()}
                  className="h-14 bg-white/5 border-white/10 text-white text-lg placeholder:text-white/40 focus:bg-white/[0.07] focus:border-primary/50 transition-all"
                />
                <div className="flex items-center gap-2 text-xs text-white/50">
                  <div className="h-1 w-1 rounded-full bg-primary/50" />
                  <span>AI will analyze fundamentals, technicals, and market sentiment</span>
                </div>
              </div>
            )}

            {scanInput.type === "screenshot" && (
              <div className="space-y-4">
                <label className="text-sm font-semibold text-white/90 tracking-wide uppercase text-xs">
                  Upload Chart or Screenshot
                </label>
                <div className="relative group">
                  <div className="border-2 border-dashed border-white/20 rounded-2xl p-12 text-center hover:border-primary/50 hover:bg-white/5 transition-all cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <div className="relative inline-block mb-4">
                      <div className="absolute inset-0 bg-primary/20 rounded-xl blur-xl" />
                      <div className="relative p-4 bg-white/5 rounded-xl border border-white/10">
                        <Upload className="h-8 w-8 text-white/70" />
                      </div>
                    </div>
                    <p className="text-white font-medium mb-2">Drop your chart here or click to browse</p>
                    <p className="text-xs text-white/50">
                      Supports PNG, JPG, GIF up to 10MB. AI will detect patterns, support/resistance, and trends.
                    </p>
                  </div>
                </div>

                {selectedFile && (
                  <div className="flex items-center gap-4 p-4 bg-white/10 rounded-xl border border-white/20 backdrop-blur-sm">
                    <div className="flex-shrink-0 p-3 bg-primary/10 rounded-lg">
                      <BarChart3 className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{selectedFile.name}</p>
                      <p className="text-xs text-white/50 mt-0.5">
                        {(selectedFile.size / 1024).toFixed(1)} KB • Ready for analysis
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedFile(null)
                        setScanInput({ type: "screenshot", value: "" })
                      }}
                      className="flex-shrink-0 p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <X className="h-5 w-5 text-white/60" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {scanInput.type === "content" && (
              <div className="space-y-3">
                <label className="text-sm font-semibold text-white/90 tracking-wide uppercase text-xs">
                  Stock Information & Analysis
                </label>
                <textarea
                  placeholder="Paste news articles, earnings reports, analyst opinions, market commentary, or any text content related to the stock..."
                  value={scanInput.value}
                  onChange={(e) => setScanInput({ type: "content", value: e.target.value })}
                  className="w-full h-40 bg-white/5 border border-white/10 text-white placeholder:text-white/40 rounded-xl p-4 resize-none focus:bg-white/[0.07] focus:border-primary/50 transition-all leading-relaxed"
                />
                <div className="flex items-center gap-2 text-xs text-white/50">
                  <div className="h-1 w-1 rounded-full bg-primary/50" />
                  <span>Natural language processing will extract key insights and sentiment</span>
                </div>
              </div>
            )}

            <Button
              onClick={handleScan}
              disabled={isScanning || (!scanInput.value.trim() && !selectedFile)}
              size="lg"
              className="w-full h-14 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white font-semibold text-base shadow-lg shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isScanning ? (
                <>
                  <Loader className="mr-2.5 h-5 w-5 animate-spin" />
                  Analyzing with AI...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2.5 h-5 w-5" />
                  Start AI Analysis
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>

      {showResults && (
        <Card className="relative overflow-hidden bg-gradient-to-br from-white/[0.07] to-white/[0.02] border-white/10 backdrop-blur-xl shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-500">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-primary/5 pointer-events-none" />

          <div className="relative p-8">
            <div className="flex items-start justify-between mb-8">
              <div className="space-y-1">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  <h3 className="text-2xl font-bold text-white">Analysis Complete</h3>
                </div>
                <p className="text-white/60">
                  {scanResults.inputType === "stock_name"
                    ? `${scanResults.input} • Comprehensive AI Assessment`
                    : scanResults.inputType === "screenshot"
                      ? "Chart Pattern Analysis Results"
                      : "Content Sentiment & Key Insights"}
                </p>
              </div>
              <div className="text-right">
                <div className="relative inline-block">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-emerald-400/30 rounded-2xl blur-xl" />
                  <div className="relative px-6 py-4 bg-gradient-to-br from-white/10 to-white/5 rounded-2xl border border-white/20">
                    <div className="text-4xl font-bold bg-gradient-to-r from-primary via-emerald-400 to-primary bg-clip-text text-transparent">
                      {scanResults.overallScore}
                    </div>
                    <p className="text-xs font-medium text-white/70 mt-1 tracking-wide">CONFIDENCE</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl mb-8">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
              <span className="font-semibold text-emerald-400">{scanResults.recommendation}</span>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-bold text-white/90 tracking-wide uppercase">Detailed Diagnostics</h4>
                <span className="text-xs text-white/50">{scanResults.diagnostics.length} factors analyzed</span>
              </div>

              <div className="grid gap-3">
                {scanResults.diagnostics.map((diagnostic, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "border rounded-xl p-5 space-y-3 transition-all duration-200",
                      getStatusColor(diagnostic.status),
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="flex-shrink-0">{getStatusIcon(diagnostic.status)}</div>
                        <div className="flex-1">
                          <h5 className="font-semibold text-white text-base">{diagnostic.category}</h5>
                          <p className="text-sm text-white/70 mt-1 leading-relaxed">{diagnostic.message}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <span className="text-sm font-bold text-white">{diagnostic.confidence}%</span>
                        <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all duration-500",
                              diagnostic.status === "positive" && "bg-gradient-to-r from-emerald-500 to-emerald-400",
                              diagnostic.status === "negative" && "bg-gradient-to-r from-red-500 to-red-400",
                              diagnostic.status === "warning" && "bg-gradient-to-r from-yellow-500 to-yellow-400",
                              !["positive", "negative", "warning"].includes(diagnostic.status) &&
                                "bg-gradient-to-r from-blue-500 to-blue-400",
                            )}
                            style={{ width: `${diagnostic.confidence}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between mt-8 pt-8 border-t border-white/10">
              <p className="text-sm text-white/50">
                Analysis generated by AI • Results may vary based on market conditions
              </p>
              <Button
                onClick={() => {
                  setShowResults(false)
                  setScanInput({ type: "stock_name", value: "" })
                  setSelectedFile(null)
                }}
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10 hover:border-white/30 transition-all"
              >
                <X className="mr-2 h-4 w-4" />
                New Scan
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
