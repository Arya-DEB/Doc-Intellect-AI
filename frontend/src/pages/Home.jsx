import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  CloudUpload,
  FileText,
  Menu,
  MessageSquare,
  Moon,
  ShieldCheck,
  Sparkles,
  Sun,
  X,
} from "lucide-react";

import Logo, { LogoMark } from "../components/logo";
import useTheme from "../context/useTheme";

/* ------------------------------------------------------------------ */
/* Data                                                                */
/* ------------------------------------------------------------------ */

const NAV = [
  ["Features", "#features"],
  ["How it works", "#how-it-works"],
  ["Preview", "#preview"],
];

const ROTATING_WORDS = [
  "reports",
  "contracts",
  "research papers",
  "study notes",
  "invoices",
];

const MARQUEE = [
  "Chat with your PDFs",
  "Page-level sources",
  "Ask in plain English",
  "Summaries in seconds",
  "Conversation history",
  "Your private workspace",
];

const STATS = [
  { to: 10, suffix: " MB", label: "max size per PDF" },
  { to: 3, suffix: " steps", label: "from upload to answer" },
  { to: 1, suffix: " place", label: "for your PDFs and chats" },
];

const FEATURES = [
  {
    icon: MessageSquare,
    title: "Chat with your PDFs",
    description:
      "Ask questions in natural language and get answers based on your documents.",
    span: "md:col-span-4",
    visual: "chat",
  },
  {
    icon: FileText,
    title: "Source-backed answers",
    description:
      "See which document and page an answer came from, so you can verify it.",
    span: "md:col-span-2",
    visual: "source",
  },
  {
    icon: Sparkles,
    title: "Understand more, faster",
    description:
      "Summarize lengthy material and uncover key information without reading every page.",
    span: "md:col-span-2",
    visual: "summary",
  },
  {
    icon: ShieldCheck,
    title: "Your document workspace",
    description:
      "Keep your PDFs and conversations organized together in one place.",
    span: "md:col-span-4",
    visual: "workspace",
  },
];

const STEPS = [
  {
    icon: CloudUpload,
    title: "Upload a PDF",
    description: "Drop your document into your personal workspace.",
  },
  {
    icon: MessageSquare,
    title: "Ask a question",
    description: "Ask about details, summaries, or specific topics.",
  },
  {
    icon: CheckCircle2,
    title: "Get clear answers",
    description: "Read responses grounded in your document, with sources.",
  },
];

const DEMO_Q = "What were the key findings in this report?";
const DEMO_A =
  "• Revenue grew steadily across all regions.\n• Customer retention is the top priority next quarter.\n• Two risks are flagged: supply delays and rising costs.";

const BUBBLES = Array.from({ length: 16 }, (_, i) => ({
  left: `${(i * 29 + 7) % 96}%`,
  size: 18 + ((i * 37) % 70), // 18px to 87px
  delay: `${-((i * 1.9) % 16)}s`, // negative = already mid-flight on load
  dur: `${15 + ((i * 3) % 11)}s`,
  sway: `${(i % 2 ? 1 : -1) * (20 + ((i * 11) % 45))}px`,
  rest: `${8 + ((i * 53) % 80)}%`,
}));

const SPARKS = Array.from({ length: 14 }, (_, i) => ({
  left: `${(i * 41 + 11) % 100}%`,
  top: `${(i * 23 + 5) % 100}%`,
  delay: `${(i * 0.45) % 5}s`,
}));

/* ------------------------------------------------------------------ */
/* Hooks and small components                                          */
/* ------------------------------------------------------------------ */

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);

function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return [ref, inView];
}

function Reveal({ children, delay = 0, className = "" }) {
  const [ref, inView] = useInView();

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-out motion-reduce:transition-none ${
        inView
          ? "translate-y-0 opacity-100"
          : "translate-y-8 opacity-0 motion-reduce:translate-y-0 motion-reduce:opacity-100"
      } ${className}`}
    >
      {children}
    </div>
  );
}

function CountUp({ to, suffix = "" }) {
  const [ref, inView] = useInView(0.4);
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView) return undefined;

    let frame;
    const start = performance.now();
    const duration = 1400;

    const step = (now) => {
      const progress = Math.min(1, (now - start) / duration);
      setValue(Math.round(to * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) frame = requestAnimationFrame(step);
    };

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [inView, to]);

  return (
    <span ref={ref}>
      {value}
      {suffix}
    </span>
  );
}

function RotatingWord() {
  const [index, setIndex] = useState(0);
  const [text, setText] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const word = ROTATING_WORDS[index];
    const delay = deleting ? 40 : text === word ? 1400 : 80;

    const timer = setTimeout(() => {
      if (!deleting && text === word) {
        setDeleting(true);
      } else if (deleting && text === "") {
        setDeleting(false);
        setIndex((i) => (i + 1) % ROTATING_WORDS.length);
      } else {
        setText(word.slice(0, text.length + (deleting ? -1 : 1)));
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [text, deleting, index]);

  return (
    <span className="inline-flex h-10 w-full items-center justify-center sm:h-12 sm:w-[15ch] sm:justify-start">
      <span className="hm-gradient-text">{text}</span>
      <span className="hm-caret ml-0.5 inline-block h-[1.1em] w-[3px] rounded-full bg-violet-500" />
    </span>
  );
}

function Tilt({ children, className = "" }) {
  const ref = useRef(null);

  function onMove(e) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    el.style.transform = `perspective(1400px) rotateY(${x * 6}deg) rotateX(${-y * 5}deg)`;
  }

  function onLeave() {
    if (ref.current) {
      ref.current.style.transform =
        "perspective(1400px) rotateY(0deg) rotateX(0deg)";
    }
  }

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={`will-change-transform transition-transform duration-300 ease-out ${className}`}
    >
      {children}
    </div>
  );
}

function SpotlightCard({ children, darkMode, className = "" }) {
  function onMove(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty("--my", `${e.clientY - rect.top}px`);
  }

  return (
    <div
      onMouseMove={onMove}
      className={`group relative h-full overflow-hidden rounded-3xl border transition duration-300 hover:-translate-y-1 ${
        darkMode
          ? "border-white/10 bg-white/[0.04] hover:border-violet-400/40"
          : "border-slate-200 bg-white hover:border-violet-200 hover:shadow-xl hover:shadow-violet-100/70"
      } ${className}`}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(420px circle at var(--mx, 50%) var(--my, 50%), ${
            darkMode ? "rgba(139,92,246,.22)" : "rgba(139,92,246,.14)"
          }, transparent 60%)`,
        }}
      />
      <div className="relative flex h-full flex-col p-6 sm:p-7">{children}</div>
    </div>
  );
}

function BotAvatar() {
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#1a1a45] ring-1 ring-violet-400/40">
      <LogoMark size={22} />
    </div>
  );
}

function ChatDemo({ darkMode, mutedText }) {
  const [still] = useState(prefersReducedMotion);
  const [phase, setPhase] = useState(still ? "done" : "typing");
  const [typed, setTyped] = useState(still ? DEMO_Q.length : 0);
  const [answered, setAnswered] = useState(still ? DEMO_A.length : 0);

  useEffect(() => {
    if (still) return undefined;
    let timer;

    if (phase === "typing") {
      timer =
        typed < DEMO_Q.length
          ? setTimeout(() => setTyped(typed + 1), 38)
          : setTimeout(() => setPhase("thinking"), 350);
    } else if (phase === "thinking") {
      timer = setTimeout(() => setPhase("answering"), 1300);
    } else if (phase === "answering") {
      timer =
        answered < DEMO_A.length
          ? setTimeout(
              () => setAnswered((n) => Math.min(DEMO_A.length, n + 2)),
              22,
            )
          : setTimeout(() => setPhase("done"), 300);
    } else {
      timer = setTimeout(() => {
        setTyped(0);
        setAnswered(0);
        setPhase("typing");
      }, 5000);
    }

    return () => clearTimeout(timer);
  }, [phase, typed, answered, still]);

  const showQuestion = phase !== "typing";
  const showAnswer = phase === "answering" || phase === "done";

  return (
    <div className="flex min-h-[21rem] min-w-0 flex-col p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold sm:text-sm">AI Assistant</p>
          <p className={`mt-0.5 flex items-center gap-1.5 text-[11px] sm:text-xs ${mutedText}`}>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Ready to chat about this document
          </p>
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 text-violet-500">
          <Sparkles size={16} />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3">
        {showQuestion && (
          <div className="flex justify-end">
            <div className="max-w-[90%] rounded-2xl rounded-br-sm bg-linear-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-xs leading-5 text-white sm:text-sm">
              {DEMO_Q}
            </div>
          </div>
        )}

        {phase === "thinking" && (
          <div className="flex items-center gap-2.5">
            <BotAvatar />
            <div
              className={`flex items-center gap-1.5 rounded-2xl rounded-bl-sm border px-4 py-3 ${
                darkMode
                  ? "border-white/10 bg-white/5"
                  : "border-violet-100 bg-white shadow-sm"
              }`}
            >
              {[0, 0.2, 0.4].map((d) => (
                <span
                  key={d}
                  className="hm-dot h-2 w-2 rounded-full bg-violet-500"
                  style={{ animationDelay: `${d}s` }}
                />
              ))}
            </div>
          </div>
        )}

        {showAnswer && (
          <div className="flex items-start gap-2.5">
            <BotAvatar />
            <div
              className={`min-w-0 max-w-[92%] rounded-2xl rounded-bl-sm border p-3.5 ${
                darkMode
                  ? "border-violet-300/15 bg-white/5"
                  : "border-violet-100 bg-white shadow-sm"
              }`}
            >
              <p
                className={`whitespace-pre-line text-xs leading-5 sm:text-sm ${
                  darkMode ? "text-slate-200" : "text-slate-700"
                }`}
              >
                {DEMO_A.slice(0, answered)}
              </p>

              {answered >= DEMO_A.length && (
                <div
                  className={`mt-3 inline-flex max-w-full items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] ${
                    darkMode
                      ? "bg-violet-500/15 text-violet-200"
                      : "bg-violet-50 text-violet-700"
                  }`}
                >
                  <FileText size={12} className="shrink-0" />
                  <span className="truncate">Source: Q3_Report.pdf (Page 3)</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div
        className={`mt-4 flex min-w-0 items-center gap-2 rounded-xl border px-3 py-2.5 ${
          darkMode ? "border-white/10 bg-white/[0.03]" : "border-slate-200 bg-white"
        }`}
      >
        <span className={`min-w-0 flex-1 truncate text-xs ${mutedText}`}>
          {phase === "typing" ? (
            <>
              <span className={darkMode ? "text-white" : "text-slate-800"}>
                {DEMO_Q.slice(0, typed)}
              </span>
              <span className="hm-caret ml-px inline-block h-3 w-px bg-violet-500 align-middle" />
            </>
          ) : (
            "Ask a question about your document..."
          )}
        </span>
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet-600 text-white">
          <ArrowRight size={14} />
        </div>
      </div>
    </div>
  );
}

function FeatureVisual({ type, darkMode }) {
  const chip = darkMode
    ? "bg-white/5 text-slate-200 border-white/10"
    : "bg-slate-50 text-slate-700 border-slate-200";

  if (type === "chat") {
    return (
      <div className="mt-6 space-y-2">
        <div className="ml-auto w-fit max-w-[80%] rounded-2xl rounded-br-sm bg-linear-to-r from-violet-600 to-indigo-600 px-3.5 py-2 text-xs text-white">
          Summarize chapter 2
        </div>
        <div className={`w-fit max-w-[85%] rounded-2xl rounded-bl-sm border px-3.5 py-2 text-xs ${chip}`}>
          Chapter 2 explains how the system retrieves relevant passages...
        </div>
      </div>
    );
  }

  if (type === "source") {
    return (
      <div className="mt-6 space-y-2">
        {["Report.pdf · Page 3", "Report.pdf · Page 7"].map((label) => (
          <div
            key={label}
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-[11px] ${chip}`}
          >
            <FileText size={13} className="text-red-400" />
            {label}
          </div>
        ))}
      </div>
    );
  }

  if (type === "summary") {
    return (
      <div className="mt-6 space-y-2.5">
        {["w-full", "w-5/6", "w-2/3"].map((w, i) => (
          <div
            key={w}
            className={`h-2.5 animate-pulse rounded-full bg-linear-to-r from-violet-500/60 to-fuchsia-500/40 ${w}`}
            style={{ animationDelay: `${i * 0.25}s` }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="mt-6 grid gap-2 sm:grid-cols-3">
      {["Resume.pdf", "Guide.pdf", "Notes.pdf"].map((name) => (
        <div
          key={name}
          className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-[11px] ${chip}`}
        >
          <FileText size={14} className="shrink-0 text-red-400" />
          <span className="truncate">{name}</span>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function Home() {
  const { isDark: darkMode, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const progressRef = useRef(null);
  const [stepsRef, stepsInView] = useInView(0.3);

  useEffect(() => {
    function onScroll() {
      const el = document.documentElement;
      const max = Math.max(1, el.scrollHeight - el.clientHeight);
      if (progressRef.current) {
        progressRef.current.style.transform = `scaleX(${el.scrollTop / max})`;
      }
      setScrolled(el.scrollTop > 12);
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function closeMobileMenu() {
    setMobileMenuOpen(false);
  }

  const page = darkMode
    ? "bg-[#080619] text-white"
    : "bg-slate-50 text-slate-900";

  const navSurface = darkMode
    ? "border-white/10 bg-[#100d27]/80"
    : "border-violet-100 bg-white/85";

  const mutedText = darkMode ? "text-slate-300" : "text-slate-600";

  const secondaryButton = darkMode
    ? "border-white/15 bg-white/[0.04] text-white hover:bg-white/10"
    : "border-slate-200 bg-white text-slate-700 hover:border-violet-200 hover:bg-violet-50";

  const primaryButton =
    "hm-btn group inline-flex items-center justify-center gap-2 rounded-xl bg-linear-to-r from-violet-600 via-indigo-600 to-fuchsia-500 text-white shadow-lg shadow-violet-500/30 transition hover:-translate-y-0.5 hover:shadow-violet-500/50";

  return (
    <main
      id="top"
      className={`home-page min-h-dvh overflow-x-clip transition-colors duration-500 ${page}`}
    >
      <style>{`
        html { scroll-behavior: smooth; }

        @keyframes hm-aurora {
          0%, 100% { transform: translate3d(0,0,0) scale(1); }
          33% { transform: translate3d(6%,-8%,0) scale(1.15); }
          66% { transform: translate3d(-5%,6%,0) scale(.95); }
        }
        @keyframes hm-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }
        @keyframes hm-shift { to { background-position: 200% center; } }
        @keyframes hm-marquee { to { transform: translateX(-50%); } }
        @keyframes hm-bubble {
  0%   { transform: translate3d(0, 0, 0) scale(.8); opacity: 0; }
  10%  { opacity: 1; }
  50%  { transform: translate3d(var(--sway), -60vh, 0) scale(1); }
  90%  { opacity: 1; }
  100% { transform: translate3d(calc(var(--sway) * -1), -125vh, 0) scale(1.1); opacity: 0; }
}
@keyframes hm-twinkle {
  0%, 100% { opacity: .15; transform: scale(.6); }
  50%      { opacity: 1;   transform: scale(1.4); }
}
        @keyframes hm-blink { 50% { opacity: 0; } }
        @keyframes hm-scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(420%); }
        }
        @keyframes hm-dots {
          0%, 80%, 100% { transform: scale(.6); opacity: .4; }
          40% { transform: scale(1); opacity: 1; }
        }
        @keyframes hm-menu {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .hm-aurora { animation: hm-aurora 18s ease-in-out infinite; }
        .hm-float { animation: hm-float 6s ease-in-out infinite; }
        .hm-float-delayed { animation: hm-float 7s ease-in-out 1.2s infinite; }
        .hm-bubble  { position: absolute; bottom: -140px; animation: hm-bubble linear infinite; will-change: transform; }
.hm-twinkle { animation: hm-twinkle 3.6s ease-in-out infinite; }
        .hm-caret { animation: hm-blink 1s steps(1) infinite; }
        .hm-scan { animation: hm-scan 3.2s ease-in-out infinite; }
        .hm-dot { animation: hm-dots 1.1s ease-in-out infinite; }
        .hm-menu { animation: hm-menu .2s ease-out; }
        .hm-marquee { animation: hm-marquee 30s linear infinite; width: max-content; }
        .hm-marquee-wrap:hover .hm-marquee { animation-play-state: paused; }

        .hm-gradient-text {
          background-image: linear-gradient(90deg, #8b5cf6, #6366f1, #d946ef, #8b5cf6);
          background-size: 200% auto;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          animation: hm-shift 6s linear infinite;
        }

        .hm-btn { position: relative; overflow: hidden; }
        .hm-btn::after {
          content: "";
          position: absolute;
          top: -50%;
          left: -60%;
          width: 40%;
          height: 200%;
          transform: rotate(20deg);
          background: rgba(255,255,255,.28);
          transition: left .7s ease;
          pointer-events: none;
        }
        .hm-btn:hover::after { left: 130%; }

        @media (prefers-reduced-motion: reduce) {
          html { scroll-behavior: auto; }
          .hm-aurora, .hm-float, .hm-float-delayed, .hm-bubble, .hm-caret,
          .hm-scan, .hm-dot, .hm-menu, .hm-marquee, .hm-gradient-text {
            animation: none !important;
          },
          .hm-bubble { animation: none !important; opacity: .6; bottom: var(--rest) !important; }
        }
      `}</style>

      {/* Scroll progress */}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-0.5">
        <div
          ref={progressRef}
          className="h-full origin-left bg-linear-to-r from-violet-500 via-fuchsia-500 to-indigo-500"
          style={{ transform: "scaleX(0)" }}
        />
      </div>

      {/* Background effects */}
      {/* Background effects */}
<div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
  {/* grid */}
  <div
    className="absolute inset-0"
    style={{
      opacity: darkMode ? 0.9 : 0.8,
      backgroundImage: darkMode
        ? "linear-gradient(rgba(167,139,250,.16) 1px, transparent 1px), linear-gradient(90deg, rgba(167,139,250,.16) 1px, transparent 1px)"
        : "linear-gradient(rgba(124,58,237,.13) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,.13) 1px, transparent 1px)",
      backgroundSize: "48px 48px",
      maskImage: "radial-gradient(ellipse at top, black 30%, transparent 80%)",
      WebkitMaskImage:
        "radial-gradient(ellipse at top, black 30%, transparent 80%)",
    }}
  />

  {/* aurora blobs: less blur, more color */}
  <div
    className={`hm-aurora absolute -left-32 top-10 h-[28rem] w-[28rem] rounded-full blur-[80px] ${
      darkMode ? "bg-violet-600/50" : "bg-violet-400/55"
    }`}
  />
  <div
    className={`hm-aurora absolute -right-32 top-[26rem] h-[28rem] w-[28rem] rounded-full blur-[90px] ${
      darkMode ? "bg-fuchsia-500/40" : "bg-fuchsia-300/60"
    }`}
    style={{ animationDelay: "-6s" }}
  />
  <div
    className={`hm-aurora absolute left-1/3 top-[56rem] h-[26rem] w-[26rem] rounded-full blur-[85px] ${
      darkMode ? "bg-indigo-500/45" : "bg-sky-300/60"
    }`}
    style={{ animationDelay: "-12s" }}
  />
  <div
    className={`hm-aurora absolute -left-24 top-[90rem] h-[24rem] w-[24rem] rounded-full blur-[85px] ${
      darkMode ? "bg-purple-500/35" : "bg-indigo-300/55"
    }`}
    style={{ animationDelay: "-3s" }}
  />

  {/* glass bubbles */}
  {BUBBLES.map((b, i) => (
    <span
      key={i}
      className="hm-bubble rounded-full"
      style={{
        left: b.left,
        width: b.size,
        height: b.size,
        animationDelay: b.delay,
        animationDuration: b.dur,
        "--sway": b.sway,
        "--rest": b.rest,
        border: darkMode
          ? "1px solid rgba(196,181,253,.5)"
          : "1px solid rgba(124,58,237,.45)",
        background: darkMode
          ? "radial-gradient(circle at 30% 28%, rgba(255,255,255,.38), rgba(167,139,250,.24) 45%, rgba(139,92,246,.08) 72%)"
          : "radial-gradient(circle at 30% 28%, rgba(255,255,255,.95), rgba(167,139,250,.38) 50%, rgba(99,102,241,.18) 78%)",
        boxShadow: darkMode
          ? "0 0 26px rgba(139,92,246,.4), inset 0 0 16px rgba(196,181,253,.28)"
          : "0 10px 26px rgba(139,92,246,.28), inset 0 0 14px rgba(255,255,255,.8)",
      }}
    />
  ))}

  {/* twinkling sparks */}
  {SPARKS.map((s, i) => (
    <span
      key={i}
      className={`hm-twinkle absolute h-1.5 w-1.5 rounded-full ${
        darkMode
          ? "bg-violet-200 shadow-[0_0_10px_#c4b5fd]"
          : "bg-violet-500 shadow-[0_0_8px_#8b5cf6]"
      }`}
      style={{ left: s.left, top: s.top, animationDelay: s.delay }}
    />
  ))}
</div>

      {/* Navbar */}
      <header className="sticky top-0 z-50 px-4 pt-4 sm:px-6 lg:px-10">
        <nav
          className={`mx-auto flex max-w-7xl items-center justify-between rounded-2xl border px-3 py-2.5 backdrop-blur-xl transition-all duration-300 sm:px-5 ${navSurface} ${
            scrolled
              ? darkMode
                ? "shadow-xl shadow-violet-950/50"
                : "shadow-xl shadow-violet-200/60"
              : "shadow-sm"
          }`}
        >
          <Link
            to="/"
            className="flex min-w-0 items-center gap-3"
            aria-label="Doc Intellect AI home"
            onClick={closeMobileMenu}
          >
            <Logo size={34} showText={false} />
            <span className="truncate text-base font-bold tracking-tight sm:text-lg">
              Doc Intellect <span className="text-violet-500">AI</span>
            </span>
          </Link>

          <div className="hidden items-center gap-7 lg:flex">
            {NAV.map(([label, href]) => (
              <a
                key={href}
                href={href}
                className={`text-sm transition hover:text-violet-500 ${mutedText}`}
              >
                {label}
              </a>
            ))}
          </div>

          <div className="hidden items-center gap-3 sm:flex">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
              title={darkMode ? "Light mode" : "Dark mode"}
              className={`flex h-10 w-10 items-center justify-center rounded-xl border transition ${secondaryButton}`}
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <Link
              to="/login"
              className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${secondaryButton}`}
            >
              Sign In
            </Link>

            <Link to="/register" className={`${primaryButton} px-4 py-2.5 text-sm font-semibold`}>
              Get Started
              <ArrowRight
                size={16}
                className="transition group-hover:translate-x-0.5"
              />
            </Link>
          </div>

          <div className="flex items-center gap-2 sm:hidden">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
              className={`flex h-10 w-10 items-center justify-center rounded-xl border ${secondaryButton}`}
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((value) => !value)}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              className={`flex h-10 w-10 items-center justify-center rounded-xl border ${secondaryButton}`}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </nav>

        {mobileMenuOpen && (
          <div
            className={`hm-menu absolute left-4 right-4 top-[calc(100%+8px)] z-50 rounded-2xl border p-4 shadow-xl backdrop-blur-xl sm:hidden ${
              darkMode
                ? "border-white/10 bg-[#100d27]"
                : "border-violet-100 bg-white"
            }`}
          >
            <div className="flex flex-col gap-1">
              {NAV.map(([label, href]) => (
                <a
                  key={href}
                  href={href}
                  onClick={closeMobileMenu}
                  className="rounded-lg px-3 py-3 text-sm hover:bg-violet-500/10"
                >
                  {label}
                </a>
              ))}

              <div className="my-2 h-px bg-slate-200/20" />

              <Link
                to="/login"
                onClick={closeMobileMenu}
                className="rounded-lg px-3 py-3 text-sm font-semibold hover:bg-violet-500/10"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                onClick={closeMobileMenu}
                className="rounded-xl bg-linear-to-r from-violet-600 to-fuchsia-500 px-3 py-3 text-center text-sm font-semibold text-white"
              >
                Get Started Free
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="relative z-10 px-4 pb-10 pt-14 sm:px-6 sm:pt-20 lg:px-10 lg:pt-24">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-5xl text-center">
            <Reveal>
              <div
                className={`mb-6 inline-flex items-center gap-2.5 rounded-full border px-3.5 py-2 text-xs font-medium sm:text-sm ${
                  darkMode
                    ? "border-violet-400/30 bg-violet-500/10 text-violet-200 shadow-[0_0_25px_rgba(139,92,246,.18)]"
                    : "border-violet-200 bg-white text-violet-700 shadow-sm"
                }`}
              >
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400 opacity-75 motion-reduce:animate-none" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-violet-500" />
                </span>
                Your AI-powered document assistant
              </div>
            </Reveal>

            <Reveal delay={100}>
              <h1
                className={`text-balance text-[2.6rem] font-extrabold leading-[1.08] tracking-tight sm:text-7xl lg:text-8xl ${
                  darkMode ? "text-white" : "text-slate-950"
                }`}
              >
                Your documents.
                <br />
                <span className="hm-gradient-text">Understood by AI.</span>
              </h1>
            </Reveal>

            <Reveal delay={200}>
              <div className="mt-6 flex flex-col items-center gap-1 text-xl font-semibold sm:flex-row sm:justify-center sm:gap-3 sm:text-3xl">
                <span className={darkMode ? "text-slate-200" : "text-slate-700"}>
                  Ask anything about your
                </span>
                <RotatingWord />
              </div>
            </Reveal>

            <Reveal delay={300}>
              <p
                className={`mx-auto mt-5 max-w-2xl text-base leading-7 sm:text-lg sm:leading-8 ${mutedText}`}
              >
                Upload PDFs, ask questions, and get clear answers grounded in
                your documents. Spend less time searching and more time
                understanding.
              </p>
            </Reveal>

            <Reveal delay={400}>
              <div className="mt-9 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
                <Link
                  to="/register"
                  className={`${primaryButton} px-7 py-4 text-sm font-semibold sm:text-base`}
                >
                  Get Started Free
                  <ArrowRight
                    size={18}
                    className="transition group-hover:translate-x-1"
                  />
                </Link>

                <a
                  href="#preview"
                  className={`inline-flex items-center justify-center gap-2 rounded-xl border px-7 py-4 text-sm font-semibold transition sm:text-base ${secondaryButton}`}
                >
                  <Sparkles size={17} />
                  Watch it in action
                </a>
              </div>

              <div
                className={`mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs ${mutedText}`}
              >
                {[
                  "PDF-focused workspace",
                  "Ask in natural language",
                  "Source-grounded answers",
                ].map((item) => (
                  <span key={item} className="inline-flex items-center gap-1.5">
                    <Check size={14} className="text-violet-500" />
                    {item}
                  </span>
                ))}
              </div>
            </Reveal>
          </div>

          {/* Product preview */}
          <Reveal delay={150} className="mx-auto mt-16 max-w-6xl sm:mt-20">
            <div id="preview" className="relative scroll-mt-28">
              {darkMode && (
                <div className="pointer-events-none absolute -inset-x-10 bottom-0 top-10 rounded-[3rem] bg-violet-600/25 blur-[90px]" />
              )}

              {/* floating badges (large screens) */}
              <div
                className={`hm-float absolute -left-4 top-24 z-20 hidden items-center gap-3 rounded-2xl border px-4 py-3 shadow-2xl lg:flex ${
                  darkMode
                    ? "border-violet-300/20 bg-[#17132f] shadow-violet-950/60"
                    : "border-violet-100 bg-white shadow-violet-200/60"
                }`}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/15 text-violet-500">
                  <CloudUpload size={20} />
                </div>
                <div>
                  <p className="text-sm font-semibold">PDF uploaded</p>
                  <p className={`text-xs ${mutedText}`}>Ready to explore</p>
                </div>
              </div>

              <div
                className={`hm-float-delayed absolute -right-4 bottom-24 z-20 hidden items-center gap-3 rounded-2xl border px-4 py-3 shadow-2xl lg:flex ${
                  darkMode
                    ? "border-emerald-300/20 bg-[#17132f] shadow-emerald-950/40"
                    : "border-emerald-100 bg-white shadow-emerald-100"
                }`}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-500">
                  <Check size={20} />
                </div>
                <div>
                  <p className="text-sm font-semibold">Answer grounded</p>
                  <p className={`text-xs ${mutedText}`}>Source included</p>
                </div>
              </div>

              <Tilt>
                <div
                  className={`relative overflow-hidden rounded-2xl border p-2 shadow-2xl sm:rounded-3xl sm:p-3 ${
                    darkMode
                      ? "border-violet-300/20 bg-[#17132f]/90 shadow-violet-950/50"
                      : "border-violet-100 bg-white shadow-violet-200/70"
                  }`}
                >
                  <div
                    className={`overflow-hidden rounded-xl border sm:rounded-2xl ${
                      darkMode
                        ? "border-white/10 bg-[#0e0c20]"
                        : "border-slate-200 bg-slate-50"
                    }`}
                  >
                    {/* window bar */}
                    <div
                      className={`flex h-12 items-center justify-between border-b px-3 sm:px-5 ${
                        darkMode
                          ? "border-white/10 bg-[#17132f]"
                          : "border-slate-200 bg-white"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#1a1a45] ring-1 ring-violet-400/40">
                          <LogoMark size={19} />
                        </div>
                        <span className="text-xs font-semibold sm:text-sm">
                          Doc Intellect AI
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-red-400" />
                        <span className="h-2 w-2 rounded-full bg-amber-400" />
                        <span className="h-2 w-2 rounded-full bg-emerald-400" />
                      </div>
                    </div>

                    <div className="grid min-w-0 grid-cols-1 md:grid-cols-[0.9fr_1.1fr]">
                      {/* Document pane */}
                      <div
                        className={`hidden min-w-0 border-r p-5 md:block ${
                          darkMode
                            ? "border-white/10 bg-[#121027]"
                            : "border-slate-200 bg-slate-100/70"
                        }`}
                      >
                        <div className="mb-4 flex items-center gap-2 text-xs font-semibold">
                          <FileText size={15} className="text-red-400" />
                          Q3_Report.pdf
                        </div>

                        <div className="relative mx-auto max-w-sm overflow-hidden rounded-xl bg-white p-6 shadow-md">
                          <div className="hm-scan pointer-events-none absolute inset-x-0 top-0 h-10 bg-linear-to-b from-transparent via-violet-400/30 to-transparent" />

                          <div className="h-2.5 w-24 rounded-full bg-violet-300" />
                          <div className="mt-3 h-4 w-3/4 rounded-md bg-slate-800" />

                          <div className="mt-5 space-y-2">
                            <div className="h-2 w-full rounded-full bg-slate-200" />
                            <div className="h-2 w-11/12 rounded-full bg-slate-200" />
                            <div className="h-2 w-4/5 rounded-full bg-slate-200" />
                          </div>

                          <div className="mt-5 space-y-2">
                            <div className="h-2.5 w-full animate-pulse rounded-full bg-violet-200 motion-reduce:animate-none" />
                            <div className="h-2.5 w-5/6 animate-pulse rounded-full bg-violet-200 motion-reduce:animate-none" />
                          </div>

                          <div className="mt-5 space-y-2">
                            <div className="h-2 w-full rounded-full bg-slate-200" />
                            <div className="h-2 w-10/12 rounded-full bg-slate-200" />
                            <div className="h-2 w-2/3 rounded-full bg-slate-200" />
                          </div>

                          <p className="mt-5 text-center text-[10px] text-slate-400">
                            Sample document · Page 3
                          </p>
                        </div>
                      </div>

                      <ChatDemo darkMode={darkMode} mutedText={mutedText} />
                    </div>
                  </div>
                </div>
              </Tilt>

              <p className={`mt-4 text-center text-xs ${mutedText}`}>
                Sample conversation for illustration.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Marquee */}
      <section className="relative z-10 py-10">
        <div
          className={`hm-marquee-wrap overflow-hidden border-y py-4 ${
            darkMode ? "border-white/10 bg-white/[0.02]" : "border-slate-200 bg-white/60"
          }`}
          style={{
            maskImage:
              "linear-gradient(90deg, transparent, black 12%, black 88%, transparent)",
            WebkitMaskImage:
              "linear-gradient(90deg, transparent, black 12%, black 88%, transparent)",
          }}
        >
          <div className="hm-marquee flex items-center">
            {[...MARQUEE, ...MARQUEE].map((item, i) => (
              <span
                key={i}
                className={`flex shrink-0 items-center gap-6 pr-6 text-sm font-semibold sm:text-base ${mutedText}`}
              >
                {item}
                <Sparkles size={16} className="text-violet-500" />
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="relative z-10 px-4 py-10 sm:px-6 lg:px-10">
        <div className="mx-auto grid max-w-5xl gap-4 sm:grid-cols-3">
          {STATS.map((stat, i) => (
            <Reveal key={stat.label} delay={i * 120}>
              <div
                className={`rounded-3xl border p-6 text-center ${
                  darkMode
                    ? "border-white/10 bg-white/[0.04]"
                    : "border-slate-200 bg-white shadow-sm"
                }`}
              >
                <p className="hm-gradient-text text-5xl font-extrabold tracking-tight sm:text-6xl">
                  <CountUp to={stat.to} suffix={stat.suffix} />
                </p>
                <p className={`mt-2 text-sm ${mutedText}`}>{stat.label}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Features */}
      <section
        id="features"
        className="relative z-10 scroll-mt-24 px-4 py-16 sm:px-6 sm:py-24 lg:px-10"
      >
        <div className="mx-auto max-w-7xl">
          <Reveal className="mx-auto mb-10 max-w-2xl text-center sm:mb-14">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-violet-500">
              Built for understanding
            </p>
            <h2 className="text-3xl font-bold tracking-tight sm:text-5xl">
              Make every PDF{" "}
              <span className="hm-gradient-text">more useful</span>
            </h2>
            <p className={`mt-4 text-sm leading-6 sm:text-base ${mutedText}`}>
              The tools you need to turn lengthy documents into information you
              can actually use.
            </p>
          </Reveal>

          <div className="grid gap-4 md:grid-cols-6">
            {FEATURES.map(({ icon: Icon, title, description, span, visual }, i) => (
              <Reveal key={title} delay={(i % 2) * 120} className={span}>
                <SpotlightCard darkMode={darkMode}>
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-violet-500/20 to-fuchsia-500/20 text-violet-500 transition group-hover:scale-110">
                    <Icon size={22} />
                  </div>
                  <h3 className="text-lg font-semibold">{title}</h3>
                  <p className={`mt-2 text-sm leading-6 ${mutedText}`}>
                    {description}
                  </p>
                  <FeatureVisual type={visual} darkMode={darkMode} />
                </SpotlightCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section
        id="how-it-works"
        className="relative z-10 scroll-mt-24 px-4 py-16 sm:px-6 sm:py-24 lg:px-10"
      >
        <Reveal>
          <div
            className={`mx-auto max-w-7xl rounded-3xl border p-6 sm:p-10 lg:p-14 ${
              darkMode
                ? "border-violet-300/15 bg-linear-to-br from-violet-950/40 via-[#100d25] to-fuchsia-950/20"
                : "border-violet-100 bg-linear-to-br from-violet-50 via-white to-indigo-50"
            }`}
          >
            <div className="mx-auto max-w-2xl text-center">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-violet-500">
                Simple workflow
              </p>
              <h2 className="text-3xl font-bold tracking-tight sm:text-5xl">
                From PDF to insight in{" "}
                <span className="hm-gradient-text">three steps</span>
              </h2>
            </div>

            <div ref={stepsRef} className="relative mt-12 grid gap-10 md:grid-cols-3 md:gap-6">
              {/* connecting lines */}
              <div
                className={`absolute bottom-6 left-6 top-6 w-px origin-top transition-transform duration-[1600ms] ease-out md:hidden ${
                  stepsInView ? "scale-y-100" : "scale-y-0"
                } ${darkMode ? "bg-violet-400/30" : "bg-violet-300"}`}
              />
              <div
                className={`absolute left-[16.66%] right-[16.66%] top-6 hidden h-px origin-left transition-transform duration-[1600ms] ease-out md:block ${
                  stepsInView ? "scale-x-100" : "scale-x-0"
                } ${darkMode ? "bg-violet-400/30" : "bg-violet-300"}`}
              />

              {STEPS.map(({ icon: Icon, title, description }, index) => (
                <div
                  key={title}
                  className="relative flex gap-5 md:flex-col md:items-center md:text-center"
                >
                  <div className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-violet-600 to-fuchsia-500 text-white shadow-lg shadow-violet-500/30">
                    <Icon size={22} />
                    <span
                      className={`absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                        darkMode
                          ? "bg-[#100d25] text-violet-200 ring-1 ring-violet-400/40"
                          : "bg-white text-violet-700 ring-1 ring-violet-200"
                      }`}
                    >
                      {index + 1}
                    </span>
                  </div>

                  <div className="md:mt-5">
                    <h3 className="text-lg font-semibold">{title}</h3>
                    <p className={`mt-1.5 max-w-xs text-sm leading-6 ${mutedText}`}>
                      {description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </section>

      {/* CTA */}
      <section className="relative z-10 px-4 py-16 sm:px-6 sm:py-24 lg:px-10">
        <Reveal>
          <div className="relative mx-auto max-w-5xl overflow-hidden rounded-[2rem] p-[2px]">
            <span className="absolute -inset-full animate-[spin_8s_linear_infinite] bg-[conic-gradient(from_0deg,transparent_0%,#8b5cf6_20%,transparent_40%,#d946ef_65%,transparent_85%)] motion-reduce:animate-none" />

            <div
              className={`relative overflow-hidden rounded-[calc(2rem-2px)] px-6 py-14 text-center sm:px-12 sm:py-20 ${
                darkMode ? "bg-[#0d0a24]" : "bg-white"
              }`}
            >
              <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-violet-600/25 blur-[90px]" />
              <div className="pointer-events-none absolute -bottom-24 -right-16 h-64 w-64 rounded-full bg-fuchsia-500/20 blur-[90px]" />

              <div className="relative">
                <div className="relative mx-auto mb-8 h-32 w-32">
                  <div className="absolute inset-0 animate-[spin_14s_linear_infinite] rounded-full border border-dashed border-violet-400/50 motion-reduce:animate-none">
                    <span className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-violet-400 shadow-[0_0_12px_#a78bfa]" />
                  </div>
                  <div className="absolute -inset-4 animate-[spin_22s_linear_infinite_reverse] rounded-full border border-violet-400/25 motion-reduce:animate-none">
                    <span className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-fuchsia-400 shadow-[0_0_12px_#e879f9]" />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Logo size={58} showText={false} />
                  </div>
                </div>

                <h2 className="text-3xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
                  Turn your PDFs into
                  <span className="hm-gradient-text block">
                    answers that matter.
                  </span>
                </h2>

                <p className={`mx-auto mt-5 max-w-xl text-sm leading-6 sm:text-base ${mutedText}`}>
                  Start exploring your documents with an AI assistant designed
                  to help you understand what you read.
                </p>

                <div className="mt-9 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
                  <Link
                    to="/register"
                    className={`${primaryButton} px-8 py-4 text-sm font-semibold sm:text-base`}
                  >
                    Create your account
                    <ArrowRight
                      size={18}
                      className="transition group-hover:translate-x-1"
                    />
                  </Link>
                  <Link
                    to="/login"
                    className={`inline-flex items-center justify-center rounded-xl border px-8 py-4 text-sm font-semibold transition sm:text-base ${secondaryButton}`}
                  >
                    I already have an account
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Footer */}
      <footer
        className={`relative z-10 border-t px-4 py-8 sm:px-6 lg:px-10 ${
          darkMode ? "border-white/10" : "border-slate-200"
        }`}
      >
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 sm:flex-row">
          <Link to="/" className="flex items-center gap-3">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                darkMode ? "bg-violet-500/15" : "bg-violet-100"
              }`}
            >
              <LogoMark size={34} />
            </div>
            <span className="whitespace-nowrap text-base font-bold">
              Doc Intellect <span className="text-violet-500">AI</span>
            </span>
          </Link>

          <p className={`text-center text-sm ${mutedText}`}>
            Your AI-powered document assistant.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs">
            {NAV.map(([label, href]) => (
              <a key={href} href={href} className="transition hover:text-violet-500">
                {label}
              </a>
            ))}
            <a href="#top" className="transition hover:text-violet-500">
              Back to top ↑
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}