import { Routes, Route, useLocation } from "react-router-dom"
import React, { Suspense } from "react"
import Navbar from "@/components/landing/Navbar"
import Hero from "@/components/landing/Hero"
import FeatureCards from "@/components/landing/FeatureCards"
import SplitSection from "@/components/landing/SplitSection"
import FAQSection from "@/components/landing/faq-section"
import PricingPreview from "@/components/landing/PricingPreview"
import Footer from "@/components/landing/Footer"
import { ProtectedRoute } from "@/components/auth/ProtectedRoute"

// Pages
import Login from "@/pages/login"
import Signup from "@/pages/signup"
import Demo from "@/pages/DemoScanPage"
const AdminDashboardPageLazy = React.lazy(() => import("@/pages/AdminDashboardPage"))
const SettingsPageLazy = React.lazy(() => import("@/pages/SettingsPage"))
const ScannerPageLazy = React.lazy(() => import("@/pages/ScannerPage"))
const AiInsightsPageLazy = React.lazy(() => import("@/pages/AiInsightsPage"))
const FocusListPageLazy = React.lazy(() => import("@/pages/FocusListPage"))
const AnalyticsPageLazy = React.lazy(() => import("@/pages/AnalyticsPage"))
const StockMomentumPageLazy = React.lazy(() => import("@/pages/StockMomentumPage"))

function AppContent() {
  const location = useLocation()

  const isAuthPage = location.pathname === "/login" || location.pathname === "/signup"
  const isDemoPage = location.pathname === "/demo"
  const isAppShellPage = [
    "/admin",
    "/dashboard",
    "/ai-insights",
    "/scanner",
    "/stock-momentum",
    "/analytics",
    "/focus-list",
    "/settings",
  ].some((path) => location.pathname.startsWith(path))

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Marketing navbar only on landing/marketing pages */}
      {!isAuthPage && !isAppShellPage && <Navbar />}

      <Routes>
        <Route
          path="/"
          element={
            <>
              <Hero />
              <FeatureCards />
              <SplitSection />
              <FAQSection />
              <PricingPreview />
            </>
          }
        />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/demo" element={<Demo />} />
        <Route path="/dashboard" element={<ProtectedRoute><Suspense fallback={<div className="p-6">Loading…</div>}><AdminDashboardPageLazy /></Suspense></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><Suspense fallback={<div className="p-6">Loading…</div>}><AdminDashboardPageLazy /></Suspense></ProtectedRoute>} />
        <Route path="/ai-insights" element={<ProtectedRoute><Suspense fallback={<div className="p-6">Loading…</div>}><AiInsightsPageLazy /></Suspense></ProtectedRoute>} />
        <Route path="/scanner" element={<ProtectedRoute><Suspense fallback={<div className="p-6">Loading…</div>}><ScannerPageLazy /></Suspense></ProtectedRoute>} />
        <Route path="/stock-momentum" element={<ProtectedRoute><Suspense fallback={<div className="p-6">Loading…</div>}><StockMomentumPageLazy /></Suspense></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute><Suspense fallback={<div className="p-6">Loading…</div>}><AnalyticsPageLazy /></Suspense></ProtectedRoute>} />
        <Route path="/focus-list" element={<ProtectedRoute><Suspense fallback={<div className="p-6">Loading…</div>}><FocusListPageLazy /></Suspense></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Suspense fallback={<div className="p-6">Loading…</div>}><SettingsPageLazy /></Suspense></ProtectedRoute>} />
      </Routes>

      {/* Footer only on the main marketing page */}
      {!isAuthPage && !isDemoPage && !isAppShellPage && <Footer />}
    </div>
  )
}

export default AppContent
