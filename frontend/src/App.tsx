import { Routes, Route, useLocation } from "react-router-dom"
import React, { Suspense } from "react"
import Navbar from "@/components/landing/Navbar"
import Hero from "@/components/landing/Hero"
import FeatureCards from "@/components/landing/FeatureCards"
import SplitSection from "@/components/landing/SplitSection"
import FAQSection from "@/components/landing/faq-section"
import PricingPreview from "@/components/landing/PricingPreview"
import Footer from "@/components/landing/Footer"

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

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Global navbar: hide only on full-screen auth (login) */}
      {!isAuthPage && <Navbar />}

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
        <Route path="/dashboard" element={<Suspense fallback={<div className="p-6">Loading…</div>}><AdminDashboardPageLazy /></Suspense>} />
        <Route path="/admin" element={<Suspense fallback={<div className="p-6">Loading…</div>}><AdminDashboardPageLazy /></Suspense>} />
        <Route path="/ai-insights" element={<Suspense fallback={<div className="p-6">Loading…</div>}><AiInsightsPageLazy /></Suspense>} />
        <Route path="/scanner" element={<Suspense fallback={<div className="p-6">Loading…</div>}><ScannerPageLazy /></Suspense>} />
        <Route path="/stock-momentum" element={<Suspense fallback={<div className="p-6">Loading…</div>}><StockMomentumPageLazy /></Suspense>} />
        <Route path="/analytics" element={<Suspense fallback={<div className="p-6">Loading…</div>}><AnalyticsPageLazy /></Suspense>} />
        <Route path="/focus-list" element={<Suspense fallback={<div className="p-6">Loading…</div>}><FocusListPageLazy /></Suspense>} />
        <Route path="/settings" element={<Suspense fallback={<div className="p-6">Loading…</div>}><SettingsPageLazy /></Suspense>} />
      </Routes>

      {/* Footer only on the main marketing page */}
      {!isAuthPage && !isDemoPage && <Footer />}
    </div>
  )
}

export default AppContent
