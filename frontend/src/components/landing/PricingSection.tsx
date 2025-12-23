import React, {
  useState,
  useRef,
  useEffect,
  createContext,
  useContext,
} from "react"
import { motion, useSpring } from "framer-motion"
// @ts-ignore - canvas-confetti types
import confetti from "canvas-confetti"
import { Check, Star as LucideStar } from "lucide-react"
import NumberFlow from "@number-flow/react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

// --- UTILITY FUNCTIONS ---

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function useMediaQuery(query: string) {
  const [value, setValue] = useState(false)

  useEffect(() => {
    const result = window.matchMedia(query)

    function onChange(event: MediaQueryListEvent) {
      setValue(event.matches)
    }

    result.addEventListener("change", onChange)
    setValue(result.matches)

    return () => result.removeEventListener("change", onChange)
  }, [query])

  return value
}

// --- BASE UI COMPONENTS (BUTTON) ---

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp: any = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  },
)
Button.displayName = "Button"

// --- INTERACTIVE STARFIELD ---

function Star({
  mousePosition,
  containerRef,
}: {
  mousePosition: { x: number | null; y: number | null }
  containerRef: React.RefObject<HTMLDivElement | null>
}) {
  const [initialPos] = useState({
    top: `${Math.random() * 100}%`,
    left: `${Math.random() * 100}%`,
  })

  const springConfig = { stiffness: 100, damping: 15, mass: 0.1 }
  const springX = useSpring(0, springConfig)
  const springY = useSpring(0, springConfig)

  useEffect(() => {
    if (
      !containerRef.current ||
      mousePosition.x === null ||
      mousePosition.y === null
    ) {
      springX.set(0)
      springY.set(0)
      return
    }

    const containerRect = containerRef.current.getBoundingClientRect()
    const starX =
      containerRect.left +
      (Number.parseFloat(initialPos.left) / 100) * containerRect.width
    const starY =
      containerRect.top +
      (Number.parseFloat(initialPos.top) / 100) * containerRect.height

    const deltaX = mousePosition.x - starX
    const deltaY = mousePosition.y - starY
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

    const radius = 600 // Radius of magnetic influence

    if (distance < radius) {
      const force = 1 - distance / radius
      const pullX = deltaX * force * 0.5
      const pullY = deltaY * force * 0.5
      springX.set(pullX)
      springY.set(pullY)
    } else {
      springX.set(0)
      springY.set(0)
    }
  }, [mousePosition, initialPos, containerRef, springX, springY])

  return (
    <motion.div
      className="absolute rounded-full bg-white"
      style={{
        top: initialPos.top,
        left: initialPos.left,
        width: `${1 + Math.random() * 2}px`,
        height: `${1 + Math.random() * 2}px`,
        x: springX,
        y: springY,
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 1, 0] }}
      transition={{
        duration: 2 + Math.random() * 3,
        repeat: Number.POSITIVE_INFINITY,
        delay: Math.random() * 5,
      }}
    />
  )
}

function InteractiveStarfield({
  mousePosition,
  containerRef,
}: {
  mousePosition: { x: number | null; y: number | null }
  containerRef: React.RefObject<HTMLDivElement | null>
}) {
  return (
    <div className="pointer-events-none absolute inset-0 h-full w-full overflow-hidden">
      {Array.from({ length: 150 }).map((_, i) => (
        <Star
          key={`star-${i}`}
          mousePosition={mousePosition}
          containerRef={containerRef}
        />
      ))}
    </div>
  )
}

// --- PRICING COMPONENT LOGIC ---

interface PricingPlan {
  name: string
  price: string
  yearlyPrice: string
  period: string
  features: string[]
  description: string
  buttonText: string
  href: string
  isPopular?: boolean
}

interface PricingSectionProps {
  plans: PricingPlan[]
  title?: string
  description?: string
}

// Context for state management
const PricingContext = createContext<{
  isMonthly: boolean
  setIsMonthly: (value: boolean) => void
}>({
  isMonthly: true,
  setIsMonthly: () => {},
})

// Main PricingSection Component
export function PricingSection({
  plans,
  title = "Simple, Transparent Pricing",
  description = "Choose the plan that's right for you. All plans include our core features and support.",
}: PricingSectionProps) {
  const [isMonthly, setIsMonthly] = useState(true)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [mousePosition, setMousePosition] = useState<{
    x: number | null
    y: number | null
  }>({ x: null, y: null })

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const { clientX, clientY } = event
    setMousePosition({ x: clientX, y: clientY })
  }

  return (
    <PricingContext.Provider value={{ isMonthly, setIsMonthly }}>
      <div
        id="pricing"
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setMousePosition({ x: null, y: null })}
        className="relative w-full bg-black py-20 sm:py-24"
      >
        <InteractiveStarfield
          mousePosition={mousePosition}
          containerRef={containerRef}
        />
        <div className="container relative z-10 mx-auto px-4 md:px-6">
          <div className="mx-auto mb-12 max-w-3xl space-y-4 text-center">
            <h2 className="text-4xl font-bold tracking-tighter text-white sm:text-5xl">
              {title}
            </h2>
            <p className="whitespace-pre-line text-lg text-gray-400">
              {description}
            </p>
          </div>
          <PricingToggle />
          <div className="mt-12 grid grid-cols-1 items-start gap-8 lg:grid-cols-3">
            {plans.map((plan, index) => (
              <PricingCard key={index} plan={plan} index={index} />
            ))}
          </div>
        </div>
      </div>
    </PricingContext.Provider>
  )
}

// Pricing Toggle Component
function PricingToggle() {
  const { isMonthly, setIsMonthly } = useContext(PricingContext)
  const confettiRef = useRef<HTMLDivElement>(null)
  const monthlyBtnRef = useRef<HTMLButtonElement>(null)
  const annualBtnRef = useRef<HTMLButtonElement>(null)

  const [pillStyle, setPillStyle] = useState<React.CSSProperties>({})

  useEffect(() => {
    const btnRef = isMonthly ? monthlyBtnRef : annualBtnRef
    if (btnRef.current) {
      setPillStyle({
        width: btnRef.current.offsetWidth,
        transform: `translateX(${btnRef.current.offsetLeft}px)`,
      })
    }
  }, [isMonthly])

  const handleToggle = (monthly: boolean) => {
    if (isMonthly === monthly) return
    setIsMonthly(monthly)

    if (!monthly && confettiRef.current) {
      const rect = annualBtnRef.current?.getBoundingClientRect()
      if (!rect) return

      const originX = (rect.left + rect.width / 2) / window.innerWidth
      const originY = (rect.top + rect.height / 2) / window.innerHeight

      confetti({
        particleCount: 80,
        spread: 80,
        origin: { x: originX, y: originY },
        colors: [
          "hsl(var(--primary))",
          "hsl(var(--background))",
          "hsl(var(--accent))",
        ],
        ticks: 300,
        gravity: 1.2,
        decay: 0.94,
        startVelocity: 30,
      })
    }
  }

  return (
    <div className="flex justify-center">
      <div
        ref={confettiRef}
        className="relative flex w-fit items-center rounded-full border border-zinc-800 bg-zinc-900 p-1"
      >
        <motion.div
          className="absolute left-0 top-0 h-full rounded-full bg-primary p-1"
          style={pillStyle}
          transition={{ type: "spring", stiffness: 500, damping: 40 }}
        />
        <button
          ref={monthlyBtnRef}
          onClick={() => handleToggle(true)}
          className={cn(
            "relative z-10 rounded-full px-4 py-2 text-sm font-medium transition-colors sm:px-6",
            isMonthly
              ? "text-primary-foreground"
              : "text-gray-400 hover:text-white",
          )}
        >
          Monthly
        </button>
        <button
          ref={annualBtnRef}
          onClick={() => handleToggle(false)}
          className={cn(
            "relative z-10 rounded-full px-4 py-2 text-sm font-medium transition-colors sm:px-6",
            !isMonthly
              ? "text-primary-foreground"
              : "text-gray-400 hover:text-white",
          )}
        >
          Annual
          <span
            className={cn(
              "hidden sm:inline",
              !isMonthly ? "text-primary-foreground/80" : "",
            )}
          >
            {" "}
            (Save 20%)
          </span>
        </button>
      </div>
    </div>
  )
}

// Pricing Card Component
function PricingCard({ plan, index }: { plan: PricingPlan; index: number }) {
  const { isMonthly } = useContext(PricingContext)
  const isDesktop = useMediaQuery("(min-width: 1024px)")

  const priceValue = isMonthly ? Number(plan.price) : Number(plan.yearlyPrice)

  return (
    <motion.div
      initial={{ y: 50, opacity: 0 }}
      whileInView={{
        y: plan.isPopular && isDesktop ? -20 : 0,
        opacity: 1,
      }}
      viewport={{ once: true }}
      transition={{
        duration: 0.6,
        type: "spring",
        stiffness: 100,
        damping: 20,
        delay: index * 0.15,
      }}
      className={cn(
        "relative flex flex-col rounded-2xl p-8 backdrop-blur-sm",
        plan.isPopular
          ? "border-2 border-emerald-500 bg-zinc-900/50 shadow-xl"
          : "border border-zinc-800 bg-zinc-900/30",
      )}
    >
      {plan.isPopular && (
        <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2">
          <div className="flex items-center gap-1.5 rounded-full bg-emerald-500 py-1.5 px-4">
            <LucideStar className="h-4 w-4 fill-current text-white" />
            <span className="text-sm font-semibold text-white">
              Most Popular
            </span>
          </div>
        </div>
      )}
      <div className="flex flex-1 flex-col text-center">
        <h3 className="text-xl font-semibold text-white">{plan.name}</h3>
        <p className="mt-2 text-sm text-gray-400">{plan.description}</p>
        <div className="mt-6 flex items-baseline justify-center gap-x-1">
          <span className="text-5xl font-bold tracking-tight text-white tabular-nums">
            <NumberFlow
              value={priceValue}
              format={{
                style: "currency",
                currency: "USD",
                minimumFractionDigits: 0,
              }}
            />
          </span>
          <span className="text-sm font-semibold leading-6 tracking-wide text-gray-400">
            / {plan.period}
          </span>
        </div>
        <p className="mt-2 text-xs text-gray-500">
          {isMonthly ? "Billed Monthly" : "Billed Annually"}
        </p>

        <ul
          role="list"
          className="mt-8 space-y-3 text-left text-sm leading-6 text-gray-300"
        >
          {plan.features.map((feature) => (
            <li key={feature} className="flex gap-x-3">
              <Check
                className="h-6 w-5 flex-none text-emerald-500"
                aria-hidden="true"
              />
              {feature}
            </li>
          ))}
        </ul>

        <div className="mt-auto pt-8">
          <a
            href={plan.href}
            className={cn(
              buttonVariants({
                variant: plan.isPopular ? "default" : "outline",
                size: "lg",
              }),
              "inline-flex w-full items-center justify-center",
            )}
          >
            {plan.buttonText}
          </a>
        </div>
      </div>
    </motion.div>
  )
}
