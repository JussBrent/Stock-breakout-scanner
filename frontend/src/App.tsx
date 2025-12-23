import { Routes, Route, useLocation } from "react-router-dom"
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
      </Routes>

      {/* Footer only on the main marketing page */}
      {!isAuthPage && !isDemoPage && <Footer />}
    </div>
  )
}

export default function App() {
  // ❌ no BrowserRouter here
  return <AppContent />
}
