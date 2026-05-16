"use client";

import { useFormStatus } from "react-dom";
import Image from "next/image";
import {
  ArrowRight,
  CheckCircle2,
  Cloud,
  Code2,
  Database,
  FileJson,
  FolderKanban,
  LockKeyhole,
  Play,
  Rows3,
  ShieldCheck,
  Sparkles,
  Workflow,
} from "lucide-react";

interface LoginClientProps {
  onSubmit: (formData: FormData) => void;
  isGoogleLoginConfigured: boolean;
}

const productStats = [
  { label: "Tables", value: "12", icon: Database },
  { label: "Rows synced", value: "8.4k", icon: Rows3 },
  { label: "Automations", value: "6", icon: Workflow },
];

const features = [
  {
    title: "Drive-first database",
    description:
      "Turn folders, files, and structured data into a workspace your team already understands.",
    icon: Cloud,
  },
  {
    title: "API-ready tables",
    description:
      "Expose Drive-backed data through stable endpoints without hand-rolling storage glue.",
    icon: Code2,
  },
  {
    title: "Visual data control",
    description:
      "Manage records, files, schema, usage, and functions from one focused dashboard.",
    icon: FolderKanban,
  },
];

const workflowSteps = [
  "Connect your Google account",
  "Choose a Drive folder or database",
  "Manage data, files, functions, and APIs",
];

const tableRows = [
  ["Customers", "4 columns", "Synced"],
  ["Orders", "8 columns", "Synced"],
  ["Inventory", "6 columns", "Ready"],
  ["Invoices", "5 columns", "Live"],
];

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
      className="group flex h-12 w-full items-center justify-center gap-3 rounded-lg bg-white px-5 text-sm font-semibold text-slate-950 shadow-lg shadow-black/25 transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-100 disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-neutral-800 disabled:text-neutral-500 sm:w-auto sm:min-w-56"
    >
      <GoogleMark />
      <span>{pending ? "Opening Google..." : "Continue with Google"}</span>
      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
    </button>
  );
}

function SignInForm({
  onSubmit,
  isGoogleLoginConfigured,
  compact = false,
}: LoginClientProps & { compact?: boolean }) {
  return (
    <form action={onSubmit} className={`space-y-4 ${compact ? "w-full sm:w-auto" : ""}`}>
      <GoogleSignInButton disabled={!isGoogleLoginConfigured} />

      {!isGoogleLoginConfigured && (
        <div
          className={`rounded-lg border border-amber-400/25 bg-amber-400/10 text-sm leading-6 text-amber-100 ${
            compact ? "p-3" : "p-4"
          }`}
        >
          Google login needs server env vars:
          <span className="mt-1 block font-mono text-xs text-amber-100/80">
            GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
          </span>
        </div>
      )}
    </form>
  );
}

export default function LoginClient({
  onSubmit,
  isGoogleLoginConfigured,
}: LoginClientProps) {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#07080d] text-white">
      <section className="relative isolate overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 -z-10">
          <div className="h-full w-full bg-[url('/logo.png')] bg-[length:42rem_42rem] bg-[position:75%_8%] bg-no-repeat opacity-[0.04]" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,8,13,0.72)_0%,rgba(7,8,13,0.94)_62%,#07080d_100%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.055)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.055)_1px,transparent_1px)] bg-[size:72px_72px] opacity-30" />
        </div>

        <header className="mx-auto flex w-full max-w-[22rem] items-center justify-between px-5 py-5 sm:max-w-7xl sm:px-8 lg:px-10">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="GDrive Database"
              width={40}
              height={40}
              className="h-10 w-10 rounded-lg"
              priority
            />
            <div>
              <p className="text-sm font-semibold leading-5">GDrive Database</p>
              <p className="text-xs text-white/45">Drive-backed data platform</p>
            </div>
          </div>

          <nav
            aria-label="Landing page"
            className="hidden items-center gap-7 text-sm text-white/58 md:flex"
          >
            <a className="transition hover:text-white" href="#workflow">
              Workflow
            </a>
            <a className="transition hover:text-white" href="#features">
              Features
            </a>
            <a className="transition hover:text-white" href="#security">
              Security
            </a>
          </nav>

          <a
            href="#signin"
            className="rounded-lg border border-white/12 bg-white/8 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/22 hover:bg-white/12"
          >
            Sign in
          </a>
        </header>

        <div className="mx-auto grid w-full min-w-0 max-w-[22rem] items-center gap-12 px-5 pb-20 pt-12 sm:max-w-7xl sm:px-8 md:pt-20 lg:grid-cols-[minmax(0,0.94fr)_minmax(0,1.06fr)] lg:px-10">
          <div className="min-w-0 max-w-3xl">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-pink-400/24 bg-pink-400/10 px-3 py-1.5 text-xs font-semibold text-pink-200">
              <Sparkles className="h-3.5 w-3.5" />
              Google Drive as an operational database
            </div>

            <h1 className="max-w-3xl text-4xl font-semibold leading-[1.05] sm:text-6xl lg:text-7xl">
              Build database apps on top of Google Drive.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/64">
              GDrive Database gives your Drive folders a structured dashboard,
              table editor, API layer, file bucket, and automation surface
              without moving data away from Google.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <SignInForm
                onSubmit={onSubmit}
                isGoogleLoginConfigured={isGoogleLoginConfigured}
                compact
              />
              <a
                href="#features"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-white/12 px-5 text-sm font-semibold text-white/82 transition hover:border-white/25 hover:bg-white/8"
              >
                <Play className="h-4 w-4" />
                See how it works
              </a>
            </div>

            <div className="mt-8 grid gap-3 text-sm text-white/54 sm:grid-cols-3">
              {[
                "Server-side OAuth",
                "No JSON key uploads",
                "Drive remains source of truth",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-300" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative hidden min-w-0 sm:block">
            <div className="absolute -inset-4 rounded-lg border border-white/8 bg-white/[0.025]" />
            <div className="relative w-full min-w-0 overflow-hidden rounded-lg border border-white/12 bg-[#0d1018]/92 shadow-2xl shadow-black/50">
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-red-400/90" />
                  <span className="h-3 w-3 rounded-full bg-amber-300/90" />
                  <span className="h-3 w-3 rounded-full bg-emerald-300/90" />
                </div>
                <div className="hidden rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/52 sm:block">
                  drive://production
                </div>
              </div>

              <div className="grid min-h-[32rem] md:grid-cols-[13rem_1fr]">
                <aside className="border-b border-white/10 bg-white/[0.03] p-4 md:border-b-0 md:border-r">
                  <div className="mb-5 flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-pink-500/15 text-pink-200">
                      <Database className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Workspace</p>
                      <p className="text-xs text-white/40">Google Drive</p>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    {["Dashboard", "Tables", "Bucket", "Functions", "API Docs"].map(
                      (item, index) => (
                        <div
                          key={item}
                          className={`rounded-lg px-3 py-2 ${
                            index === 1
                              ? "bg-white text-slate-950"
                              : "text-white/52"
                          }`}
                        >
                          {item}
                        </div>
                      )
                    )}
                  </div>
                </aside>

                <div className="p-5">
                  <div className="mb-5 flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase text-pink-200/80">
                        Database
                      </p>
                      <h2 className="mt-2 text-2xl font-semibold">
                        Production data
                      </h2>
                    </div>
                    <div className="rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-sm font-medium text-emerald-200">
                      Synced 18s ago
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    {productStats.map((stat) => (
                      <div
                        key={stat.label}
                        className="rounded-lg border border-white/10 bg-white/[0.04] p-4"
                      >
                        <stat.icon className="mb-5 h-4 w-4 text-pink-200" />
                        <p className="text-3xl font-semibold">{stat.value}</p>
                        <p className="mt-1 text-xs text-white/42">
                          {stat.label}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 overflow-hidden rounded-lg border border-white/10">
                    <div className="grid grid-cols-[1.2fr_0.8fr_0.7fr] bg-white/[0.04] px-4 py-3 text-xs font-semibold uppercase text-white/38">
                      <span>Collection</span>
                      <span>Schema</span>
                      <span>Status</span>
                    </div>
                    {tableRows.map(([name, schema, status]) => (
                      <div
                        key={name}
                        className="grid grid-cols-[1.2fr_0.8fr_0.7fr] border-t border-white/10 px-4 py-4 text-sm"
                      >
                        <span className="font-medium">{name}</span>
                        <span className="text-white/48">{schema}</span>
                        <span className="text-emerald-300">{status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="workflow" className="border-b border-white/10 bg-[#090b12]">
        <div className="mx-auto max-w-[22rem] px-5 py-20 sm:max-w-7xl sm:px-8 lg:px-10">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-pink-200">Workflow</p>
            <h2 className="mt-3 text-4xl font-semibold leading-tight">
              From Drive folder to usable data platform in minutes.
            </h2>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {workflowSteps.map((step, index) => (
              <div
                key={step}
                className="rounded-lg border border-white/10 bg-white/[0.035] p-6"
              >
                <div className="mb-8 flex h-10 w-10 items-center justify-center rounded-lg bg-white text-sm font-semibold text-slate-950">
                  {index + 1}
                </div>
                <h3 className="text-xl font-semibold">{step}</h3>
                <p className="mt-3 text-sm leading-6 text-white/52">
                  Keep the workflow familiar while giving teams a cleaner
                  database interface on top of existing Drive assets.
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="border-b border-white/10 bg-[#07080d]">
        <div className="mx-auto max-w-[22rem] px-5 py-20 sm:max-w-7xl sm:px-8 lg:px-10">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <div>
              <p className="text-sm font-semibold text-pink-200">Features</p>
              <h2 className="mt-3 text-4xl font-semibold leading-tight">
                Built for teams that already live in Google Drive.
              </h2>
            </div>
            <p className="max-w-2xl text-base leading-7 text-white/56 lg:ml-auto">
              Use Drive for storage, GDrive Database for the operational layer:
              records, schema, APIs, usage, file bucket, and server-side
              functions in one place.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {features.map((feature) => (
              <article
                key={feature.title}
                className="rounded-lg border border-white/10 bg-white/[0.035] p-6"
              >
                <div className="mb-8 flex h-11 w-11 items-center justify-center rounded-lg bg-pink-400/12 text-pink-200">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-semibold">{feature.title}</h3>
                <p className="mt-3 text-sm leading-6 text-white/54">
                  {feature.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="security" className="bg-[#090b12]">
        <div className="mx-auto grid max-w-[22rem] gap-8 px-5 py-20 sm:max-w-7xl sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:px-10">
          <div>
            <p className="text-sm font-semibold text-pink-200">Security</p>
            <h2 className="mt-3 text-4xl font-semibold leading-tight">
              Sign in with Google. Keep control in your account.
            </h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-white/56">
              The dashboard uses OAuth for access and avoids manual credential
              uploads. Your Drive remains the source of truth while the app
              provides the database workflow on top.
            </p>
          </div>

          <div id="signin" className="rounded-lg border border-white/10 bg-white/[0.04] p-6">
            <div className="mb-6 flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-emerald-400/12 text-emerald-200">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-2xl font-semibold">
                  Start with your Google account
                </h3>
                <p className="mt-2 text-sm leading-6 text-white/54">
                  Connect once, then open your dashboard, tables, files, API
                  docs, usage, and function tools.
                </p>
              </div>
            </div>

            <SignInForm
              onSubmit={onSubmit}
              isGoogleLoginConfigured={isGoogleLoginConfigured}
            />

            <div className="mt-6 grid gap-3 text-sm text-white/54 sm:grid-cols-2">
              {[
                "OAuth credentials stay server-side",
                "No service account JSON in the browser",
                "Drive data remains in Google",
                "Access can be revoked from Google",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <LockKeyhole className="h-4 w-4 text-emerald-300" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 bg-[#07080d]">
        <div className="mx-auto flex max-w-[22rem] flex-col gap-4 px-5 py-8 text-sm text-white/42 sm:max-w-7xl sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt=""
              width={28}
              height={28}
              className="h-7 w-7 rounded-md"
            />
            <span>GDrive Database</span>
          </div>
          <div className="flex items-center gap-2">
            <FileJson className="h-4 w-4" />
            Drive-native database workspace
          </div>
        </div>
      </footer>
    </main>
  );
}
