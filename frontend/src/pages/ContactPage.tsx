import { useState } from "react"
import { motion } from "framer-motion"
import { Link } from "react-router-dom"
import { Mail, Send, CheckCircle } from "lucide-react"

const SUPPORT_EMAIL = "support@orbistrading.io"

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const body = encodeURIComponent(
      `Name: ${form.name}\nEmail: ${form.email}\n\n${form.message}`
    )
    const mailto = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(form.subject || "Contact from StockBreakout")}&body=${body}`
    window.location.href = mailto

    setTimeout(() => {
      setLoading(false)
      setSubmitted(true)
    }, 800)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Mini navbar */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="fixed top-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 pl-4 pr-4 py-2 border border-[#00ff88]/30 bg-black/80 backdrop-blur-sm"
      >
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center border border-[#00ff88] bg-[#00ff88]">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-black">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>
          <span className="font-mono text-sm font-bold tracking-tight text-white uppercase">StockBreakout</span>
        </Link>
      </motion.header>

      <div className="mx-auto max-w-4xl px-4 sm:px-6 pt-36 pb-24">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-4 font-mono text-xs text-white/30">
            <span className="text-[#00ff88]">CONTACT</span>
            <div className="h-px flex-1 bg-[#222]" />
            <span>support@orbistrading.io</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight">
            Get in <span className="text-[#00ff88]">touch.</span>
          </h1>
          <p className="mt-4 font-mono text-sm text-white/50 max-w-xl">
            Have a question, issue, or feedback? We read every message and typically respond within one business day.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-5 gap-10">
          {/* Left — info */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="md:col-span-2 flex flex-col gap-6"
          >
            <div className="border border-[#222] bg-[#0a0a0a] p-6 hover:border-[#00ff88]/30 transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-8 w-8 items-center justify-center border border-[#00ff88]/40 bg-[#00ff88]/10">
                  <Mail className="h-4 w-4 text-[#00ff88]" />
                </div>
                <span className="font-mono text-xs font-bold uppercase text-white tracking-wider">Email Support</span>
              </div>
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="font-mono text-sm text-[#00ff88] hover:underline break-all"
              >
                {SUPPORT_EMAIL}
              </a>
              <p className="mt-2 font-mono text-xs text-white/40 leading-relaxed">
                For account issues, billing questions, and feature requests.
              </p>
            </div>

            <div className="border border-[#222] bg-[#0a0a0a] p-6">
              <p className="font-mono text-xs text-white/30 uppercase tracking-widest mb-3">Response time</p>
              <p className="font-mono text-sm text-white/70">
                We aim to respond within <span className="text-[#00ff88]">1 business day.</span>
              </p>
            </div>
          </motion.div>

          {/* Right — form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="md:col-span-3"
          >
            {submitted ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[320px] border border-[#00ff88]/30 bg-[#00ff88]/5 p-10 text-center gap-4">
                <CheckCircle className="h-10 w-10 text-[#00ff88]" />
                <h2 className="font-mono text-lg font-bold text-white">Message sent</h2>
                <p className="font-mono text-sm text-white/50">
                  Your email client opened with the message pre-filled. We'll get back to you at <span className="text-[#00ff88]">{form.email}</span>.
                </p>
                <button
                  onClick={() => { setSubmitted(false); setForm({ name: "", email: "", subject: "", message: "" }) }}
                  className="mt-2 font-mono text-xs uppercase tracking-wider text-[#00ff88] hover:underline"
                >
                  Send another
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-mono text-xs uppercase tracking-wider text-white/40 mb-1.5">Name</label>
                    <input
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      required
                      placeholder="Your name"
                      className="w-full bg-[#0a0a0a] border border-[#222] px-4 py-3 font-mono text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#00ff88]/60 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-xs uppercase tracking-wider text-white/40 mb-1.5">Email</label>
                    <input
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      required
                      placeholder="you@example.com"
                      className="w-full bg-[#0a0a0a] border border-[#222] px-4 py-3 font-mono text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#00ff88]/60 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-mono text-xs uppercase tracking-wider text-white/40 mb-1.5">Subject</label>
                  <input
                    name="subject"
                    value={form.subject}
                    onChange={handleChange}
                    placeholder="What's this about?"
                    className="w-full bg-[#0a0a0a] border border-[#222] px-4 py-3 font-mono text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#00ff88]/60 transition-colors"
                  />
                </div>

                <div>
                  <label className="block font-mono text-xs uppercase tracking-wider text-white/40 mb-1.5">Message</label>
                  <textarea
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    required
                    rows={6}
                    placeholder="Describe your question or issue..."
                    className="w-full bg-[#0a0a0a] border border-[#222] px-4 py-3 font-mono text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#00ff88]/60 transition-colors resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center justify-center gap-2 border border-[#00ff88] bg-[#00ff88] px-6 py-3 font-mono text-sm font-bold uppercase tracking-wider text-black transition-all hover:bg-transparent hover:text-[#00ff88] disabled:opacity-50"
                >
                  {loading ? (
                    <span className="animate-pulse">Opening email client…</span>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Send Message
                    </>
                  )}
                </button>

                <p className="font-mono text-xs text-white/25">
                  Submitting opens your email client with the message pre-filled to {SUPPORT_EMAIL}.
                </p>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}
