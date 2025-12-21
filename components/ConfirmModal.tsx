"use client";

import { useEffect, useRef, ReactNode } from "react";
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
  const overlayRef = useRef<HTMLDivElement>(null);

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
          iconBg: "from-red-900 to-red-800",
          iconBorder: "border-red-500/30",
          iconColor: "text-white",
          buttonBg: "bg-red-600 hover:bg-red-500",
          glow: "bg-red-500/15",
        };
      case "warning":
        return {
          iconBg: "from-amber-500/30 to-amber-600/20",
          iconBorder: "border-amber-500/20",
          iconColor: "text-amber-400",
          buttonBg: "bg-amber-600 hover:bg-amber-500",
          glow: "bg-amber-500/10",
        };
      default:
        return {
          iconBg: "from-primary/30 to-primary/20",
          iconBorder: "border-primary/20",
          iconColor: "text-primary",
          buttonBg: "bg-primary hover:bg-primary/90",
          glow: "bg-primary/10",
        };
    }
  };

  const styles = getVariantStyles();
  const DefaultIcon = variant === "danger" ? Trash2 : AlertTriangle;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        ref={overlayRef}
        className="absolute inset-0"
        onClick={() => !isLoading && onClose()}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-neutral-800 bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-800 shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Glow effect */}
        <div
          className={`absolute top-0 right-0 w-48 h-48 ${styles.glow} blur-3xl rounded-full pointer-events-none`}
        />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-neutral-800/30 blur-2xl rounded-full pointer-events-none" />

        {/* Header */}
        <div className="relative flex justify-between items-start p-6 border-b border-neutral-800 bg-gradient-to-r from-neutral-900 to-neutral-800/50">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl bg-linear-to-br ${styles.iconBg} flex items-center justify-center border ${styles.iconBorder}`}
            >
              {icon || (
                <DefaultIcon className={`w-5 h-5 ${styles.iconColor}`} />
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">{title}</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-all disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="relative p-6">
          <p className="text-neutral-300 text-sm leading-relaxed">
            {description}
          </p>
        </div>

        {/* Footer */}
        <div className="relative flex justify-end gap-3 px-6 pb-6">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-5 py-2.5 text-sm font-medium text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-xl transition-all disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-5 py-2.5 text-sm font-medium text-white rounded-xl transition-all disabled:opacity-50 flex items-center gap-2 ${styles.buttonBg}`}
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
                Processing...
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
