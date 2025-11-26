"use client";

import { useEffect, useState, type CSSProperties } from "react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
} from "framer-motion";
import { AuroraBackground } from "@/components/ui/aurora-background";

type Feature = {
  title: string;
  description: string;
  image: string;
};

const features: Feature[] = [
  {
    title: "AI Strength Scores",
    description:
      "Every setup is ranked by AI-powered quality metrics analyzing volume, momentum, and technical patterns.",
    image: "/src/assets/stock1.jpg",
  },
  {
    title: "Default Coach Methodology",
    description:
      "Pre-configured scans based on proven 8 EMA breakout playbooks used by professional traders.",
    image: "/src/assets/stock2.jpg",
  },
  {
    title: "Custom Scan Builder",
    description:
      "Build advanced scan profiles with custom filters, indicators, and technical criteria for your strategy.",
    image: "/src/assets/stock3.png",
  },
  {
    title: "Real-Time Focus Lists",
    description:
      "Automatically generated watchlists updated throughout the trading day with actionable breakout levels.",
    image: "/src/assets/stock4.jpg",
  },
  {
    title: "Leverage Advanced Indicators",
    description:
      "Limit possible losses and maximize gains with advanced technical indicators integrated into your scans.",
    image: "/src/assets/stock5.jpg",
  },
];

export default function FeatureCards() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [typedText, setTypedText] = useState("");
  const [hoverLabel, setHoverLabel] = useState<string | null>(null);

  // --- Smooth cursor trail for hover pill ---
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);

  // tweak stiffness/damping for more / less lag
  const smoothX = useSpring(rawX, { stiffness: 95, damping: 16 });
  const smoothY = useSpring(rawY, { stiffness: 95, damping: 16 });

  const len = features.length;
  const clampIndex = (index: number) => (index + len) % len;

  const next = () => setActiveIndex((i) => clampIndex(i + 1));

  const getPosition = (i: number) => {
    let pos = i - activeIndex;
    if (pos > len / 2) pos -= len;
    if (pos < -len / 2) pos += len;
    return pos;
  };

  const getCardStyle = (i: number): CSSProperties => {
    const position = getPosition(i);

    // Hide cards beyond immediate neighbours
    if (Math.abs(position) > 1) {
      return {
        opacity: 0,
        pointerEvents: "none",
        transform: `translateX(${position * 120}%) rotate(${position * 4}deg) scale(0.88)`,
        filter: "brightness(0.4)",
      };
    }

    const isCenter = position === 0;
    const width = "68%";
    const translateX = position * 108;
    const rotate = position * 4;
    const opacity = isCenter ? 1 : 0.75;
    const scale = isCenter ? 1 : 0.92;

    // 👇 center card bright, side cards dimmed
    const brightness = isCenter ? 1 : 0.6;

    return {
      width,
      opacity,
      transform: `translateX(${translateX}%) scale(${scale}) rotate(${rotate}deg)`,
      zIndex: isCenter ? 20 : 10 - Math.abs(position),
      filter: `brightness(${brightness})`,
      transition:
        "transform 450ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 320ms ease-out, filter 320ms ease-out",
    };
  };

  // Typing animation
  useEffect(() => {
    const full = features[activeIndex].description;
    setTypedText("");

    let idx = 0;
    const speed = 20;

    const id = setInterval(() => {
      idx += 1;
      setTypedText(full.slice(0, idx));
      if (idx >= full.length) clearInterval(id);
    }, speed);

    return () => clearInterval(id);
  }, [activeIndex]);

  // Autoplay
  useEffect(() => {
    const id = setInterval(() => next(), 6500);
    return () => clearInterval(id);
  }, []);

  return (
    <AuroraBackground className="py-32 border-t border-white/10">
      <motion.div
        className="mx-auto flex max-w-7xl flex-col items-center px-4 sm:px-6"
        initial={{ opacity: 0, y: 60 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 1.25, ease: "easeInOut" }}
      >
        {/* Header */}
        <motion.div
          className="mb-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 1.1, ease: "easeInOut", delay: 0.15 }}
        >
          <p className="text-[10px] tracking-[0.2em] text-white/50 uppercase">
            EVERYTHING YOU NEED
          </p>
          <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-white">
            Professional scanning tools
          </h2>
        </motion.div>

        {/* Cards */}
        <div className="relative flex h-[380px] w-full items-center justify-center sm:h-[440px] lg:h-[480px]">
          {features.map((feature, i) => {
            const position = getPosition(i);
            const isSide = Math.abs(position) === 1;
            const isCenter = position === 0;

            return (
              <div
                key={feature.title}
                className={
                  "group absolute aspect-[16/9] overflow-hidden rounded-3xl bg-zinc-900 border border-white/10 transition-shadow " +
                  (isCenter
                    ? "shadow-[0_26px_90px_-30px_rgba(0,0,0,0.9)]"
                    : "shadow-[0_16px_60px_-28px_rgba(0,0,0,0.7)]") +
                  (isSide ? " cursor-pointer" : "")
                }
                style={getCardStyle(i)}
                onMouseMove={(e) => {
                  if (!isSide) return;
                  // position raw cursor; spring will lag behind
                  rawX.set(e.clientX + 16);
                  rawY.set(e.clientY + 16);
                  setHoverLabel(position === 1 ? "Next" : "Previous");
                }}
                onMouseLeave={() => {
                  setHoverLabel(null);
                }}
                onClick={() => {
                  if (isSide) setActiveIndex(i);
                }}
              >
                <img
                  src={feature.image}
                  alt={feature.title}
                  className="h-full w-full object-cover"
                />
              </div>
            );
          })}
        </div>

        {/* Floating pill (white, follows cursor, delayed & smooth) */}
        <AnimatePresence>
          {hoverLabel && (
            <motion.div
              key="hover-pill"
              className="fixed pointer-events-none z-[999]"
              style={{ left: smoothX, top: smoothY }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
            >
              <span className="rounded-full border border-black/20 bg-white px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-black shadow-xl backdrop-blur-md">
                {hoverLabel}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Typing line */}
        <div className="mt-12 max-w-3xl text-center">
          <p className="mb-3 text-xs uppercase tracking-[0.25em] text-white/40">
            FEATURE HIGHLIGHT
          </p>

          {/* fixed height so layout doesn’t jump while typing */}
          <div className="flex h-[54px] items-center justify-center sm:h-[64px]">
            <p className="text-base leading-relaxed text-white sm:text-lg">
              <span className="font-semibold text-accent">
                {features[activeIndex].title}:
              </span>{" "}
              <span className="text-white/70">{typedText}</span>
              <span className="ml-1 inline-block h-5 w-[2px] animate-pulse bg-accent" />
            </p>
          </div>
        </div>

        {/* Dots */}
        <div className="mt-8 flex items-center gap-2">
          {features.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              className={
                "h-1.5 rounded-full transition-all " +
                (i === activeIndex
                  ? "w-8 bg-accent"
                  : "w-1.5 bg-white/30 hover:bg-white/50")
              }
            />
          ))}
        </div>
      </motion.div>
    </AuroraBackground>
  );
}

