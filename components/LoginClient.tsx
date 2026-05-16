"use client";

import { useFormStatus } from "react-dom";
import {
  ArrowRight,
  KeyRound,
  ShieldCheck,
} from "lucide-react";

interface LoginClientProps {
  onSubmit: (formData: FormData) => void;
  isGoogleLoginConfigured: boolean;
}

function GoogleMark() {
  return (
    <span className="flex h-5 w-5 items-center justify-center rounded-full border border-slate-200 bg-white text-sm font-bold text-slate-950">
      G
    </span>
  );
}

function GoogleSignInButton({
  disabled,
}: {
  disabled: boolean;
}) {
  const { pending } = useFormStatus();
  const isDisabled = disabled || pending;

  return (
    <button
      type="submit"
      disabled={isDisabled}
      className="group flex h-12 w-full items-center justify-center gap-3 rounded-lg bg-slate-950 px-5 text-sm font-semibold text-white shadow-lg shadow-slate-950/15 transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-800 disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 dark:bg-white dark:text-slate-950 dark:shadow-black/30 dark:hover:bg-slate-100 dark:disabled:bg-neutral-800 dark:disabled:text-neutral-500"
    >
      <GoogleMark />
      <span>{pending ? "Opening Google..." : "Continue with Google"}</span>
      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
    </button>
  );
}

export default function LoginClient({
  onSubmit,
  isGoogleLoginConfigured,
}: LoginClientProps) {
  return (
    <main className="min-h-screen overflow-hidden bg-slate-50 text-slate-950 dark:bg-[#090a0d] dark:text-white">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_18%_12%,rgba(219,39,119,0.12),transparent_32%),radial-gradient(circle_at_86%_22%,rgba(37,99,235,0.10),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.86),rgba(241,245,249,0.94))] dark:bg-[radial-gradient(circle_at_18%_12%,rgba(236,72,153,0.14),transparent_30%),radial-gradient(circle_at_84%_20%,rgba(37,99,235,0.12),transparent_28%),linear-gradient(180deg,#0b0c10,#08090d)]" />

      <div className="flex min-h-screen w-full items-center justify-center px-5 py-10 sm:px-8">
        <section className="flex w-full items-center justify-center">
          <div className="mx-auto w-full max-w-md rounded-lg border border-slate-200 bg-white/90 p-6 shadow-2xl shadow-slate-950/10 backdrop-blur sm:p-8 dark:border-neutral-800 dark:bg-neutral-950/85 dark:shadow-black/35">
            <div className="mb-7">
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-lg border border-pink-200 bg-pink-50 text-primary dark:border-pink-500/20 dark:bg-pink-500/10">
                <KeyRound className="h-5 w-5" />
              </div>
              <p className="mb-2 text-sm font-medium text-primary">
                Welcome back
              </p>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">
                Sign in to GDrive Database
              </h1>
              <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-neutral-400">
                Connect with Google to open your dashboard and manage your
                Drive-backed databases.
              </p>
            </div>

            <form action={onSubmit} className="space-y-4">
              <GoogleSignInButton disabled={!isGoogleLoginConfigured} />

              {!isGoogleLoginConfigured && (
                <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm leading-6 text-amber-900 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-200">
                  Google login needs server env vars:
                  <span className="mt-1 block font-mono text-xs text-amber-800 dark:text-amber-100/90">
                    GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
                  </span>
                </div>
              )}
            </form>

            <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-neutral-800 dark:bg-neutral-900/70">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-neutral-200">
                    Secure Google sign-in
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-neutral-500">
                    Access is granted through OAuth. Credentials are handled by
                    the server, not pasted into the browser.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
