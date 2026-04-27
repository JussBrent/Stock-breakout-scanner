import { Routes, Route, useLocation } from "react-router-dom"
import React, { Suspense } from "react"
import Navbar from "@/components/landing/Navbar"
import { SeanPopup } from "@/components/dashboard/SeanPopup"
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
const PortfolioPageLazy = React.lazy(() => import("@/pages/PortfolioPage"))
const AiTrainingPageLazy = React.lazy(() => import("@/pages/AiTrainingPage"))
const ContactPageLazy = React.lazy(() => import("@/pages/ContactPage"))

function AppContent() {
  const location = useLocation()

  const isAuthPage = location.pathname === "/login" || location.pathname === "/signup" || location.pathname === "/contact"
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
    "/portfolio",
    "/ai-training",
    "/demo",
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
        <Route path="/portfolio" element={<ProtectedRoute><Suspense fallback={<div className="p-6">Loading…</div>}><PortfolioPageLazy /></Suspense></ProtectedRoute>} />
        <Route path="/ai-training" element={<ProtectedRoute><Suspense fallback={<div className="p-6">Loading…</div>}><AiTrainingPageLazy /></Suspense></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Suspense fallback={<div className="p-6">Loading…</div>}><SettingsPageLazy /></Suspense></ProtectedRoute>} />
        <Route path="/contact" element={<Suspense fallback={<div className="p-6">Loading…</div>}><ContactPageLazy /></Suspense>} />
      </Routes>

      {/* Sean AI popup on all app shell pages except /ai-insights (full page there) */}
      {isAppShellPage && !location.pathname.startsWith("/ai-insights") && <SeanPopup />}

      {/* Footer only on the main marketing page */}
      {!isAuthPage && !isDemoPage && !isAppShellPage && <Footer />}
    </div>
  )
}

export default AppContent
