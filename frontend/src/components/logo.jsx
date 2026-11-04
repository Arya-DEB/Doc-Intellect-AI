import { useId } from "react";

const TRACES = [
  "M22 28 L24 30 L32 33 L40 30 L42 28",
  "M21 41 L22 28",
  "M43 41 L42 28",
  "M21 41 L32 44 L43 41",
  "M32 33 L32 44",
];

export function LogoMark({ size = 40, className = "" }) {
  const id = useId();

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      className={`logo-brain ${className}`}
      role="img"
      aria-label="Doc Intellect AI"
    >
      <style>{`
        @keyframes lg-breathe {
          0%, 100% { filter: drop-shadow(0 0 2px rgba(167,139,250,.5)); }
          50% { filter: drop-shadow(0 0 7px rgba(196,181,253,.95)); }
        }
        @keyframes lg-flow {
          to { stroke-dashoffset: -12; }
        }
        @keyframes lg-flash {
          0%, 100% { opacity: .25; }
          45%, 55% { opacity: 1; }
        }
        .logo-brain {
          animation: lg-breathe 2.6s ease-in-out infinite;
          overflow: visible;
        }
        .lg-current {
          stroke-dasharray: 3 3;
          animation: lg-flow .7s linear infinite;
        }
        .lg-spark {
          animation: lg-flash 1.4s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .logo-brain, .lg-current, .lg-spark {
            animation: none;
          }
        }
      `}</style>

      <defs>
        <linearGradient id={`${id}-g`} x1="8" y1="8" x2="56" y2="56">
          <stop offset="0" stopColor="#e9d5ff" />
          <stop offset="0.5" stopColor="#a78bfa" />
          <stop offset="1" stopColor="#818cf8" />
        </linearGradient>

        <filter id={`${id}-glow`} x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="1.6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Brain hemispheres */}
      <g
        stroke={`url(#${id}-g)`}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="#8b5cf6"
        fillOpacity="0.22"
      >
        <path d="M30 12C24 8 14 10 13 19C7 21 6 30 11 34C8 40 12 48 19 48C21 54 30 55 31 50Z" />
        <path d="M34 12C40 8 50 10 51 19C57 21 58 30 53 34C56 40 52 48 45 48C43 54 34 55 33 50Z" />
      </g>

      {/* Brain folds */}
      <g
        stroke={`url(#${id}-g)`}
        strokeWidth="2.2"
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

      {/* Electric current */}
      <g
        stroke="#f5f3ff"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter={`url(#${id}-glow)`}
      >
        {TRACES.map((d) => (
          <path key={d} d={d} className="lg-current" />
        ))}
      </g>

      {/* Moving sparks */}
      <g fill="#ffffff" filter={`url(#${id}-glow)`}>
        {TRACES.map((d, i) => (
          <circle key={d} r="1.7">
            <animateMotion
              dur={`${1.3 + i * 0.25}s`}
              begin={`${i * 0.2}s`}
              repeatCount="indefinite"
              path={d}
            />
          </circle>
        ))}
      </g>

      {/* Nodes */}
      <g fill="#ede9fe" filter={`url(#${id}-glow)`}>
        {[
          [22, 28, 2.4, 0],
          [42, 28, 2.4, 0.3],
          [21, 41, 2.4, 0.6],
          [43, 41, 2.4, 0.9],
          [24, 30, 1.7, 0.45],
          [40, 30, 1.7, 0.75],
          [32, 33, 2.1, 0.15],
          [32, 44, 1.8, 0.5],
        ].map(([cx, cy, r, delay]) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r}>
            <animate
              attributeName="r"
              values={`${r};${r * 1.7};${r}`}
              dur="1.6s"
              begin={`${delay}s`}
              repeatCount="indefinite"
            />
          </circle>
        ))}
      </g>

      {/* Electric zaps */}
      <g
        stroke="#ffffff"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter={`url(#${id}-glow)`}
      >
        <path className="lg-spark" d="M17 24 L19 26 L17 28" />
        <path
          className="lg-spark"
          style={{ animationDelay: ".7s" }}
          d="M47 24 L45 26 L47 28"
        />
        <path
          className="lg-spark"
          style={{ animationDelay: "1.1s" }}
          d="M30 52 L32 49 L34 52"
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
      <div className="relative overflow-hidden rounded-2xl p-0.5">
        <span className="absolute -inset-full animate-[spin_3.5s_linear_infinite] bg-[conic-gradient(from_0deg,transparent_0%,#c4b5fd_20%,transparent_40%,#818cf8_70%,transparent_90%)]" />

        <div className="relative flex items-center justify-center rounded-[14px] bg-[#1a1a45] p-1.5">
          <LogoMark size={size} />
        </div>
      </div>

      {showText && (
        <span className="whitespace-nowrap text-xl font-bold leading-tight tracking-tight">
          Doc Intellect{" "}
          <span className="bg-linear-to-r from-violet-300 to-indigo-300 bg-clip-text text-transparent">
            AI
          </span>
        </span>
      )}
    </div>
  );
}