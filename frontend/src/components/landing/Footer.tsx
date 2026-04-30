import { Link } from "react-router-dom"

export default function Footer() {
  return (
    <footer className="relative bg-black border-t border-[#222]">
      {/* Mission Statement */}
      <div className="border-b border-[#222]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-16 sm:py-24">
          {/* Decorative Elements */}
          <div className="flex items-center gap-4 mb-8 font-mono text-xs text-white/30">
            <span>STRATEGY_SYNC: <span className="text-[#00ff88]">100%</span></span>
            <div className="h-px flex-1 bg-[#222]" />
            <span>COORD: 40.7128° N, 74.0060° W</span>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight max-w-4xl">
            Orbis aims to bridge the gap between retail trading and{" "}
            <span className="text-[#00ff88]">institutional-grade quantitative analysis.</span>
          </h2>

          {/* Feature Cards */}
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {[
              {
                title: "Research",
                description: "Access 30+ years of institutional-grade history, real-time SEC filings, and alternative data feeds used by global funds.",
              },
              {
                title: "Strategy Building",
                description: "Transform natural language into institutional-grade models. Validate your edge with high-fidelity backtests across decades of market history.",
              },
              {
                title: "Live Execution",
                description: "Deploy strategies with direct access and receive instant, high-fidelity alerts as your models detect patterns across the global tape.",
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="border border-[#222] bg-[#0a0a0a] p-6 hover:border-[#00ff88]/30 transition-all"
              >
                <h3 className="font-mono text-sm font-bold text-white mb-3">
                  {feature.title}
                </h3>
                <p className="font-mono text-xs text-white/60 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-12 flex flex-col sm:flex-row items-center gap-4">
            <button className="border border-[#00ff88] bg-[#00ff88] px-8 py-4 font-mono text-sm font-bold uppercase tracking-wider text-black transition-all hover:bg-transparent hover:text-[#00ff88]">
              Get Started
            </button>
            <p className="font-mono text-xs text-white/40">
              Institutional quant infrastructure, redesigned for independent traders and investors.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center border border-[#00ff88] bg-[#00ff88]">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4 text-black"
              >
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </div>
            <span className="font-mono text-sm font-bold text-white uppercase">
              Orbis
            </span>
          </div>

          {/* Links */}
          <div className="flex flex-wrap items-center justify-center gap-6 font-mono text-xs text-white/40">
            <div className="flex items-center gap-4">
              <span className="text-white/20">Resources</span>
              <a href="#" className="hover:text-[#00ff88] transition-colors">Documentation</a>
              <a href="#" className="hover:text-[#00ff88] transition-colors">Help Center</a>
              <Link to="/contact" className="hover:text-[#00ff88] transition-colors">Contact</Link>
            </div>
            <div className="h-4 w-px bg-[#222] hidden md:block" />
            <div className="flex items-center gap-4">
              <span className="text-white/20">Legal</span>
              <a href="#" className="hover:text-[#00ff88] transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-[#00ff88] transition-colors">Terms of Service</a>
            </div>
          </div>

          {/* Copyright */}
          <p className="font-mono text-xs text-white/30">
            © 2026 Orbis. All rights reserved.
          </p>
        </div>
      </div>

      {/* Scan Line Effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute w-full h-px bg-[#00ff88]/10"
          style={{
            animation: "scanLine 8s linear infinite",
          }}
        />
      </div>

      <style>{`
        @keyframes scanLine {
          0% { top: -10%; }
          100% { top: 110%; }
        }
      `}</style>
    </footer>
  )
}
