'use client'

import { Button } from '@/components/ui/button'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Menu, X, User, Settings, LogOut } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, signOut } = useAuth()

  const isLoginPage = location.pathname === '/login'
  const useSolidNav = scrolled || isLoginPage

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  const dropdownData = {
    features: {
      sections: [
        {
          title: 'CORE FEATURES',
          items: [
            { label: 'Real-Time Scanning', desc: 'Monitor breakouts as they happen' },
            { label: 'AI Pattern Detection', desc: 'Machine learning identifies setups' },
            { label: 'Multi-Timeframe Analysis', desc: 'From 1-min to daily charts' },
            { label: 'Custom Alerts', desc: 'Get notified instantly' }
          ]
        },
        {
          title: 'ADVANCED TOOLS',
          items: [
            { label: 'Volume Profile', desc: 'Institutional activity tracking' },
            { label: 'Heat Maps', desc: 'Sector and market visualization' },
            { label: 'Backtesting Engine', desc: 'Test strategies on historical data' }
          ]
        }
      ]
    },
    scanning: {
      sections: [
        {
          title: 'AI CAPABILITIES',
          items: [
            { label: 'Smart Screeners', desc: 'AI-powered stock filters' },
            { label: 'Pattern Recognition', desc: 'Identify breakout patterns' },
            { label: 'Sentiment Analysis', desc: 'Market mood tracking' }
          ]
        }
      ]
    }
  }

  return (
    <header
      className={`fixed top-0 z-50 w-full transition-all duration-500 font-(--font-inter) ${
        useSolidNav
          ? 'bg-black/95 backdrop-blur-xl border-b border-white/10'
          : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 sm:px-8">
        {/* Logo */}
        <Link to="/">
          <motion.div
            className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-black">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
              >
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </div>

            <span className="font-serif text-xl font-bold tracking-tight text-white">
              Stock Breakout
            </span>
          </motion.div>
        </Link>

        {/* Nav Links */}
        <nav className="hidden items-center gap-8 text-sm md:flex">
          {/* FEATURES DROPDOWN */}
          <div
            className="relative"
            onMouseEnter={() => setOpenDropdown('features')}
            onMouseLeave={() => setOpenDropdown(null)}
          >
            <motion.button
              className="flex items-center gap-1 text-white/70 transition-colors hover:text-white"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              Features
              <ChevronDown className="h-3.5 w-3.5" />
            </motion.button>

            <AnimatePresence>
              {openDropdown === 'features' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute left-0 top-full pt-4"
                >
                  <div className="min-w-[600px] rounded-2xl border border-white/10 bg-black/95 p-8 shadow-2xl backdrop-blur-xl">
                    <div className="grid grid-cols-2 gap-8">
                      {dropdownData.features.sections.map((section, sectionIdx) => (
                        <div key={section.title}>
                          <h3 className="mb-4 text-xs font-medium tracking-widest text-white/40">
                            {section.title}
                          </h3>

                          <div className="space-y-3">
                            {section.items.map((item, itemIdx) => (
                              <motion.button
                                key={item.label}
                                onClick={() => {
                                  const section = document.getElementById('features')
                                  section?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                                  setOpenDropdown(null)
                                }}
                                className="block w-full text-left rounded-lg p-3 transition-colors hover:bg-white/5"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{
                                  duration: 0.3,
                                  delay:
                                    (sectionIdx * section.items.length + itemIdx) * 0.05
                                }}
                              >
                                <div className="font-medium text-white">{item.label}</div>
                                <div className="text-xs text-white/50">{item.desc}</div>
                              </motion.button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* AI SCANNING DROPDOWN */}
          <div
            className="relative"
            onMouseEnter={() => setOpenDropdown('scanning')}
            onMouseLeave={() => setOpenDropdown(null)}
          >
            <motion.button
              className="flex items-center gap-1 text-white/70 transition-colors hover:text-white"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              AI Scanning
              <ChevronDown className="h-3.5 w-3.5" />
            </motion.button>

            <AnimatePresence>
              {openDropdown === 'scanning' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute left-0 top-full pt-4"
                >
                  <div className="min-w-[300px] rounded-2xl border border-white/10 bg-black/95 p-8 shadow-2xl backdrop-blur-xl">
                    {dropdownData.scanning.sections.map((section) => (
                      <div key={section.title}>
                        <h3 className="mb-4 text-xs font-medium tracking-widest text-white/40">
                          {section.title}
                        </h3>

                        <div className="space-y-3">
                          {section.items.map((item, idx) => (
                            <motion.button
                              key={item.label}
                              onClick={() => {
                                const section = document.getElementById('features')
                                section?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                                setOpenDropdown(null)
                              }}
                              className="block w-full text-left rounded-lg p-3 transition-colors hover:bg-white/5"
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.3, delay: idx * 0.05 }}
                            >
                              <div className="font-medium text-white">{item.label}</div>
                              <div className="text-xs text-white/50">{item.desc}</div>
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* NORMAL LINKS */}
          <motion.button
            onClick={() => {
              const section = document.getElementById('split')
              section?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }}
            className="text-white/70 transition-colors hover:text-white"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            Pro + Cons
          </motion.button>

          <motion.button
            onClick={() => {
              const section = document.getElementById('faq')
              section?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }}
            className="text-white/70 transition-colors hover:text-white"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            FAQ
          </motion.button>

          <motion.button
            onClick={() => {
              const section = document.getElementById('pricing')
              section?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }}
            className="text-white/70 transition-colors hover:text-white"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            Pricing
          </motion.button>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <Link
              to="/dashboard"
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-white/80 transition-colors hover:border-white/30 hover:text-white"
            >
              Dashboard
            </Link>
          </motion.div>
        </nav>

        {/* AUTH BUTTONS / USER MENU */}
        <motion.div
          className="hidden md:flex items-center gap-3"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {user ? (
            // Logged in state - show user menu
            <div
              className="relative"
              onMouseEnter={() => setOpenDropdown('user')}
              onMouseLeave={() => setOpenDropdown(null)}
            >
              <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 hover:border-white/30 transition-colors">
                <div className="h-6 w-6 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center">
                  <User className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="text-sm text-white/90">{user.user_metadata?.full_name || user.email}</span>
                <ChevronDown className="h-3.5 w-3.5 text-white/60" />
              </button>

              <AnimatePresence>
                {openDropdown === 'user' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 top-full pt-4"
                  >
                    <div className="min-w-[200px] rounded-xl border border-white/10 bg-black/95 p-2 shadow-2xl backdrop-blur-xl">
                      <Link
                        to="/settings"
                        className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                        onClick={() => setOpenDropdown(null)}
                      >
                        <Settings className="h-4 w-4" />
                        Settings
                      </Link>
                      <button
                        onClick={() => {
                          handleLogout()
                          setOpenDropdown(null)
                        }}
                        className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors w-full text-left"
                      >
                        <LogOut className="h-4 w-4" />
                        Log Out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            // Not logged in - show login buttons
            <>
              <Link
                to="/login"
                className="text-sm text-white/70 transition-colors hover:text-white"
              >
                Log in
              </Link>

              <Button
                size="sm"
                className="rounded-full bg-white px-6 font-medium text-black shadow-lg hover:bg-white/90"
                asChild
              >
                <Link to="/login">Get Started</Link>
              </Button>
            </>
          )}
        </motion.div>

        {/* MOBILE MENU BUTTON */}
        <motion.button
          className="md:hidden text-white p-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </motion.button>
      </div>

      {/* MOBILE MENU */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden border-t border-white/10 bg-black/95 backdrop-blur-xl"
          >
            <nav className="px-6 py-6 space-y-4">
              <button
                onClick={() => {
                  const section = document.getElementById('features')
                  section?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  setMobileMenuOpen(false)
                }}
                className="block w-full text-left text-white/70 hover:text-white transition-colors py-2"
              >
                Features
              </button>
              
              <button
                onClick={() => {
                  const section = document.getElementById('features')
                  section?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  setMobileMenuOpen(false)
                }}
                className="block w-full text-left text-white/70 hover:text-white transition-colors py-2"
              >
                AI Scanning
              </button>
              
              <button
                onClick={() => {
                  const section = document.getElementById('split')
                  section?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  setMobileMenuOpen(false)
                }}
                className="block w-full text-left text-white/70 hover:text-white transition-colors py-2"
              >
                Pro + Cons
              </button>
              
              <button
                onClick={() => {
                  const section = document.getElementById('faq')
                  section?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  setMobileMenuOpen(false)
                }}
                className="block w-full text-left text-white/70 hover:text-white transition-colors py-2"
              >
                FAQ
              </button>
              
              <button
                onClick={() => {
                  const section = document.getElementById('pricing')
                  section?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  setMobileMenuOpen(false)
                }}
                className="block w-full text-left text-white/70 hover:text-white transition-colors py-2"
              >
                Pricing
              </button>

              <Link
                to="/dashboard"
                className="block w-full text-left text-white/70 hover:text-white transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Dashboard
              </Link>

              <div className="pt-4 border-t border-white/10 space-y-3">
                {user ? (
                  // Logged in state
                  <>
                    <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg border border-white/10">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center">
                        <User className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-white/40">Logged in as</p>
                        <p className="text-sm text-white/90 truncate">{user.user_metadata?.full_name || user.email}</p>
                      </div>
                    </div>
                    <Link
                      to="/settings"
                      className="flex items-center justify-center gap-2 w-full text-center text-white/70 hover:text-white transition-colors py-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Settings className="h-4 w-4" />
                      Settings
                    </Link>
                    <Button
                      onClick={() => {
                        handleLogout()
                        setMobileMenuOpen(false)
                      }}
                      className="w-full rounded-full bg-white/10 border border-white/10 font-medium text-white shadow-lg hover:bg-white/20"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Log Out
                    </Button>
                  </>
                ) : (
                  // Not logged in
                  <>
                    <Link
                      to="/login"
                      className="block text-center text-white/70 hover:text-white transition-colors py-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Log in
                    </Link>

                    <Button
                      className="w-full rounded-full bg-white font-medium text-black shadow-lg hover:bg-white/90"
                      asChild
                    >
                      <Link to="/login">Get Started</Link>
                    </Button>
                  </>
                )}
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
