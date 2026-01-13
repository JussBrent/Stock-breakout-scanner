"use client"

import React, { useState, createContext, useContext } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { LayoutDashboard, Brain, Target, TrendingUp, Settings, BarChart3, Activity, Menu, X, ArrowLeft } from "lucide-react"
import { Link, useLocation } from "react-router-dom"

import { cn } from "@/lib/utils"

interface Links {
  label: string
  href: string
  icon: React.ReactNode
}

const navItems: Links[] = [
  { icon: <LayoutDashboard className="h-5 w-5 text-white" />, label: "Dashboard", href: "/admin" },
  { icon: <Brain className="h-5 w-5 text-white" />, label: "AI Insights", href: "/ai-insights" },
  { icon: <Target className="h-5 w-5 text-white" />, label: "Scanner", href: "/scanner" },
  { icon: <TrendingUp className="h-5 w-5 text-white" />, label: "Stock Momentum", href: "/stock-momentum" },
  { icon: <BarChart3 className="h-5 w-5 text-white" />, label: "Analytics", href: "/analytics" },
  { icon: <Activity className="h-5 w-5 text-white" />, label: "Focus List", href: "/focus-list" },
  { icon: <Settings className="h-5 w-5 text-white" />, label: "Settings", href: "/settings" },
]

interface SidebarContextProps {
  open: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
  animate: boolean
  hovered: boolean
  setHovered: React.Dispatch<React.SetStateAction<boolean>>
}

const SidebarContext = createContext<SidebarContextProps | undefined>(undefined)

export const useSidebar = () => {
  const context = useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider")
  }
  return context
}

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
  const [openState, setOpenState] = useState(false)
  const [hoveredState, setHoveredState] = useState(false)

  const open = openProp !== undefined ? openProp : openState
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState

  return <SidebarContext.Provider value={{ open, setOpen, animate, hovered: hoveredState, setHovered: setHoveredState }}>{children}</SidebarContext.Provider>
}

// Provider wrapper used internally; renamed to avoid export clashes with AppSidebar
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
}) => {
  return (
    <SidebarProvider open={open} setOpen={setOpen} animate={animate}>
      {children}
    </SidebarProvider>
  )
}

export const SidebarBody = (props: React.ComponentProps<typeof motion.div>) => {
  return (
    <>
      <DesktopSidebar {...props} />
      <MobileSidebar {...(props as React.ComponentProps<"div">)} />
    </>
  )
}

export const DesktopSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<typeof motion.div>) => {
  const { open, setOpen, animate, setHovered } = useSidebar()
  return (
    <motion.div
      className={cn(
        "h-full hidden md:flex md:flex-col bg-black/95 backdrop-blur-xl border-r border-white/10 flex-shrink-0 py-4 shadow-lg shadow-black/40",
        className,
      )}
      animate={{
        width: animate ? (open ? "256px" : "72px") : "256px",
      }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      onMouseEnter={() => {
        setHovered(true)
        setTimeout(() => setOpen(true), 100)
      }}
      onMouseLeave={() => {
        setOpen(false)
        setHovered(false)
      }}
      {...props}
    >
      {children}
    </motion.div>
  )
}

export const MobileSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) => {
  const { open, setOpen } = useSidebar()
  return (
    <>
      <div
        className={cn(
          "h-10 px-4 py-4 flex flex-row md:hidden items-center justify-between bg-black text-white w-full",
        )}
        {...props}
      >
        <div className="flex justify-end z-20 w-full">
          <Menu className="text-neutral-800 dark:text-neutral-200 cursor-pointer" onClick={() => setOpen(!open)} />
        </div>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ x: "-100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "-100%", opacity: 0 }}
              transition={{
                duration: 0.3,
                ease: "easeInOut",
              }}
              className={cn(
                "fixed h-full w-full inset-0 bg-white dark:bg-neutral-900 p-10 z-[100] flex flex-col justify-between",
                className,
              )}
            >
              <div
                className="absolute right-10 top-10 z-50 text-neutral-800 dark:text-neutral-200 cursor-pointer"
                onClick={() => setOpen(!open)}
              >
                <X />
              </div>
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}

export const SidebarLink = ({
  link,
  className,
  ...props
}: {
  link: Links
  className?: string
  props?: React.ComponentProps<typeof Link>
}) => {
  const { open, hovered } = useSidebar()
  const showTooltip = hovered && !open
  
  return (
    <Link
      to={link.href}
      aria-label={link.label}
      className={cn(
        "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-white/70 hover:text-white hover:bg-white/10 transition-colors w-full",
        className,
      )}
      {...props}
    >
      <span className="flex-shrink-0">{link.icon}</span>
      <motion.span
        initial={false}
        animate={{
          opacity: open ? 1 : 0,
          x: open ? 0 : -10,
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="text-sm font-medium whitespace-nowrap overflow-hidden"
        style={{ display: open ? "inline-block" : "none" }}
      >
        {link.label}
      </motion.span>
      
      {/* Tooltip shows when sidebar is hovered but not yet expanded */}
      <motion.span
        initial={false}
        animate={{
          opacity: showTooltip ? 1 : 0,
          x: showTooltip ? 0 : 4,
        }}
        transition={{ duration: 0.15 }}
        className="pointer-events-none absolute left-full ml-2 px-2 py-1 rounded-md bg-white text-black text-xs font-medium shadow-lg whitespace-nowrap z-50"
        style={{ display: showTooltip ? "block" : "none" }}
      >
        {link.label}
      </motion.span>
    </Link>
  )
}

// Nav list used by both desktop and mobile shells
function SidebarNav({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <div className="w-full px-2">
      <nav className="flex flex-col gap-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href

          return (
            <SidebarLink
              key={item.label}
              link={item}
              onClick={onNavigate}
              className={cn(
                "transition-all duration-200",
                isActive ? "bg-white/15 text-white" : "",
              )}
            />
          )
        })}
      </nav>
    </div>
  )
}

export function AppSidebar() {
  const location = useLocation()

  return (
    <SidebarShell animate open={false}>
      {/* Desktop */}
      <DesktopSidebar className="fixed left-0 top-0 bottom-0 z-50 overflow-y-auto overflow-hidden pt-4">
        {/* Back Button */}
        <div className="px-2 pb-4 border-b border-white/10">
          <Link
            to="/"
            className="flex items-center justify-center w-full p-2.5 rounded-lg hover:bg-white/10 transition-colors text-white/70 hover:text-white group"
            aria-label="Back to landing page"
          >
            <ArrowLeft className="h-5 w-5" />
            <motion.span
              initial={false}
              animate={{
                opacity: false ? 1 : 0,
                x: false ? 0 : -10,
              }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="text-sm font-medium whitespace-nowrap overflow-hidden ml-2"
              style={{ display: false ? "inline-block" : "none" }}
            >
              Back
            </motion.span>
          </Link>
        </div>
        <SidebarNav pathname={location.pathname} />
      </DesktopSidebar>

      {/* Mobile trigger bar + sheet */}
      <MobileSidebar className="md:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-black border-b border-neutral-800 text-white flex items-center justify-end px-4">
        <MobileNav pathname={location.pathname} />
      </MobileSidebar>
    </SidebarShell>
  )
}

function MobileNav({ pathname }: { pathname: string }) {
  const { setOpen } = useSidebar()
  return <SidebarNav pathname={pathname} onNavigate={() => setOpen(false)} />
}

// For existing imports expecting `Sidebar` as the navigational component
export { AppSidebar as Sidebar }
