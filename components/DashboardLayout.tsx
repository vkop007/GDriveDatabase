"use client";

import { useState, useEffect } from "react";

interface DashboardLayoutWrapperProps {
  children: React.ReactNode;
}

export default function DashboardLayoutWrapper({
  children,
}: DashboardLayoutWrapperProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Sync with localStorage
  useEffect(() => {
    const checkCollapsed = () => {
      const saved = localStorage.getItem("sidebar-collapsed");
      if (saved) setIsCollapsed(JSON.parse(saved));
    };

    checkCollapsed();

    // Listen for storage changes from sidebar
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "sidebar-collapsed" && e.newValue) {
        setIsCollapsed(JSON.parse(e.newValue));
      }
    };

    // Also poll for changes (in case of same-tab updates)
    const interval = setInterval(checkCollapsed, 100);

    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("storage", handleStorage);
      clearInterval(interval);
    };
  }, []);

  return (
    <main
      className={`flex-1 h-screen overflow-y-auto transition-all duration-300 ease-out ${
        isCollapsed ? "md:ml-20" : "md:ml-68"
      }`}
    >
      {children}
    </main>
  );
}
