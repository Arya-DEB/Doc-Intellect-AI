import { useId } from "react";

export function LogoMark({ size = 40, className = "" }) {
  const id = useId();

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      className={className}
      role="img"
      aria-label="Doc Intellect AI"
    >
      <defs>
        <linearGradient id={`${id}-g`} x1="8" y1="8" x2="56" y2="56">
          <stop offset="0" stopColor="#c4b5fd" />
          <stop offset="0.5" stopColor="#8b5cf6" />
          <stop offset="1" stopColor="#6366f1" />
        </linearGradient>
        <filter
          id={`${id}-glow`}
          x="-200%"
          y="-200%"
          width="400%"
          height="400%"
        >
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* hemispheres */}
      <g
        stroke={`url(#${id}-g)`}
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="#8b5cf6"
        fillOpacity="0.14"
      >
        <path d="M30 12C24 8 14 10 13 19C7 21 6 30 11 34C8 40 12 48 19 48C21 54 30 55 31 50Z" />
        <path d="M34 12C40 8 50 10 51 19C57 21 58 30 53 34C56 40 52 48 45 48C43 54 34 55 33 50Z" />
      </g>

      {/* folds */}
      <g
        stroke={`url(#${id}-g)`}
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      >
        <path d="M13 19C19 19 22 23 22 28" />
        <path d="M11 34C17 33 21 36 21 41" />
        <path d="M31 24C26 24 24 27 24 30" />
        <path d="M51 19C45 19 42 23 42 28" />
        <path d="M53 34C47 33 43 36 43 41" />
        <path d="M33 24C38 24 40 27 40 30" />
      </g>

      {/* circuit traces */}
      <g stroke="#c4b5fd" strokeWidth="1" strokeLinecap="round" opacity="0.7">
        <line x1="22" y1="28" x2="24" y2="30" />
        <line x1="42" y1="28" x2="40" y2="30" />
        <line x1="21" y1="41" x2="22" y2="28" />
        <line x1="43" y1="41" x2="42" y2="28" />
      </g>

      {/* circuit nodes (pulsing, staggered) */}
      <g fill="#ffffff" filter={`url(#${id}-glow)`}>
        <circle className="logo-node" cx="22" cy="28" r="2.2" />
        <circle
          className="logo-node"
          style={{ animationDelay: "0.4s" }}
          cx="21"
          cy="41"
          r="2.2"
        />
        <circle
          className="logo-node"
          style={{ animationDelay: "0.8s" }}
          cx="24"
          cy="30"
          r="1.6"
        />
        <circle
          className="logo-node"
          style={{ animationDelay: "0.2s" }}
          cx="42"
          cy="28"
          r="2.2"
        />
        <circle
          className="logo-node"
          style={{ animationDelay: "0.6s" }}
          cx="43"
          cy="41"
          r="2.2"
        />
        <circle
          className="logo-node"
          style={{ animationDelay: "1s" }}
          cx="40"
          cy="30"
          r="1.6"
        />
      </g>
    </svg>
  );
}

export default function Logo({
  size = 52,
  showText = true,
  className = "",
}) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="flex items-center justify-center rounded-2xl bg-violet-500/15 p-2 ring-1 ring-violet-400/30">
        <LogoMark size={size} />
      </div>

      {showText && (
        <span className="text-xl font-bold leading-tight tracking-tight">
          Doc Intellect <span className="text-violet-300">AI</span>
        </span>
      )}
    </div>
  );
}
