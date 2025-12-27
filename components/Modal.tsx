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

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        ref={overlayRef}
        className="absolute inset-0 bg-black/70 backdrop-blur-md"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div className={`relative w-full ${maxWidth} animate-slide-up`}>
        {/* Outer glow */}
        <div className="absolute -inset-1 bg-linear-to-r from-primary/30 via-purple-500/20 to-primary/30 rounded-[20px] blur-xl opacity-60" />

        {/* Modal */}
        <div className="relative overflow-hidden rounded-2xl border border-neutral-700/60 bg-neutral-900/95 shadow-2xl backdrop-blur-xl">
          {/* Corner glows */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-primary/15 blur-[60px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 blur-[50px] rounded-full pointer-events-none" />

          {/* Header */}
          <div className="relative flex items-center justify-between px-6 py-5 border-b border-neutral-800/80">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 rounded-xl bg-primary/30 blur-md" />
                <div className="relative w-10 h-10 rounded-xl bg-linear-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/20">
                  <div className="w-2.5 h-2.5 rounded-full bg-white shadow-md" />
                </div>
              </div>
              <h2 className="text-xl font-semibold text-white">{title}</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800/80 transition-all duration-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="relative p-6">{children}</div>
        </div>
      </div>
    </div>,
    document.body
  );
}
