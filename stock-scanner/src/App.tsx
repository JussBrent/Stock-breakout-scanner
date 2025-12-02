import Navbar from "@/components/landing/Navbar"
import Hero from "@/components/landing/Hero"
import FeatureCards from "@/components/landing/FeatureCards"
import SplitSection from "@/components/landing/SplitSection"
import FAQSection from "@/components/landing/faq-section"
import PricingPreview from "@/components/landing/PricingPreview"
import Footer from "@/components/landing/Footer"

export default function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <Hero />
      <FeatureCards />
      <SplitSection />
      <FAQSection />
      <PricingPreview />
      <Footer />
    </div>
  )
}
