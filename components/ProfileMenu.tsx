"use client";

import Image from "next/image";
import { ChevronDown, LogOut, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { AppSession } from "@/lib/gdrive/google-oauth";

interface ProfileMenuProps {
  user: AppSession;
  logoutAction: () => Promise<void>;
}

export default function ProfileMenu({ user, logoutAction }: ProfileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const displayName = user.name || user.email || "Google account";
  const initial = displayName.charAt(0).toUpperCase();

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
        className="group flex items-center gap-2 rounded-full border border-neutral-800/80 bg-neutral-950/90 px-2 py-1.5 text-sm text-white shadow-2xl shadow-black/30 backdrop-blur-xl transition hover:border-primary/40 hover:bg-neutral-900"
      >
        <span className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-neutral-700 bg-neutral-900">
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
        <ChevronDown
          className={`h-4 w-4 text-neutral-500 transition group-hover:text-primary ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 mt-3 w-72 overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950/95 shadow-2xl shadow-black/40 backdrop-blur-xl"
        >
          <div className="border-b border-neutral-800 p-4">
            <div className="flex items-center gap-3">
              <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-neutral-700 bg-neutral-900">
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
                <p className="truncate text-sm font-semibold text-white">
                  {displayName}
                </p>
                {user.email && (
                  <p className="truncate text-xs text-neutral-500">
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
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-300 transition hover:bg-red-500/10 hover:text-red-200"
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
