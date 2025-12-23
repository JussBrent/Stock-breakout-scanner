"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { CanvasRevealEffect } from "./canvas-reveal-effect"

interface SignUpPageProps {
  className?: string
}

function MiniNavbar() {
  const logoElement = (
    <div className="relative w-5 h-5 flex items-center justify-center">
      <span className="absolute w-1.5 h-1.5 rounded-full bg-gray-200 top-0 left-1/2 transform -translate-x-1/2 opacity-80" />
      <span className="absolute w-1.5 h-1.5 rounded-full bg-gray-200 left-0 top-1/2 transform -translate-y-1/2 opacity-80" />
      <span className="absolute w-1.5 h-1.5 rounded-full bg-gray-200 right-0 top-1/2 transform -translate-y-1/2 opacity-80" />
      <span className="absolute w-1.5 h-1.5 rounded-full bg-gray-200 bottom-0 left-1/2 transform -translate-x-1/2 opacity-80" />
    </div>
  )

  return (
    <header
      className="fixed top-6 left-1/2 transform -translate-x-1/2 z-20
        flex items-center
        pl-6 pr-6 py-3 backdrop-blur-sm
        rounded-full
        border border-[#333] bg-[#1f1f1f57]"
    >
      <div className="flex items-center">{logoElement}</div>
    </header>
  )
}

export const SignUpPage: React.FC<SignUpPageProps> = ({ className }) => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [step, setStep] = useState<"signup" | "success">("signup")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Name is required"
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format"
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = "Phone number is required"
    } else if (!/^[\d\s\-\+\(\)]+$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = "Invalid phone number format"
    }

    if (!formData.password) {
      newErrors.password = "Password is required"
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters"
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      // Simulate account creation
      setTimeout(() => {
        setStep("success")
      }, 500)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }))
    }
  }

  return (
    <div className={cn("flex w-full flex-col min-h-screen bg-black relative", className)}>
      {/* Animated background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0">
          <CanvasRevealEffect
            animationSpeed={3}
            containerClassName="bg-black"
            colors={[
              [255, 255, 255],
              [255, 255, 255],
            ]}
            dotSize={6}
            reverse={false}
          />
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(0,0,0,1)_0%,_transparent_100%)]" />
        <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-black to-transparent" />
      </div>

      <div className="relative z-10 flex flex-col flex-1">
        <MiniNavbar />

        {/* Back to Home button */}
        <a
          href="/"
          className="fixed top-6 left-6 z-30 group flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10 hover:border-white/30 rounded-full text-white/70 hover:text-white transition-all duration-200"
        >
          <svg
            className="w-4 h-4 transition-transform group-hover:-translate-x-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-sm">Home</span>
        </a>

        <div className="flex flex-1 items-center justify-center px-6 py-24">
          <div className="w-full max-w-md">
            <AnimatePresence mode="wait">
              {step === "signup" ? (
                <motion.div
                  key="signup-form"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                >
                  {/* Modern Card */}
                  <div className="relative">
                    {/* Card glow effect */}
                    <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 via-emerald-400/20 to-emerald-500/20 rounded-2xl blur-xl opacity-50" />
                    
                    {/* Card content */}
                    <div className="relative bg-gradient-to-br from-neutral-950/90 via-zinc-950/90 to-black/90 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
                      {/* Header */}
                      <div className="text-center mb-8">
                        <div className="flex items-center justify-center gap-3 mb-4">
                          <a
                            href="/login"
                            className="group flex items-center gap-1.5 text-neutral-400 hover:text-white transition-colors text-sm"
                          >
                            <svg 
                              className="w-4 h-4 transition-transform group-hover:-translate-x-1" 
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            <span>Back</span>
                          </a>
                        </div>
                        <h1 className="text-3xl font-bold text-white mb-2">
                          Create Account
                        </h1>
                        <p className="text-neutral-400">
                          Join StockBreakout Scanner today
                        </p>
                      </div>

                      {/* Authentication Methods - Only Google and Apple */}
                      <div className="grid grid-cols-2 gap-3 mb-6">
                        {/* Google */}
                        <button className="backdrop-blur-[2px] flex flex-col items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-white/20 rounded-2xl py-4 px-4 transition-all duration-200 group">
                          <svg className="w-6 h-6" viewBox="0 0 24 24">
                            <path
                              fill="currentColor"
                              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                              fill="currentColor"
                              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                              fill="currentColor"
                              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            />
                            <path
                              fill="currentColor"
                              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                          </svg>
                          <span className="text-sm">Google</span>
                        </button>

                        {/* Apple */}
                        <button className="backdrop-blur-[2px] flex flex-col items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-white/20 rounded-2xl py-4 px-4 transition-all duration-200 group">
                          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                          </svg>
                          <span className="text-sm">Apple</span>
                        </button>
                      </div>

                      {/* Divider */}
                      <div className="flex items-center gap-4 mb-6">
                        <div className="h-px bg-white/10 flex-1" />
                        <span className="text-white/40 text-sm">or use email</span>
                        <div className="h-px bg-white/10 flex-1" />
                      </div>

                      {/* Signup form */}
                      <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Full Name */}
                        <div>
                          <label htmlFor="fullName" className="block text-sm text-neutral-300 mb-2">
                            Full Name
                          </label>
                          <input
                            type="text"
                            id="fullName"
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleChange}
                            className={`w-full bg-white/5 backdrop-blur-sm text-white border ${
                              errors.fullName ? "border-red-500/50" : "border-white/10"
                            } rounded-xl py-3 px-4 focus:outline-none focus:border-emerald-500/50 transition-colors`}
                            placeholder="John Doe"
                          />
                          {errors.fullName && (
                            <p className="text-red-400 text-xs mt-1">{errors.fullName}</p>
                          )}
                        </div>

                        {/* Email */}
                        <div>
                          <label htmlFor="email" className="block text-sm text-neutral-300 mb-2">
                            Email
                          </label>
                          <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className={`w-full bg-white/5 backdrop-blur-sm text-white border ${
                              errors.email ? "border-red-500/50" : "border-white/10"
                            } rounded-xl py-3 px-4 focus:outline-none focus:border-emerald-500/50 transition-colors`}
                            placeholder="john@example.com"
                          />
                          {errors.email && (
                            <p className="text-red-400 text-xs mt-1">{errors.email}</p>
                          )}
                        </div>

                        {/* Phone Number */}
                        <div>
                          <label htmlFor="phoneNumber" className="block text-sm text-neutral-300 mb-2">
                            Phone Number
                          </label>
                          <input
                            type="tel"
                            id="phoneNumber"
                            name="phoneNumber"
                            value={formData.phoneNumber}
                            onChange={handleChange}
                            className={`w-full bg-white/5 backdrop-blur-sm text-white border ${
                              errors.phoneNumber ? "border-red-500/50" : "border-white/10"
                            } rounded-xl py-3 px-4 focus:outline-none focus:border-emerald-500/50 transition-colors`}
                            placeholder="+1 (555) 000-0000"
                          />
                          {errors.phoneNumber && (
                            <p className="text-red-400 text-xs mt-1">{errors.phoneNumber}</p>
                          )}
                        </div>

                        {/* Password */}
                        <div>
                          <label htmlFor="password" className="block text-sm text-neutral-300 mb-2">
                            Password
                          </label>
                          <div className="relative">
                            <input
                              type={showPassword ? "text" : "password"}
                              id="password"
                              name="password"
                              value={formData.password}
                              onChange={handleChange}
                              className={`w-full bg-white/5 backdrop-blur-sm text-white border ${
                                errors.password ? "border-red-500/50" : "border-white/10"
                              } rounded-xl py-3 px-4 pr-12 focus:outline-none focus:border-emerald-500/50 transition-colors`}
                              placeholder="Min. 8 characters"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition-colors"
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
                            <p className="text-red-400 text-xs mt-1">{errors.password}</p>
                          )}
                        </div>

                        {/* Confirm Password */}
                        <div>
                          <label htmlFor="confirmPassword" className="block text-sm text-neutral-300 mb-2">
                            Confirm Password
                          </label>
                          <div className="relative">
                            <input
                              type={showConfirmPassword ? "text" : "password"}
                              id="confirmPassword"
                              name="confirmPassword"
                              value={formData.confirmPassword}
                              onChange={handleChange}
                              className={`w-full bg-white/5 backdrop-blur-sm text-white border ${
                                errors.confirmPassword ? "border-red-500/50" : "border-white/10"
                              } rounded-xl py-3 px-4 pr-12 focus:outline-none focus:border-emerald-500/50 transition-colors`}
                              placeholder="Re-enter password"
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition-colors"
                            >
                              {showConfirmPassword ? (
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
                          {errors.confirmPassword && (
                            <p className="text-red-400 text-xs mt-1">{errors.confirmPassword}</p>
                          )}
                        </div>

                        {/* Submit button */}
                        <motion.button
                          type="submit"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold rounded-xl py-3 px-4 transition-all duration-200 shadow-lg shadow-emerald-500/20 mt-6"
                        >
                          Create Account
                        </motion.button>
                      </form>

                      {/* Footer */}
                      <div className="mt-6 text-center">
                        <p className="text-sm text-neutral-400">
                          Already have an account?{" "}
                          <a
                            href="/login"
                            className="text-emerald-400 hover:text-emerald-300 transition-colors"
                          >
                            Sign in
                          </a>
                        </p>
                      </div>

                      <p className="text-xs text-white/40 mt-6 text-center leading-relaxed">
                        By creating an account, you agree to our{" "}
                        <a href="#" className="underline text-white/40 hover:text-white/60 transition-colors">
                          Terms
                        </a>{" "}
                        and{" "}
                        <a href="#" className="underline text-white/40 hover:text-white/60 transition-colors">
                          Privacy Policy
                        </a>
                        .
                      </p>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="success-step"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                >
                  {/* Success Card */}
                  <div className="relative">
                    <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/30 via-emerald-400/30 to-emerald-500/30 rounded-2xl blur-xl" />
                    
                    <div className="relative bg-gradient-to-br from-neutral-950/90 via-zinc-950/90 to-black/90 backdrop-blur-xl border border-white/10 rounded-2xl p-12 text-center">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.5, delay: 0.2, type: "spring" }}
                        className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center mb-6"
                      >
                        <svg
                          className="w-10 h-10 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </motion.div>

                      <h2 className="text-3xl font-bold text-white mb-3">
                        Account Created!
                      </h2>
                      <p className="text-neutral-400 mb-8">
                        Welcome to StockBreakout Scanner, {formData.fullName}!
                      </p>

                      <motion.button
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        onClick={() => window.location.href = "/"}
                        className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold rounded-xl py-3 px-4 transition-all duration-200"
                      >
                        Get Started
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SignUpPage
