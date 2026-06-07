"use client";

import { useEffect, ReactNode } from "react";
import { createPortal } from "react-dom";
import { X, AlertTriangle, Trash2 } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "default";
  isLoading?: boolean;
  icon?: ReactNode;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  isLoading = false,
  icon,
}: ConfirmModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isLoading) onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose, isLoading]);

  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case "danger":
        return {
          iconBg: "bg-red-600",
          iconBorder: "border-red-500/40",
          iconShadow: "shadow-red-500/10 dark:shadow-none",
          iconColor: "text-white",
          buttonBg: "bg-red-600 hover:bg-red-500",
          buttonShadow: "shadow-sm shadow-red-500/10 dark:shadow-none",
          glowPrimary: "bg-red-500/20",
          glowSecondary: "bg-red-600/10",
          accentBorder: "border-red-500/20",
        };
      case "warning":
        return {
          iconBg: "bg-amber-600",
          iconBorder: "border-amber-400/40",
          iconShadow: "shadow-amber-500/10 dark:shadow-none",
          iconColor: "text-white",
          buttonBg: "bg-amber-600 hover:bg-amber-500",
          buttonShadow: "shadow-sm shadow-amber-500/10 dark:shadow-none",
          glowPrimary: "bg-amber-500/15",
          glowSecondary: "bg-amber-600/10",
          accentBorder: "border-amber-500/20",
        };
      default:
        return {
          iconBg: "bg-primary",
          iconBorder: "border-primary/40",
          iconShadow: "shadow-primary/10 dark:shadow-none",
          iconColor: "text-white",
          buttonBg: "bg-primary hover:bg-primary/90",
          buttonShadow: "shadow-sm shadow-primary/10 dark:shadow-none",
          glowPrimary: "bg-primary/15",
          glowSecondary: "bg-primary/10",
          accentBorder: "border-primary/20",
        };
    }
  };

  const styles = getVariantStyles();
  const DefaultIcon = variant === "danger" ? Trash2 : AlertTriangle;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop with blur */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-md animate-in fade-in duration-300"
        onClick={() => !isLoading && onClose()}
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div className="relative min-w-[320px] w-full max-w-[420px] sm:max-w-md animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
        {/* Outer glow effects */}
        <div
          className={`absolute -inset-1 ${styles.glowPrimary} blur-2xl rounded-3xl opacity-60 pointer-events-none dark:hidden`}
        />

        {/* Main modal card */}
        <div
          className={`relative overflow-hidden rounded-2xl border ${styles.accentBorder} bg-white backdrop-blur-xl shadow-2xl shadow-slate-900/20 dark:bg-neutral-950 dark:shadow-black/40`}
        >
          {/* Animated gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-50/80 via-transparent to-slate-100/80 pointer-events-none dark:hidden" />

          {/* Inner glow effects */}
          <div
            className={`absolute top-0 right-0 w-40 h-40 ${styles.glowPrimary} blur-3xl rounded-full pointer-events-none animate-pulse dark:hidden`}
            style={{ animationDuration: "3s" }}
          />
          <div
            className={`absolute bottom-0 left-0 w-32 h-32 ${styles.glowSecondary} blur-2xl rounded-full pointer-events-none dark:hidden`}
          />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-slate-950/[0.02] blur-3xl rounded-full pointer-events-none dark:hidden" />

          {/* Glass inner layer */}
          <div className="relative bg-gradient-to-b from-white/40 to-transparent dark:bg-none">
            {/* Header */}
            <div className="relative flex justify-between items-center p-5 sm:p-6 border-b border-slate-200 dark:border-white/[0.06]">
              <div className="flex items-center gap-4">
                {/* Premium icon container */}
                <div
                  className={`relative w-12 h-12 rounded-xl ${styles.iconBg} flex items-center justify-center border ${styles.iconBorder} shadow-lg ${styles.iconShadow}`}
                >
                  <div className="absolute inset-0 rounded-xl bg-black/10 dark:hidden" />
                  {icon || (
                    <DefaultIcon
                      className={`relative w-5 h-5 ${styles.iconColor} drop-shadow-sm`}
                    />
                  )}
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-semibold text-slate-950 tracking-tight dark:text-white">
                    {title}
                  </h3>
                </div>
              </div>
              <button
                onClick={onClose}
                disabled={isLoading}
                className="p-2.5 text-slate-400 hover:text-slate-950 hover:bg-slate-100 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed dark:text-neutral-400 dark:hover:text-white dark:hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="relative p-5 sm:p-6">
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed dark:text-neutral-300">
                {description}
              </p>
            </div>

            {/* Footer */}
            <div className="relative flex flex-col sm:flex-row justify-end gap-3 p-5 sm:p-6 pt-0 sm:pt-0">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="order-2 sm:order-1 px-5 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-950 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed dark:text-neutral-300 dark:hover:text-white dark:bg-white/5 dark:hover:bg-white/10 dark:border-white/10 dark:hover:border-white/20"
              >
                {cancelText}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={isLoading}
                className={`order-1 sm:order-2 px-6 py-2.5 text-sm font-medium text-white rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${styles.buttonBg} ${styles.buttonShadow}`}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    <span>Processing...</span>
                  </>
                ) : (
                  confirmText
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
