import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"

type CanvasRevealEffectProps = {
  animationSpeed?: number
  containerClassName?: string
  colors?: number[][]
  dotSize?: number
}

export const CanvasRevealEffect = ({
  animationSpeed = 2,
  containerClassName,
  colors = [[0, 255, 136]],
  dotSize = 2,
}: CanvasRevealEffectProps) => {
  const [r, g, b] = colors[0] ?? [0, 255, 136]

  return (
    <motion.div
      initial={{ opacity: 0.2 }}
      animate={{ opacity: [0.2, 0.35, 0.2] }}
      transition={{ duration: Math.max(2, animationSpeed * 2), repeat: Infinity, ease: "easeInOut" }}
      className={`absolute inset-0 ${containerClassName ?? ""}`}
      style={{
        backgroundImage: `
          linear-gradient(to right, rgba(${r}, ${g}, ${b}, 0.18) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(${r}, ${g}, ${b}, 0.18) 1px, transparent 1px)
        `,
        backgroundSize: `${Math.max(12, dotSize * 13)}px ${Math.max(12, dotSize * 13)}px`,
      }}
    />
  )
}

function MiniNavbar() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="fixed top-6 left-1/2 transform -translate-x-1/2 z-20
        flex items-center gap-3
        pl-4 pr-4 py-2
        border border-[#00ff88]/30 bg-black/80 backdrop-blur-sm"
    >
      <div className="w-6 h-6 border border-[#00ff88] flex items-center justify-center">
        <span className="text-[#00ff88] font-mono text-xs font-bold">SB</span>
      </div>
      <span className="text-white font-mono text-sm tracking-wider">STOCKBREAKOUT</span>
    </motion.header>
  )
}

export default function LoginPage() {
  const { signIn, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const redirectTo = (location.state as { from?: string } | null)?.from || "/dashboard"

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)

  React.useEffect(() => {
    if (user) {
      navigate(redirectTo, { replace: true })
    }
  }, [user, navigate, redirectTo])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format"
    }

    if (!formData.password) {
      newErrors.password = "Password is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      setIsLoading(true)
      const { error } = await signIn(formData.email, formData.password)
      setIsLoading(false)

      if (error) {
        setErrors((prev) => ({ ...prev, form: error.message }))
        return
      }

      navigate(redirectTo, { replace: true })
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }))
    }
  }

  return (
    <div className="flex w-full flex-col min-h-screen bg-black relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 z-0">
        <motion.div
          initial={{ opacity: 0.2 }}
          animate={{ opacity: [0.2, 0.35, 0.2] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(0, 255, 136, 0.18) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(0, 255, 136, 0.18) 1px, transparent 1px)
            `,
            backgroundSize: "26px 26px",
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_70%,rgba(0,0,0,1)_100%)]" />
      </div>

      {/* Grid overlay */}
      <div 
        className="absolute inset-0 z-1 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(to right, #00ff88 1px, transparent 1px),
            linear-gradient(to bottom, #00ff88 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px'
        }}
      />

      <div className="relative z-10 flex flex-col flex-1">
        <MiniNavbar />

        {/* Back to Home button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          <Link
            to="/"
            className="fixed top-6 left-6 z-30 group flex items-center gap-2 px-4 py-2 bg-black border border-[#222] hover:border-[#00ff88]/50 text-[#888] hover:text-[#00ff88] transition-all duration-200 font-mono text-sm"
          >
            <svg
              className="w-4 h-4 transition-transform group-hover:-translate-x-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>HOME</span>
          </Link>
        </motion.div>

        <div className="flex flex-1 items-center justify-center px-6 py-24">
          <div className="w-full max-w-md">
            <AnimatePresence mode="wait">
              {
                <motion.div
                  key="login-form"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                >
                  {/* Brutalist Card */}
                  <div className="relative">
                    {/* Corner accents */}
                    <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-[#00ff88]" />
                    <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-[#00ff88]" />
                    <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-[#00ff88]" />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-[#00ff88]" />
                    
                    {/* Card content */}
                    <div className="bg-black/90 backdrop-blur-sm border border-[#222] p-8">
                      {/* Terminal header */}
                      <div className="flex items-center gap-2 mb-6 pb-4 border-b border-[#222]">
                        <div className="flex gap-1.5">
                          <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                          <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                          <div className="w-3 h-3 rounded-full bg-[#27ca40]" />
                        </div>
                        <span className="ml-auto font-mono text-xs text-[#666]">authenticate.exe</span>
                      </div>

                      {/* Header */}
                      <div className="mb-8">
                        <h1 className="text-2xl font-bold text-white font-mono mb-2 flex items-center gap-2">
                          <span className="text-[#00ff88]">{'>>'}</span> SIGN IN
                        </h1>
                        <p className="text-[#666] font-mono text-sm">
                          Access your StockBreakout terminal
                        </p>
                      </div>

                      {/* OAuth buttons */}
                      <div className="grid grid-cols-2 gap-3 mb-6">
                        <motion.button
                          whileHover={{ scale: 1.02, borderColor: '#00ff88' }}
                          whileTap={{ scale: 0.98 }}
                          className="flex items-center justify-center gap-2 bg-[#0a0a0a] text-white border border-[#222] py-3 px-4 transition-all duration-200 font-mono text-sm hover:bg-[#111]"
                        >
                          <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                          </svg>
                          GOOGLE
                        </motion.button>

                        <motion.button
                          whileHover={{ scale: 1.02, borderColor: '#00ff88' }}
                          whileTap={{ scale: 0.98 }}
                          className="flex items-center justify-center gap-2 bg-[#0a0a0a] text-white border border-[#222] py-3 px-4 transition-all duration-200 font-mono text-sm hover:bg-[#111]"
                        >
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                          </svg>
                          APPLE
                        </motion.button>
                      </div>

                      {/* Divider */}
                      <div className="flex items-center gap-4 mb-6">
                        <div className="h-px bg-[#222] flex-1" />
                        <span className="text-[#444] font-mono text-xs">OR_USE_EMAIL</span>
                        <div className="h-px bg-[#222] flex-1" />
                      </div>

                      {/* Form */}
                      <form onSubmit={handleSubmit} className="space-y-4">
                        {errors.form && (
                          <p className="text-[#ff4444] text-xs font-mono">{errors.form}</p>
                        )}

                        {/* Email */}
                        <div>
                          <label htmlFor="email" className="block text-xs text-[#00ff88] mb-2 font-mono uppercase tracking-wider">
                            Email
                          </label>
                          <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className={`w-full bg-[#0a0a0a] text-white border ${
                              errors.email ? "border-[#ff4444]" : "border-[#222]"
                            } py-3 px-4 focus:outline-none focus:border-[#00ff88] transition-colors font-mono text-sm placeholder:text-[#444]`}
                            placeholder="your@email.com"
                          />
                          {errors.email && (
                            <p className="text-[#ff4444] text-xs mt-1 font-mono">{errors.email}</p>
                          )}
                        </div>

                        {/* Password */}
                        <div>
                          <label htmlFor="password" className="block text-xs text-[#00ff88] mb-2 font-mono uppercase tracking-wider">
                            Password
                          </label>
                          <div className="relative">
                            <input
                              type={showPassword ? "text" : "password"}
                              id="password"
                              name="password"
                              value={formData.password}
                              onChange={handleChange}
                              className={`w-full bg-[#0a0a0a] text-white border ${
                                errors.password ? "border-[#ff4444]" : "border-[#222]"
                              } py-3 px-4 pr-12 focus:outline-none focus:border-[#00ff88] transition-colors font-mono text-sm placeholder:text-[#444]`}
                              placeholder="Enter password..."
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#444] hover:text-[#00ff88] transition-colors"
                            >
                              {showPassword ? (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                </svg>
                              ) : (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              )}
                            </button>
                          </div>
                          {errors.password && (
                            <p className="text-[#ff4444] text-xs mt-1 font-mono">{errors.password}</p>
                          )}
                        </div>

                        {/* Remember me & Forgot password */}
                        <div className="flex items-center justify-between">
                          <label className="flex items-center gap-2 cursor-pointer group">
                            <div 
                              className={`w-4 h-4 border ${rememberMe ? 'bg-[#00ff88] border-[#00ff88]' : 'border-[#444] group-hover:border-[#00ff88]'} transition-all duration-200 flex items-center justify-center`}
                              onClick={() => setRememberMe(!rememberMe)}
                            >
                              {rememberMe && (
                                <svg className="w-3 h-3 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                            <span className="text-[#666] font-mono text-xs group-hover:text-[#888] transition-colors">REMEMBER_ME</span>
                          </label>
                          <Link to="/forgot-password" className="text-[#00ff88] font-mono text-xs hover:underline">
                            FORGOT_PASSWORD?
                          </Link>
                        </div>

                        {/* Submit button */}
                        <motion.button
                          type="submit"
                          disabled={isLoading}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="w-full bg-[#00ff88] hover:bg-[#00cc6a] text-black font-bold py-3 px-4 transition-all duration-200 font-mono text-sm uppercase tracking-wider mt-6 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {isLoading ? (
                            <>
                              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                              AUTHENTICATING...
                            </>
                          ) : (
                            <>SIGN IN</>
                          )}
                        </motion.button>
                      </form>

                      {/* Sign up link */}
                      <p className="text-center mt-6 text-[#666] font-mono text-sm">
                        {"Don't have an account?"}{" "}
                        <Link to="/signup" className="text-[#00ff88] hover:underline">
                          CREATE_ACCOUNT
                        </Link>
                      </p>
                    </div>
                  </div>
                </motion.div>
              }
            </AnimatePresence>
          </div>
        </div>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="relative z-10 py-6 text-center"
        >
          <p className="text-[#444] font-mono text-xs">
            &copy; {new Date().getFullYear()} STOCKBREAKOUT. ALL RIGHTS RESERVED.
          </p>
        </motion.footer>
      </div>
    </div>
  )
}
