import { useLocation } from "react-router-dom"

interface SuggestedPrompt {
  label: string
  text: string
}

const ROUTE_PROMPTS: Record<string, SuggestedPrompt[]> = {
  "/scanner": [
    { label: "Top setup today?", text: "What's the strongest breakout setup in today's scan results?" },
    { label: "Best risk/reward?", text: "Which scanned stock has the best risk/reward ratio right now?" },
    { label: "Volume spike?", text: "Are there any unusual volume spikes in today's scanned stocks?" },
    { label: "Avoid any?", text: "Which stocks from today's scan should I avoid and why?" },
  ],
  "/focus-list": [
    { label: "Cut any positions?", text: "Based on current technicals, should I cut any positions on my focus list?" },
    { label: "Best entry now?", text: "Which stock on my focus list has the best entry point right now?" },
    { label: "Stop levels?", text: "Where should I set stop losses for my focus list stocks?" },
    { label: "Add anything?", text: "What stocks should I consider adding to my focus list this week?" },
  ],
  "/admin": [
    { label: "Market overview?", text: "Give me a quick market overview — what's the overall tone today?" },
    { label: "Sector strength?", text: "Which sectors are showing the most strength right now?" },
    { label: "Trade idea?", text: "What's your best trade idea for today?" },
  ],
  "/dashboard": [
    { label: "Market overview?", text: "Give me a quick market overview — what's the overall tone today?" },
    { label: "Sector strength?", text: "Which sectors are showing the most strength right now?" },
    { label: "Trade idea?", text: "What's your best trade idea for today?" },
  ],
  "/portfolio": [
    { label: "Portfolio review?", text: "Can you review my portfolio and flag any concerns?" },
    { label: "Weakest position?", text: "Which position in my portfolio is the weakest technically?" },
    { label: "Size up any?", text: "Should I add to any of my current positions?" },
  ],
  "/analytics": [
    { label: "Win rate tips?", text: "How can I improve my win rate based on common breakout patterns?" },
    { label: "Best setups?", text: "What setup types have the highest success rate historically?" },
    { label: "Risk too high?", text: "Am I taking on too much risk per trade? What's optimal position sizing?" },
  ],
  "/stock-momentum": [
    { label: "Top gainer?", text: "What's driving today's top momentum stock?" },
    { label: "Momentum fading?", text: "Which momentum stocks look like they're running out of steam?" },
    { label: "Chase or wait?", text: "Should I chase momentum here or wait for a pullback?" },
  ],
  "/settings": [
    { label: "Setup tips?", text: "What scanner settings do you recommend for finding high-quality breakouts?" },
  ],
}

const DEFAULT_PROMPTS: SuggestedPrompt[] = [
  { label: "Market today?", text: "What's the overall market tone today?" },
  { label: "Best setup?", text: "What's the best breakout setup to look for right now?" },
  { label: "Risk mgmt?", text: "Give me a quick reminder on proper risk management for breakout trades." },
]

export function useSuggestedPrompts(): SuggestedPrompt[] {
  const location = useLocation()

  for (const [path, prompts] of Object.entries(ROUTE_PROMPTS)) {
    if (location.pathname.startsWith(path)) return prompts
  }

  return DEFAULT_PROMPTS
}
