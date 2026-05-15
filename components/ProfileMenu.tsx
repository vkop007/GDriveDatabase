"use client";

import Image from "next/image";
import { ChevronDown, LogOut, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { AppSession } from "@/lib/gdrive/google-oauth";

interface ProfileMenuProps {
  user: AppSession;
  logoutAction: () => Promise<void>;
  variant?: "floating" | "sidebar";
  collapsed?: boolean;
}

export default function ProfileMenu({
  user,
  logoutAction,
  variant = "floating",
  collapsed = false,
}: ProfileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const displayName = user.name || user.email || "Google account";
  const initial = displayName.charAt(0).toUpperCase();
  const isSidebar = variant === "sidebar";

  const buttonClassName = isSidebar
    ? collapsed
      ? "group flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-900 shadow-sm backdrop-blur-xl transition hover:border-primary/40 hover:text-primary dark:border-neutral-800/80 dark:bg-neutral-950/90 dark:text-white dark:shadow-xl dark:shadow-black/25 dark:hover:bg-neutral-900"
      : "group flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-sm text-slate-900 shadow-sm backdrop-blur-xl transition hover:border-primary/40 dark:border-neutral-800/80 dark:bg-neutral-950/90 dark:text-white dark:shadow-xl dark:shadow-black/25 dark:hover:bg-neutral-900"
    : "group flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-900 shadow-xl shadow-slate-900/10 backdrop-blur-xl transition hover:border-primary/40 dark:border-neutral-800/80 dark:bg-neutral-950/90 dark:text-white dark:shadow-2xl dark:shadow-black/30 dark:hover:bg-neutral-900";

  const menuClassName = isSidebar
    ? "absolute bottom-full left-0 mb-3 w-72 overflow-hidden rounded-2xl border border-slate-200 bg-white/95 shadow-2xl shadow-slate-900/15 backdrop-blur-xl dark:border-neutral-800 dark:bg-neutral-950/95 dark:shadow-black/40"
    : "absolute right-0 mt-3 w-72 overflow-hidden rounded-2xl border border-slate-200 bg-white/95 shadow-2xl shadow-slate-900/15 backdrop-blur-xl dark:border-neutral-800 dark:bg-neutral-950/95 dark:shadow-black/40";

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        aria-label="Open account menu"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className={buttonClassName}
      >
        <span className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-100 dark:border-neutral-700 dark:bg-neutral-900">
          {user.picture ? (
            <Image
              src={user.picture}
              alt={displayName}
              fill
              sizes="36px"
              className="object-cover"
            />
          ) : (
            <span className="text-sm font-semibold text-primary">
              {initial}
            </span>
          )}
        </span>
        {isSidebar && !collapsed && (
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-slate-950 dark:text-white">
              {displayName}
            </span>
          </span>
        )}
        {!collapsed && (
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-slate-400 transition group-hover:text-primary dark:text-neutral-500 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        )}
      </button>

      {isOpen && (
        <div
          role="menu"
          className={menuClassName}
        >
          <div className="border-b border-slate-200 p-4 dark:border-neutral-800">
            <div className="flex items-center gap-3">
              <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-100 dark:border-neutral-700 dark:bg-neutral-900">
                {user.picture ? (
                  <Image
                    src={user.picture}
                    alt={displayName}
                    fill
                    sizes="44px"
                    className="object-cover"
                  />
                ) : (
                  <User className="h-5 w-5 text-primary" />
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-950 dark:text-white">
                  {displayName}
                </p>
                {user.email && (
                  <p className="truncate text-xs text-slate-500 dark:text-neutral-500">
                    {user.email}
                  </p>
                )}
              </div>
            </div>
          </div>

          <form action={logoutAction} className="p-2">
            <button
              type="submit"
              role="menuitem"
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50 hover:text-red-700 dark:text-red-300 dark:hover:bg-red-500/10 dark:hover:text-red-200"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
