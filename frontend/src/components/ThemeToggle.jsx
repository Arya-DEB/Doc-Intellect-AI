import useTheme from "../context/useTheme";

export default function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="rounded-lg border px-3 py-2"
    >
      {isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
    </button>
  );
}