"use client";

import { useFormStatus } from "react-dom";
import Image from "next/image";
import {
  ArrowRight,
  Cloud,
  Database,
  KeyRound,
  LockKeyhole,
  Sparkles,
  Table2,
  Workflow,
} from "lucide-react";

interface LoginClientProps {
  onSubmit: (formData: FormData) => void;
  isGoogleLoginConfigured: boolean;
}

const previewStats = [
  { label: "Collections", value: "12", icon: Database },
  { label: "Rows synced", value: "8.4k", icon: Table2 },
  { label: "Automations", value: "6", icon: Workflow },
];

function GoogleMark() {
  return (
    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-sm font-bold text-neutral-950">
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
      className="group flex h-12 w-full items-center justify-center gap-3 rounded-xl bg-white px-5 text-sm font-semibold text-neutral-950 shadow-xl shadow-black/30 transition-all duration-200 hover:-translate-y-0.5 hover:bg-neutral-100 disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-neutral-700 disabled:text-neutral-400"
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
    <main className="min-h-screen bg-neutral-950 text-white">
      <div className="grid min-h-screen lg:grid-cols-[1.08fr_0.92fr]">
        <section className="relative flex min-h-[46rem] flex-col justify-between overflow-hidden border-b border-neutral-800 bg-[radial-gradient(circle_at_15%_10%,rgba(235,0,129,0.14),transparent_32%),linear-gradient(135deg,#050505_0%,#121212_55%,#080808_100%)] p-6 sm:p-10 lg:border-b-0 lg:border-r lg:p-14">
          <header className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="GDrive Database"
                width={44}
                height={44}
                className="rounded-xl"
              />
              <span className="text-lg font-semibold tracking-tight">
                GDrive Database
              </span>
            </div>
            <div className="hidden items-center gap-2 rounded-full border border-neutral-800 bg-neutral-900/60 px-3 py-1.5 text-xs text-neutral-400 sm:flex">
              <LockKeyhole className="h-3.5 w-3.5 text-emerald-400" />
              Google secured
            </div>
          </header>

          <div className="mx-auto flex w-full max-w-5xl flex-1 items-center py-14 lg:py-20">
            <div className="grid w-full gap-10 xl:grid-cols-[0.9fr_1.1fr] xl:items-center">
              <div className="max-w-xl">
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
                  <Sparkles className="h-3.5 w-3.5" />
                  Drive-native database workspace
                </div>
                <h1 className="text-5xl font-semibold leading-[1.02] tracking-tight text-white sm:text-6xl">
                  Your Google Drive, shaped into a database.
                </h1>
                <p className="mt-6 max-w-lg text-lg leading-8 text-neutral-400">
                  Sign in once, then manage tables, files, functions, and API
                  access from the dashboard.
                </p>
              </div>

              <div className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-4 shadow-2xl shadow-black/40 backdrop-blur">
                <div className="mb-4 flex items-center justify-between border-b border-neutral-800 pb-4">
                  <div>
                    <p className="text-sm font-medium text-neutral-300">
                      Production workspace
                    </p>
                    <p className="text-xs text-neutral-500">
                      Synced with Google Drive
                    </p>
                  </div>
                  <div className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300 ring-1 ring-emerald-500/20">
                    Live
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  {previewStats.map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-xl border border-neutral-800 bg-neutral-900/80 p-4"
                    >
                      <stat.icon className="mb-4 h-4 w-4 text-primary" />
                      <p className="text-2xl font-semibold">{stat.value}</p>
                      <p className="mt-1 text-xs text-neutral-500">
                        {stat.label}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 rounded-xl border border-neutral-800 bg-neutral-900/80 p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Cloud className="h-4 w-4 text-sky-300" />
                      <span className="text-sm font-medium">
                        Drive resources
                      </span>
                    </div>
                    <span className="text-xs text-neutral-500">Updated now</span>
                  </div>
                  <div className="space-y-3">
                    {["Customers", "Orders", "Inventory"].map((item, index) => (
                      <div
                        key={item}
                        className="flex items-center justify-between rounded-lg bg-neutral-950/70 px-3 py-2.5"
                      >
                        <span className="text-sm text-neutral-300">{item}</span>
                        <span className="text-xs text-neutral-500">
                          {index + 2} tables
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center bg-neutral-950 px-6 py-12 sm:px-10">
          <div className="w-full max-w-md">
            <div className="mb-9">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-neutral-800 bg-neutral-900">
                <KeyRound className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-3xl font-semibold tracking-tight">
                Sign in to continue
              </h2>
              <p className="mt-3 text-sm leading-6 text-neutral-500">
                Use your Google account to connect the dashboard to Drive.
              </p>
            </div>

            <form action={onSubmit} className="space-y-4">
              <GoogleSignInButton disabled={!isGoogleLoginConfigured} />

              {!isGoogleLoginConfigured && (
                <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 p-4 text-sm leading-6 text-amber-200">
                  Google login needs server env vars:
                  <span className="mt-1 block font-mono text-xs text-amber-100/90">
                    GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
                  </span>
                </div>
              )}
            </form>

            <div className="mt-8 grid gap-3 text-sm text-neutral-500">
              <div className="flex items-center gap-3">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                OAuth credentials stay on the server
              </div>
              <div className="flex items-center gap-3">
                <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                No manual JSON upload required
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
