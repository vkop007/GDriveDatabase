"use client";

import { useState, useEffect } from "react";

interface DashboardLayoutWrapperProps {
  children: React.ReactNode;
}

export default function DashboardLayoutWrapper({
  children,
}: DashboardLayoutWrapperProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const readCollapsed = () => {
      try {
        return JSON.parse(localStorage.getItem("sidebar-collapsed") ?? "false");
      } catch {
        return false;
      }
    };

    const syncCollapsed = () => setIsCollapsed(Boolean(readCollapsed()));
    syncCollapsed();

    const handleStorage = (e: StorageEvent) => {
      if (e.key === "sidebar-collapsed") syncCollapsed();
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("sidebar-collapsed-change", syncCollapsed);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("sidebar-collapsed-change", syncCollapsed);
    };
  }, []);

  // Update CSS variable for sidebar width
  useEffect(() => {
    const offset = isCollapsed ? "5rem" : "17rem"; // 20 (5rem) vs 68 (17rem)
    document.documentElement.style.setProperty("--sidebar-offset", offset);
  }, [isCollapsed]);

  return (
    <main
      className={`flex-1 h-screen overflow-y-auto bg-slate-50 text-slate-950 transition-all duration-300 ease-out dark:bg-neutral-950 dark:text-white ${
        isCollapsed ? "md:ml-20" : "md:ml-68"
      }`}
    >
      {children}
    </main>
  );
}
