import { useEffect } from "react";
import {
  LayoutDashboard,
  Files,
  MessageSquare,
  Settings,
  LogOut,
  X,
} from "lucide-react";
import Logo from "./logo";


const navigation = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Documents", icon: Files },
  { label: "Chat", icon: MessageSquare },
  { label: "Settings", icon: Settings },
];

export default function Sidebar({ open, onClose, active, onNavigate }) {
  // close drawer with Escape
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <>
      {/* mobile overlay */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm transition-opacity lg:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-linear-to-b from-[#1b1b44] to-[#12122b] px-4 py-6 text-white shadow-2xl transition-transform duration-300 lg:static lg:w-64 lg:translate-x-0 lg:shadow-none ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* brand */}
        <div className="mb-10 flex items-center justify-between px-2">
  <Logo size={34} />
  <button
    onClick={onClose}
    aria-label="Close menu"
    className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white lg:hidden"
  >
    <X size={20} />
  </button>
</div>

        {/* navigation */}
        <nav className="flex-1 space-y-1.5">
          {navigation.map(({ label, icon: Icon }) => {
            const isActive = active === label;
            return (
              <button
                key={label}
                onClick={() => {
                  onNavigate(label);
                  onClose();
                }}
                className={`group relative flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                  isActive
                    ? "bg-linear-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-900/40"
                    : "text-slate-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                {isActive && (
                  <span className="absolute -left-4 h-6 w-1 rounded-r-full bg-violet-300" />
                )}
                <Icon
                  size={19}
                  className={isActive ? "" : "transition group-hover:scale-110"}
                />
                {label}
              </button>
            );
          })}
        </nav>

        {/* storage hint + logout */}
        <div className="mb-4 rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
          <p className="text-xs font-medium text-slate-300">Free plan</p>
          <p className="mt-1 text-xs text-slate-400">PDFs up to 10 MB each</p>
        </div>

        <button className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-300 transition hover:bg-red-500/10 hover:text-red-300">
          <LogOut size={19} />
          Logout
        </button>
      </aside>
    </>
  );
}