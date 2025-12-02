import Navbar from "@/components/landing/Navbar"
import Hero from "@/components/landing/Hero"
import FeatureCards from "@/components/landing/FeatureCards"
import SplitSection from "@/components/landing/SplitSection"
import FAQSection from "@/components/landing/faq-section"
import PricingPreview from "@/components/landing/PricingPreview"
import Footer from "@/components/landing/Footer"

import { Routes, Route, useLocation } from "react-router-dom"
import Login from "@/pages/login"

export default function App() {
  const location = useLocation()

  // Don't show the main navbar on the login page
  const showNavbar = location.pathname !== "/login"

  return (
    <div className="min-h-screen bg-background text-foreground">
      {showNavbar && <Navbar />}

      {/* no pt-20 so hero sits behind navbar on "/" */}
      <main>
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
                <Footer />
              </>
            }
          />

          {/* Login page has its own layout/nav */}
          <Route path="/login" element={<Login />} />
        </Routes>
      </main>
    </div>
  )
}
