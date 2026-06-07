"use client";

import { useActionState, useState } from "react";
import { ArrowRight, KeyRound, LockKeyhole, Mail, UserPlus } from "lucide-react";

export type AuthActionState = {
  error?: string;
};

export type AuthAction = (
  previousState: AuthActionState,
  formData: FormData
) => Promise<AuthActionState>;

export interface AuthFormProps {
  loginAction: AuthAction;
  signupAction: AuthAction;
  isEmailAuthConfigured: boolean;
}

function AuthSubmitButton({
  disabled,
  mode,
  pending,
}: {
  disabled: boolean;
  mode: "signin" | "signup";
  pending: boolean;
}) {
  const label = mode === "signup" ? "Create account" : "Sign in";
  const pendingLabel = mode === "signup" ? "Creating account..." : "Signing in...";

  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="group flex h-12 w-full items-center justify-center gap-3 rounded-lg bg-slate-950 px-5 text-sm font-semibold text-white shadow-lg shadow-black/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-800 disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-neutral-800 disabled:text-neutral-500 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
    >
      {mode === "signup" ? (
        <UserPlus className="h-4 w-4" />
      ) : (
        <KeyRound className="h-4 w-4" />
      )}
      <span>{pending ? pendingLabel : label}</span>
      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
    </button>
  );
}

export function EmailPasswordForm({
  loginAction,
  signupAction,
  isEmailAuthConfigured,
  compact = false,
}: AuthFormProps & { compact?: boolean }) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [signinState, signinFormAction, signinPending] = useActionState(
    loginAction,
    {}
  );
  const [signupState, signupFormAction, signupPending] = useActionState(
    signupAction,
    {}
  );
  const isSignup = mode === "signup";
  const activeState = isSignup ? signupState : signinState;
  const pending = isSignup ? signupPending : signinPending;

  return (
    <div className={`space-y-3 ${compact ? "w-full sm:w-[24rem]" : "w-full"}`}>
      <form
        action={isSignup ? signupFormAction : signinFormAction}
        className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-xl shadow-slate-200/70 backdrop-blur dark:border-white/10 dark:bg-white/[0.055] dark:shadow-black/20"
      >
        <div className="mb-4 flex rounded-lg border border-slate-200 bg-slate-50 p-1 text-sm font-semibold dark:border-white/10 dark:bg-black/20">
          <button
            type="button"
            onClick={() => setMode("signin")}
            className={`h-9 flex-1 rounded-md transition ${
              !isSignup
                ? "bg-white text-slate-950 shadow-sm dark:bg-white dark:text-slate-950"
                : "text-slate-500 hover:text-slate-950 dark:text-white/54 dark:hover:text-white"
            }`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`h-9 flex-1 rounded-md transition ${
              isSignup
                ? "bg-white text-slate-950 shadow-sm dark:bg-white dark:text-slate-950"
                : "text-slate-500 hover:text-slate-950 dark:text-white/54 dark:hover:text-white"
            }`}
          >
            Create account
          </button>
        </div>

        <div className="space-y-3">
          {isSignup && (
            <label className="block text-sm font-medium text-slate-700 dark:text-white/72">
              Name
              <div className="mt-1.5 flex h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-slate-500 focus-within:border-pink-300 dark:border-white/10 dark:bg-black/20 dark:text-white/45">
                <UserPlus className="h-4 w-4" />
                <input
                  name="name"
                  autoComplete="name"
                  className="w-full bg-transparent text-sm text-slate-950 outline-none placeholder:text-slate-400 dark:text-white"
                  placeholder="Your name"
                />
              </div>
            </label>
          )}

          <label className="block text-sm font-medium text-slate-700 dark:text-white/72">
            Email
            <div className="mt-1.5 flex h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-slate-500 focus-within:border-pink-300 dark:border-white/10 dark:bg-black/20 dark:text-white/45">
              <Mail className="h-4 w-4" />
              <input
                required
                name="email"
                type="email"
                autoComplete="email"
                className="w-full bg-transparent text-sm text-slate-950 outline-none placeholder:text-slate-400 dark:text-white"
                placeholder="you@example.com"
              />
            </div>
          </label>

          <label className="block text-sm font-medium text-slate-700 dark:text-white/72">
            Password
            <div className="mt-1.5 flex h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-slate-500 focus-within:border-pink-300 dark:border-white/10 dark:bg-black/20 dark:text-white/45">
              <LockKeyhole className="h-4 w-4" />
              <input
                required
                name="password"
                type="password"
                minLength={8}
                autoComplete={isSignup ? "new-password" : "current-password"}
                className="w-full bg-transparent text-sm text-slate-950 outline-none placeholder:text-slate-400 dark:text-white"
                placeholder="At least 8 characters"
              />
            </div>
          </label>
        </div>

        {activeState.error && (
          <p className="mt-3 rounded-lg border border-red-300/60 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-400/25 dark:bg-red-400/10 dark:text-red-100">
            {activeState.error}
          </p>
        )}

        {!isEmailAuthConfigured && (
          <p className="mt-3 rounded-lg border border-amber-300/60 bg-amber-50 px-3 py-2 text-sm leading-6 text-amber-800 dark:border-amber-400/25 dark:bg-amber-400/10 dark:text-amber-100">
            Email login needs Turso storage and encryption configured.
          </p>
        )}

        <div className="mt-4">
          <AuthSubmitButton
            disabled={!isEmailAuthConfigured}
            mode={mode}
            pending={pending}
          />
        </div>
      </form>
    </div>
  );
}
