"use client";

import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = "max-w-md",
}: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        ref={overlayRef}
        className="absolute inset-0 bg-slate-950/30 backdrop-blur-md dark:bg-black/70"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div className={`relative w-full ${maxWidth} max-h-[calc(100vh-2rem)] animate-slide-up`}>
        {/* Outer glow */}
        <div className="absolute -inset-1 rounded-[20px] bg-primary/10 opacity-60 blur-xl dark:hidden" />

        {/* Modal */}
        <div className="relative flex max-h-[calc(100vh-2rem)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/20 backdrop-blur-xl dark:border-neutral-800 dark:bg-neutral-950 dark:shadow-black/40">
          {/* Corner glows */}
          <div className="pointer-events-none absolute right-0 top-0 h-40 w-40 rounded-full bg-primary/10 blur-[60px] dark:hidden" />
          <div className="pointer-events-none absolute bottom-0 left-0 h-32 w-32 rounded-full bg-purple-500/5 blur-[50px] dark:hidden" />

          {/* Header */}
          <div className="relative flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-4 dark:border-neutral-800/80 sm:px-6 sm:py-5">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 rounded-xl bg-primary/30 blur-md dark:hidden" />
                <div className="relative w-10 h-10 rounded-xl border border-primary/25 bg-primary flex items-center justify-center shadow-sm shadow-primary/10 dark:bg-neutral-950 dark:shadow-none">
                  <div className="w-2.5 h-2.5 rounded-full bg-white shadow-md" />
                </div>
              </div>
              <h2 className="text-lg font-semibold text-slate-950 dark:text-white sm:text-xl">
                {title}
              </h2>
            </div>
            <button
              onClick={onClose}
              aria-label="Close modal"
              className="rounded-lg p-2 text-slate-400 transition-all duration-200 hover:bg-slate-100 hover:text-slate-950 dark:text-neutral-400 dark:hover:bg-neutral-800/80 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="relative overflow-y-auto p-4 sm:p-6">{children}</div>
        </div>
      </div>
    </div>,
    document.body
  );
}
