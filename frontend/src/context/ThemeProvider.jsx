import { useEffect, useState } from "react";
import ThemeContext from "./ThemeContext";

const STORAGE_KEY = "docIntellectTheme";

function getInitialTheme() {
  try {
    const savedTheme = localStorage.getItem(STORAGE_KEY);

    // Dark mode is the default.
    return savedTheme === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

export default function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    const root = document.documentElement;

    root.classList.toggle("dark", theme === "dark");

    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Theme still works for the current session.
    }
  }, [theme]);

  function toggleTheme() {
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  }

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDark: theme === "dark",
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}