import { useEffect, useState } from "react"
import { CheckCircle, XCircle } from "lucide-react"

export default function SnapTradeCallbackPage() {
  const [status, setStatus] = useState<"success" | "error">("success")

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const hasError = params.get("error") || params.get("status") === "error"
    if (hasError) {
      setStatus("error")
    }

    // Notify the parent window regardless of status so it can refresh
    try {
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage(
          { type: "SNAPTRADE_CONNECTED", status: hasError ? "error" : "success" },
          window.location.origin
        )
      }
    } catch {
      // opener may be cross-origin in some edge cases; ignore
    }

    // Auto-close after a short delay so the user sees the confirmation
    const t = setTimeout(() => window.close(), 2000)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="text-center space-y-4 px-6">
        {status === "success" ? (
          <>
            <CheckCircle className="h-14 w-14 text-emerald-400 mx-auto" />
            <h1 className="text-xl font-semibold text-white">Brokerage Connected!</h1>
            <p className="text-white/50 text-sm">Your account has been linked. This window will close automatically.</p>
          </>
        ) : (
          <>
            <XCircle className="h-14 w-14 text-red-400 mx-auto" />
            <h1 className="text-xl font-semibold text-white">Connection Failed</h1>
            <p className="text-white/50 text-sm">Something went wrong. Please try again.</p>
          </>
        )}
        <button
          onClick={() => window.close()}
          className="mt-2 px-4 py-2 bg-white/10 hover:bg-white/15 text-white text-sm rounded-lg transition-colors"
        >
          Close Window
        </button>
      </div>
    </div>
  )
}
