"use client";

import { cn } from "@/lib/utils";
import React, { ReactNode } from "react";

interface AuroraBackgroundProps
  extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export const AuroraBackground = ({
  className,
  children,
  ...props
}: AuroraBackgroundProps) => {
  return (
    <div
      className={cn(
        "relative flex w-full items-center justify-center overflow-hidden bg-black text-white",
        className
      )}
      {...props}
    >
      {/* WHITE LIGHT BEAMS */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* beams layer */}
        <div
          className="absolute inset-[-160px] mix-blend-screen opacity-80"
          style={{
            backgroundImage: `
              /* a couple of bright spots */
              radial-gradient(circle at 10% 0%, rgba(255,255,255,0.45), transparent 60%),
              radial-gradient(circle at 80% 0%, rgba(255,255,255,0.35), transparent 60%),
              /* diagonal repeating beams */
              repeating-linear-gradient(
                115deg,
                rgba(255,255,255,0.7) 0%,
                rgba(255,255,255,0.18) 8%,
                rgba(0,0,0,0.0) 14%,
                rgba(0,0,0,0.0) 22%
              )
            `,
            backgroundSize: "190% 190%",
            backgroundPosition: "0% 0%",
            filter: "blur(18px)", // lower this (e.g. 12px) for sharper beams
            animation: "aurora-move 20s ease-in-out infinite alternate",
          }}
        />

        {/* subtle dark vignette so edges stay black */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle at center, transparent 0%, #000000 70%)",
            mixBlendMode: "multiply",
          }}
        />
      </div>

      {/* FOREGROUND CONTENT */}
      <div className="relative z-10 w-full">{children}</div>
    </div>
  );
};
