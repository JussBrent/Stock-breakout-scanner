export default function Footer() {
  const links = {
    product: ["Features", "AI Scanning", "Custom Scans", "Focus Lists"],
    company: ["About", "Blog", "Careers", "Press Kit"],
    resources: ["Docs", "API", "Support", "Community"],
    legal: ["Terms", "Privacy", "Security", "Cookie Policy"],
  }

  return (
    <footer className="border-t border-zinc-800 bg-black">
      <div className="mx-auto max-w-7xl px-6 py-16 sm:px-8 lg:py-20">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-5 lg:gap-8">
          {/* Brand column */}
          <div className="lg:col-span-2">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-black">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                >
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-serif text-lg font-semibold tracking-tight text-white">StockBreakout</span>
                <span className="text-[10px] uppercase tracking-widest text-gray-500">Scanner</span>
              </div>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-gray-400">
              Professional-grade breakout scanning powered by AI. Built for traders who demand precision and speed.
            </p>
          </div>

          {/* Link columns */}
          <div>
            <h4 className="mb-5 text-sm font-semibold uppercase tracking-wider text-white">Product</h4>
            <ul className="space-y-3">
              {links.product.map((link, index) => (
                <li key={index} className="text-sm text-gray-400">
                  {link}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-5 text-sm font-semibold uppercase tracking-wider text-white">Resources</h4>
            <ul className="space-y-3">
              {links.resources.map((link, index) => (
                <li key={index} className="text-sm text-gray-400">
                  {link}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-5 text-sm font-semibold uppercase tracking-wider text-white">Legal</h4>
            <ul className="space-y-3">
              {links.legal.map((link, index) => (
                <li key={index} className="text-sm text-gray-400">
                  {link}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-16 border-t border-zinc-800 pt-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-sm text-gray-500">© 2025 StockBreakout Scanner. All rights reserved.</p>
            <p className="text-xs text-gray-600">Built with precision for professional traders</p>
          </div>
        </div>
      </div>
    </footer>
  )
}
