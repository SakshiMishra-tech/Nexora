import { useId } from "react";

interface NexoraLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showWordmark?: boolean;
  variant?: "auto" | "light" | "dark";
  className?: string;
}

export function NexoraLogo({
  size = "md",
  showWordmark = true,
  variant = "auto",
  className = "",
}: NexoraLogoProps) {
  const gradientId = useId().replace(/:/g, "_");

  const sizeMap = {
    sm: { box: "h-8 w-8", text: "text-lg tracking-tight" },
    md: { box: "h-9 w-9", text: "text-xl tracking-tight" },
    lg: { box: "h-12 w-12", text: "text-2xl sm:text-3xl tracking-tight" },
    xl: { box: "h-16 w-16", text: "text-3xl sm:text-4xl tracking-tight" },
  };

  const current = sizeMap[size];

  // Determine text color based on variant
  // auto: adapts to light/dark page mode with high contrast
  // dark: for deep cosmic dark cards
  // light: for pure light background
  const textClass =
    variant === "dark"
      ? "bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent drop-shadow-sm"
      : variant === "light"
        ? "text-slate-950 font-black"
        : "text-foreground font-black";

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* High-Tech Geometric Nexora Logo Emblem */}
      <div className={`relative ${current.box} shrink-0 group`}>
        {/* Ambient Neon Glow Aura */}
        <div
          className="absolute -inset-0.5 rounded-2xl bg-gradient-to-tr from-indigo-600 via-cyan-400 to-violet-600 opacity-60 blur-sm transition-opacity duration-300 group-hover:opacity-100 group-hover:blur-md"
          aria-hidden="true"
        />

        {/* Crisp Vector Hex-Squircle Shield with 3D Geometric N-Matrix */}
        <svg
          viewBox="0 0 100 100"
          className="relative h-full w-full drop-shadow-md"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Outer Badge Gradient */}
            <linearGradient id={`bg_${gradientId}`} x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#1E1B4B" />
              <stop offset="50%" stopColor="#0F172A" />
              <stop offset="100%" stopColor="#020617" />
            </linearGradient>

            {/* Neon Accent Gradient */}
            <linearGradient id={`neon_${gradientId}`} x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#6366F1" />
              <stop offset="45%" stopColor="#38BDF8" />
              <stop offset="100%" stopColor="#A855F7" />
            </linearGradient>

            {/* Spark Gradient */}
            <linearGradient id={`spark_${gradientId}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="100%" stopColor="#E0E7FF" />
            </linearGradient>

            {/* Border Glow Gradient */}
            <linearGradient id={`border_${gradientId}`} x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="rgba(255,255,255,0.45)" />
              <stop offset="40%" stopColor="rgba(99,102,241,0.8)" />
              <stop offset="100%" stopColor="rgba(168,85,247,0.5)" />
            </linearGradient>
          </defs>

          {/* Squircle Badge Background */}
          <rect
            x="4"
            y="4"
            width="92"
            height="92"
            rx="26"
            fill={`url(#bg_${gradientId})`}
            stroke={`url(#border_${gradientId})`}
            strokeWidth="2.5"
          />

          {/* Futuristic Geometric Nexora "N" Nexus Ribbons */}
          {/* Left Pillar */}
          <path
            d="M26 28 C26 25 28 23 31 23 L37 23 C40 23 42 25 42 28 L42 72 C42 75 40 77 37 77 L31 77 C28 77 26 75 26 72 Z"
            fill={`url(#neon_${gradientId})`}
            opacity="0.95"
          />

          {/* Dynamic Diagonal Spark Nexus */}
          <path
            d="M37 25 L65 67 C67 70 69 72 73 72 L74 72 C76 72 77 70 76 68 L53 30 C51 27 49 25 45 25 Z"
            fill={`url(#spark_${gradientId})`}
            filter="drop-shadow(0 2px 6px rgba(56,189,248,0.5))"
          />

          {/* Right Pillar */}
          <path
            d="M58 28 C58 25 60 23 63 23 L69 23 C72 23 74 25 74 28 L74 72 C74 75 72 77 69 77 L63 77 C60 77 58 75 58 72 Z"
            fill={`url(#neon_${gradientId})`}
            opacity="0.8"
          />

          {/* Glowing Quantum Diamond Spark at Nexus Center */}
          <circle cx="50" cy="50" r="4.5" fill="#FFFFFF" filter="drop-shadow(0 0 6px #38BDF8)" />
          <path
            d="M50 38 L52.5 47.5 L62 50 L52.5 52.5 L50 62 L47.5 52.5 L38 50 L47.5 47.5 Z"
            fill="#38BDF8"
            opacity="0.9"
          />
        </svg>
      </div>

      {/* Brand Typography */}
      {showWordmark && (
        <span
          className={`font-display font-black ${current.text} ${textClass}`}
        >
          Nexora
        </span>
      )}
    </div>
  );
}
