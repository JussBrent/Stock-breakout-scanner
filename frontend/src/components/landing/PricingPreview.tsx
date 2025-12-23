import React from "react"
import { PricingSection, type PricingPlan } from "./PricingSection"

const plans: PricingPlan[] = [
  {
    name: "Starter",
    price: "39",
    yearlyPrice: "29",
    period: "month",
    description: "Perfect for new traders testing the scanner.",
    buttonText: "Get Started",
    href: "#",
    features: [
      "Daily 8 EMA breakout scans",
      "Up to 100 stocks in Focus List",
      "Email summaries after close",
    ],
  },
  {
    name: "Pro",
    price: "79",
    yearlyPrice: "59",
    period: "month",
    description: "For serious traders who want full coverage.",
    buttonText: "Upgrade to Pro",
    href: "#",
    isPopular: true,
    features: [
      "Full U.S. market scan",
      "AI strength scoring on every setup",
      "Unlimited Focus List capacity",
      "Priority email + chat support",
    ],
  },
  {
    name: "Elite",
    price: "149",
    yearlyPrice: "119",
    period: "month",
    description: "For trading teams and power users.",
    buttonText: "Contact Sales",
    href: "#",
    features: [
      "Team seats & permissions",
      "Custom indicators & filters",
      "API access (coming soon)",
      "Dedicated onboarding call",
    ],
  },
]

export default function PricingPreview() {
  return (
    <PricingSection
      plans={plans}
      title="Scale your trading edge"
      description={
        "Whether you're just getting started or running a serious operation,\nStockBreakout Scanner grows with your workflow."
      }
    />
  )
}
