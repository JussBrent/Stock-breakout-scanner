import React, { useState, useEffect, createContext, useContext } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { LayoutDashboard, Brain, Target, TrendingUp, Settings, BarChart3, Activity, X, ArrowLeft, Wallet, BookOpen, ChevronLeft, PanelLeft } from "lucide-react"
import { Link, useLocation } from "react-router-dom"

import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/useAuth"

interface Links {
  label: string
  href: string
  icon: React.ReactNode
  adminOnly?: boolean
}

interface NavSection {
  title: string
  items: Links[]
}

const navSections: NavSection[] = [
  {
    title: "Trading",
    items: [
      { icon: <LayoutDashboard className="h-4 w-4" />, label: "Dashboard", href: "/admin" },
      { icon: <Wallet className="h-4 w-4" />, label: "Portfolio", href: "/portfolio" },
      { icon: <Activity className="h-4 w-4" />, label: "Focus List", href: "/focus-list" },
    ],
  },
  {
    title: "Research",
    items: [
      { icon: <Target className="h-4 w-4" />, label: "Scanner", href: "/scanner" },
      { icon: <Brain className="h-4 w-4" />, label: "AI Insights", href: "/ai-insights" },
      { icon: <TrendingUp className="h-4 w-4" />, label: "Momentum", href: "/stock-momentum" },
    ],
  },
  {
    title: "Account",
    items: [
      { icon: <BarChart3 className="h-4 w-4" />, label: "Analytics", href: "/analytics" },
      { icon: <BookOpen className="h-4 w-4" />, label: "AI Training", href: "/ai-training", adminOnly: true },
      { icon: <Settings className="h-4 w-4" />, label: "Settings", href: "/settings" },
    ],
  },
]

interface SidebarContextProps {
  open: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
  animate: boolean
}

const SidebarContext = createContext<SidebarContextProps | undefined>(undefined)

export const useSidebar = () => {
  const context = useContext(SidebarContext)
  if (!context) throw new Error("useSidebar must be used within a SidebarProvider")
  return context
}

const SIDEBAR_STORAGE_KEY = "sb:open"

export const SidebarProvider = ({
  children,
  open: openProp,
  setOpen: setOpenProp,
  animate = true,
}: {
  children: React.ReactNode
  open?: boolean
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>
  animate?: boolean
}) => {
  const [openState, setOpenState] = useState<boolean>(() => {
    if (typeof window === "undefined") return false
    return window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === "1"
  })

  const open = openProp !== undefined ? openProp : openState
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState

  useEffect(() => {
    if (typeof window === "undefined") return
    window.localStorage.setItem(SIDEBAR_STORAGE_KEY, openState ? "1" : "0")
  }, [openState])

  return (
    <SidebarContext.Provider value={{ open, setOpen, animate }}>
      {children}
    </SidebarContext.Provider>
  )
}

export const SidebarShell = ({
  children,
  open,
  setOpen,
  animate,
}: {
  children: React.ReactNode
  open?: boolean
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>
  animate?: boolean
}) => (
  <SidebarProvider open={open} setOpen={setOpen} animate={animate}>
    {children}
  </SidebarProvider>
)

export const SidebarLink = ({
  link,
  className,
  isActive,
  props,
}: {
  link: Links
  className?: string
  isActive?: boolean
  props?: Omit<React.ComponentProps<typeof Link>, "to">
}) => {
  const { open } = useSidebar()

  return (
    <Link
      to={link.href}
      aria-label={link.label}
      className={cn(
        "relative flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors w-full group",
        isActive
          ? "bg-neutral-700/60 text-white"
          : "text-neutral-400 hover:text-white hover:bg-neutral-800/60",
        className,
      )}
      {...props}
    >
      <span className={cn("shrink-0", isActive ? "text-white" : "text-neutral-500 group-hover:text-neutral-300")}>
        {link.icon}
      </span>
      <motion.span
        initial={false}
        animate={{ opacity: open ? 1 : 0, x: open ? 0 : -8 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="text-sm font-medium whitespace-nowrap overflow-hidden"
        style={{ display: open ? "inline-block" : "none" }}
      >
        {link.label}
      </motion.span>

      {/* Hover tooltip when collapsed */}
      {!open && (
        <span
          className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 rounded-md bg-neutral-800 border border-neutral-700 text-xs font-medium text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 shadow-lg z-50"
        >
          {link.label}
        </span>
      )}
    </Link>
  )
}

function SidebarNav({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  const { isAdmin } = useAuth()
  const { open } = useSidebar()

  return (
    <div className="w-full px-2 space-y-0.5">
      {navSections.map((section, si) => {
        const visibleItems = section.items.filter((item) => !item.adminOnly || isAdmin)
        if (visibleItems.length === 0) return null
        return (
          <div key={section.title}>
            {si > 0 && <div className="my-2 border-t border-neutral-800" />}
            {open && (
              <p className="px-3 pb-1 pt-0.5 text-[10px] font-semibold uppercase tracking-widest text-neutral-600">
                {section.title}
              </p>
            )}
            <nav className="flex flex-col gap-0.5">
              {visibleItems.map((item) => (
                <SidebarLink
                  key={item.label}
                  link={item}
                  isActive={pathname === item.href}
                  props={{ onClick: () => onNavigate?.() }}
                />
              ))}
            </nav>
          </div>
        )
      })}
    </div>
  )
}

function LiveStatus() {
  const { open } = useSidebar()
  const { user, loading } = useAuth()

  if (loading || !user) return null

  const displayName =
    (user.user_metadata as { full_name?: string } | undefined)?.full_name ||
    user.email ||
    "Signed in"

  return (
    <div
      className="flex items-center gap-3 px-3 py-2.5 rounded-md bg-neutral-800/50 border border-neutral-700/50"
      title={open ? undefined : `Live — ${displayName}`}
    >
      <span className="relative flex h-2 w-2 shrink-0" aria-hidden="true">
        <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 animate-ping" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
      </span>
      <motion.div
        initial={false}
        animate={{ opacity: open ? 1 : 0 }}
        transition={{ duration: 0.2 }}
        className="flex flex-col min-w-0 overflow-hidden"
        style={{ display: open ? "flex" : "none" }}
      >
        <span className="text-xs font-medium text-white leading-tight">Live</span>
        <span className="text-[11px] text-neutral-500 truncate leading-tight">{displayName}</span>
      </motion.div>
    </div>
  )
}

export function AppSidebar() {
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <SidebarShell animate>
      <DesktopSidebarShell pathname={location.pathname} />

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-neutral-900 border-b border-neutral-800 flex items-center px-4 gap-3">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-md text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          aria-label="Open menu"
        >
          <PanelLeft className="h-5 w-5" />
        </button>
        <span className="text-sm font-semibold text-white">Orbis</span>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 z-90 bg-black/60"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="md:hidden fixed top-0 left-0 bottom-0 z-100 w-64 bg-neutral-900 border-r border-neutral-800 flex flex-col py-4"
            >
              <div className="flex items-center justify-between px-4 pb-4 border-b border-neutral-800">
                <Link to="/" className="flex items-center gap-2 text-sm font-semibold text-white">
                  <ArrowLeft className="h-4 w-4 text-neutral-400" />
                  Back
                </Link>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-1.5 rounded-md text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto py-3">
                <SidebarNav pathname={location.pathname} onNavigate={() => setMobileOpen(false)} />
              </div>
              <div className="px-2 pt-3 border-t border-neutral-800">
                <LiveStatus />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </SidebarShell>
  )
}

function DesktopSidebarShell({ pathname }: { pathname: string }) {
  const { open, setOpen } = useSidebar()

  useEffect(() => {
    document.documentElement.style.setProperty("--sidebar-w", open ? "240px" : "60px")
  }, [open])

  return (
    <motion.aside
      className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 z-50 bg-neutral-900 border-r border-neutral-800 overflow-hidden"
      animate={{ width: open ? "240px" : "60px" }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
    >
      {/* Header: toggle button */}
      <div className={cn("flex items-center h-14 shrink-0 border-b border-neutral-800", open ? "px-3 justify-between" : "justify-center")}>
        {open && (
          <Link to="/" className="flex items-center gap-2 text-sm font-semibold text-white truncate">
            <ArrowLeft className="h-4 w-4 text-neutral-400 shrink-0" />
            <span>Back</span>
          </Link>
        )}
        <button
          onClick={() => setOpen(!open)}
          className="p-1.5 rounded-md text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors shrink-0"
          aria-label={open ? "Collapse sidebar" : "Expand sidebar"}
        >
          {open ? <ChevronLeft className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto py-3">
        <SidebarNav pathname={pathname} />
      </div>

      {/* Footer: live status */}
      <div className="px-2 py-3 border-t border-neutral-800">
        <LiveStatus />
      </div>
    </motion.aside>
  )
}

export { AppSidebar as Sidebar }
