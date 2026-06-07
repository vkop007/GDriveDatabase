"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeProvider";

type ThemeToggleProps = {
  collapsed?: boolean;
};

export default function ThemeToggle({ collapsed = false }: ThemeToggleProps) {
  const { theme, setTheme, toggleTheme } = useTheme();

  if (collapsed) {
    const nextTheme = theme === "dark" ? "light" : "dark";
    const isDark = theme === "dark";

    return (
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={`Switch to ${nextTheme} theme`}
        title={`Switch to ${nextTheme} theme`}
        className="flex h-10 min-w-[4.5rem] items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold capitalize text-slate-700 shadow-sm transition hover:border-primary/40 hover:text-primary dark:border-neutral-800/80 dark:bg-neutral-950/90 dark:text-neutral-300 dark:hover:bg-neutral-900"
      >
        {isDark ? (
          <>
            <Moon className="h-4 w-4" />
            Dark
          </>
        ) : (
          <>
            <Sun className="h-4 w-4" />
            Light
          </>
        )}
      </button>
    );
  }

  return (
    <div
      className="grid grid-cols-2 gap-1 rounded-xl border border-slate-200 bg-slate-100 p-1 shadow-sm dark:border-neutral-800/80 dark:bg-neutral-950/90"
      aria-label="Theme mode"
    >
      <button
        type="button"
        onClick={() => setTheme("light")}
        className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition ${
          theme === "light"
            ? "bg-white text-slate-950 shadow-sm dark:bg-neutral-800 dark:text-white"
            : "text-slate-500 hover:text-slate-950 dark:text-neutral-500 dark:hover:text-white"
        }`}
      >
        <Sun className="h-3.5 w-3.5" />
        Light
      </button>
      <button
        type="button"
        onClick={() => setTheme("dark")}
        className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition ${
          theme === "dark"
            ? "bg-slate-950 text-white shadow-sm dark:bg-neutral-800"
            : "text-slate-500 hover:text-slate-950 dark:text-neutral-500 dark:hover:text-white"
        }`}
      >
        <Moon className="h-3.5 w-3.5" />
        Dark
      </button>
    </div>
  );
}
