import { useState, useEffect, useRef } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Menu, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "@/hooks/useAuth"

export default function Navbar() {
  const navigate = useNavigate()
  const { user, loading } = useAuth()
  const isSignedIn = !loading && !!user
  const [scrolled, setScrolled] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const lastScrollY = useRef(0)

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      const goingDown = currentScrollY > lastScrollY.current

      setScrolled(currentScrollY > 50)

      if (mobileMenuOpen) {
        setIsVisible(true)
      } else if (currentScrollY <= 20) {
        setIsVisible(true)
      } else if (goingDown) {
        setIsVisible(false)
      } else {
        setIsVisible(true)
      }

      lastScrollY.current = currentScrollY
    }

    lastScrollY.current = window.scrollY
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [mobileMenuOpen])

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    element?.scrollIntoView({ behavior: "smooth" })
    setMobileMenuOpen(false)
  }

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: isVisible ? 0 : -96, opacity: isVisible ? 1 : 0.92 }}
      transition={{
        y: { type: "spring", stiffness: 380, damping: 36, mass: 0.9 },
        opacity: { duration: 0.2 },
      }}
      className={`fixed top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? "bg-black/95 border-b border-[#00ff88]/20 backdrop-blur-sm"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex h-8 w-8 items-center justify-center border border-[#00ff88] bg-[#00ff88]"
          >
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
          </motion.div>
          <span className="font-mono text-sm font-bold tracking-tight text-white uppercase">
            StockBreakout
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-1 font-mono text-xs uppercase tracking-wider md:flex">
          {["features", "comparison", "pricing", "faq"].map((item, i) => (
            <motion.button
              key={item}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i, duration: 0.4 }}
              onClick={() => scrollToSection(item)}
              className="relative px-4 py-2 text-white/60 transition-colors hover:text-[#00ff88] group"
            >
              {item.charAt(0).toUpperCase() + item.slice(1)}
              <span className="absolute bottom-0 left-1/2 w-0 h-px bg-[#00ff88] transition-all group-hover:w-full group-hover:left-0" />
            </motion.button>
          ))}
        </nav>

        {/* Desktop Auth */}
        <div className="hidden items-center gap-3 md:flex">
          {isSignedIn ? (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="flex items-center gap-2 border border-[#00ff88]/40 bg-[#00ff88]/10 px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-[#00ff88]"
                title={user?.email ?? undefined}
                aria-label="You are live"
              >
                <span className="relative flex h-2 w-2" aria-hidden="true">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-[#00ff88] opacity-75 animate-ping" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[#00ff88]" />
                </span>
                Live
              </motion.div>
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate("/admin")}
                className="border border-[#00ff88] bg-[#00ff88] px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-black transition-all hover:bg-transparent hover:text-[#00ff88]"
              >
                Dashboard
              </motion.button>
            </>
          ) : (
            <>
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                onClick={() => navigate("/login")}
                className="font-mono text-xs uppercase tracking-wider text-white/60 transition-colors hover:text-[#00ff88] px-4 py-2"
              >
                Sign In
              </motion.button>
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate("/signup")}
                className="border border-[#00ff88] bg-[#00ff88] px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-black transition-all hover:bg-transparent hover:text-[#00ff88]"
              >
                Create Account
              </motion.button>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          className="md:hidden text-white p-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </motion.button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden border-t border-[#00ff88]/20 bg-black/95 overflow-hidden"
          >
            <nav className="flex flex-col p-4 font-mono text-xs uppercase tracking-wider">
              {["features", "comparison", "pricing", "faq"].map((item, i) => (
                <motion.button
                  key={item}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => scrollToSection(item)}
                  className="py-3 text-left text-white/60 transition-colors hover:text-[#00ff88]"
                >
                  {item.charAt(0).toUpperCase() + item.slice(1)}
                </motion.button>
              ))}
              <div className="mt-4 flex flex-col gap-2 border-t border-[#222] pt-4">
                {isSignedIn ? (
                  <>
                    <div className="flex items-center gap-2 py-2 text-[#00ff88]">
                      <span className="relative flex h-2 w-2" aria-hidden="true">
                        <span className="absolute inline-flex h-full w-full rounded-full bg-[#00ff88] opacity-75 animate-ping" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-[#00ff88]" />
                      </span>
                      <span>Live</span>
                      {user?.email && (
                        <span className="ml-1 truncate normal-case tracking-normal text-white/60">
                          {user.email}
                        </span>
                      )}
                    </div>
                    <Link
                      to="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      className="border border-[#00ff88] bg-[#00ff88] px-4 py-2 font-bold text-black transition-all hover:bg-transparent hover:text-[#00ff88]"
                    >
                      Dashboard
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="py-2 text-left text-white/60 transition-colors hover:text-[#00ff88]"
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/signup"
                      onClick={() => setMobileMenuOpen(false)}
                      className="border border-[#00ff88] bg-[#00ff88] px-4 py-2 font-bold text-black transition-all hover:bg-transparent hover:text-[#00ff88]"
                    >
                      Create Account
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}
