"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

interface VenusAvatarProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeMap = {
  sm: "h-10 w-10",
  md: "h-14 w-14",
  lg: "h-20 w-20",
  xl: "h-28 w-28",
};

/** Ícone do planeta Vênus — visual limpo, sem aura ou brilhos externos. */
export function VenusAvatar({ size = "lg", className }: VenusAvatarProps) {
  const uid = useId().replace(/:/g, "");

  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-full",
        "border border-violet-500/20 bg-[#0c0518]",
        sizeMap[size],
        className
      )}
      role="img"
      aria-label="Vênus"
    >
      <svg
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-full"
      >
        <defs>
          <clipPath id={`${uid}-clip`}>
            <circle cx="60" cy="60" r="50" />
          </clipPath>
          <radialGradient id={`${uid}-planet`} cx="36%" cy="34%" r="65%">
            <stop offset="0%" stopColor="#f5e6c8" />
            <stop offset="35%" stopColor="#e4b84a" />
            <stop offset="70%" stopColor="#c48428" />
            <stop offset="100%" stopColor="#7a4a18" />
          </radialGradient>
          <linearGradient id={`${uid}-shade`} x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1a1030" stopOpacity="0" />
            <stop offset="100%" stopColor="#1a1030" stopOpacity="0.5" />
          </linearGradient>
        </defs>

        <g clipPath={`url(#${uid}-clip)`}>
          <circle cx="60" cy="60" r="50" fill={`url(#${uid}-planet)`} />
          <ellipse cx="60" cy="50" rx="42" ry="5" fill="#f0dfa0" opacity="0.2" />
          <ellipse cx="60" cy="62" rx="40" ry="4" fill="#d4a848" opacity="0.18" />
          <ellipse cx="60" cy="72" rx="38" ry="5" fill="#b88830" opacity="0.15" />
          <ellipse cx="72" cy="60" rx="22" ry="42" fill={`url(#${uid}-shade)`} />
          <ellipse cx="44" cy="44" rx="10" ry="7" fill="white" opacity="0.12" />
        </g>
      </svg>
    </div>
  );
}
