"use client";

import Image from "next/image";
import { useFormStatus } from "react-dom";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Cloud,
  Code2,
  Database,
  FileJson,
  Files,
  FolderKanban,
  GitBranch,
  KeyRound,
  Moon,
  Network,
  Rows3,
  Search,
  Settings2,
  Sparkles,
  Sun,
  UploadCloud,
  Workflow,
} from "lucide-react";
import { useTheme } from "./ThemeProvider";

interface LoginClientProps {
  onSubmit: (formData: FormData) => void;
  isGoogleLoginConfigured: boolean;
}

const heroPillars = [
  "Google Drive backend",
  "Schema-aware tables",
  "SDK and API access",
];

const workflowSteps = [
  {
    title: "Connect Google Drive",
    description:
      "Sign in with OAuth, then connect the Drive workspace that should hold your data.",
  },
  {
    title: "Model your data",
    description:
      "Create databases, tables, columns, relations, storage fields, and defaults from the dashboard.",
  },
  {
    title: "Build with APIs",
    description:
      "Use the TypeScript SDK, generated API docs, file bucket, and server functions to ship apps faster.",
  },
];

const platformModules = [
  {
    title: "Dashboard",
    description: "Create databases, review usage, and manage Drive-backed resources.",
    icon: FolderKanban,
  },
  {
    title: "Tables",
    description: "Edit rows, columns, schema, query filters, and linked records.",
    icon: Rows3,
  },
  {
    title: "Storage bucket",
    description: "Upload and serve files from Drive while linking them to records.",
    icon: UploadCloud,
  },
  {
    title: "Functions",
    description: "Run server-side workflows and automation around your Drive data.",
    icon: Workflow,
  },
  {
    title: "API docs",
    description: "Use clean SDK examples for CRUD, schema changes, bucket files, and keys.",
    icon: Code2,
  },
  {
    title: "Settings",
    description: "Control account, API keys, backups, and Google Drive connection details.",
    icon: Settings2,
  },
];

const featureRows = [
  {
    title: "NoSQL records stored in Drive",
    description:
      "Use Google Drive as the durable backend while the app gives teams a database-style control plane.",
    icon: Cloud,
  },
  {
    title: "Schema and relationships",
    description:
      "Define strings, numbers, booleans, dates, storage fields, and relation columns for linked data.",
    icon: GitBranch,
  },
  {
    title: "Developer-ready SDK",
    description:
      "Use the `gdatabase` package to create, list, update, delete, and evolve tables from TypeScript.",
    icon: FileJson,
  },
  {
    title: "Searchable operational UI",
    description:
      "Work with records through a dashboard built for repeated editing, inspection, and management.",
    icon: Search,
  },
];

const schemaTypes = [
  "string",
  "integer",
  "boolean",
  "datetime",
  "relation",
  "storage",
];

const useCases = [
  "Internal tools backed by team-owned Drive files",
  "Content, inventory, and customer data dashboards",
  "Small SaaS prototypes without database infrastructure",
  "File-heavy portals that need records and bucket storage together",
];

function GoogleMark() {
  return (
    <span className="flex h-5 w-5 items-center justify-center rounded-full border border-slate-200 bg-white text-sm font-bold text-slate-950">
      G
    </span>
  );
}

function GoogleSignInButton({ disabled }: { disabled: boolean }) {
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
    <form
      action={onSubmit}
      className={`space-y-4 ${compact ? "w-full sm:w-auto" : ""}`}
    >
      <GoogleSignInButton disabled={!isGoogleLoginConfigured} />

      {!isGoogleLoginConfigured && (
        <div
          className={`rounded-lg border border-amber-300/60 bg-amber-50 text-sm leading-6 text-amber-800 dark:border-amber-400/25 dark:bg-amber-400/10 dark:text-amber-100 ${
            compact ? "p-3" : "p-4"
          }`}
        >
          Google login needs server env vars:
          <span className="mt-1 block font-mono text-xs text-amber-700 dark:text-amber-100/80">
            GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
          </span>
        </div>
      )}
    </form>
  );
}

function LandingThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const nextTheme = isDark ? "light" : "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${nextTheme} theme`}
      title={`Switch to ${nextTheme} theme`}
      aria-pressed={isDark}
      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-pink-300 hover:text-pink-600 dark:border-white/12 dark:bg-white/8 dark:text-white/78 dark:hover:border-white/22 dark:hover:bg-white/12 dark:hover:text-white"
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}

export default function LoginClient({
  onSubmit,
  isGoogleLoginConfigured,
}: LoginClientProps) {
  return (
    <main className="min-h-screen overflow-x-hidden bg-slate-50 text-slate-950 transition-colors duration-300 dark:bg-[#07080d] dark:text-white">
      <section className="relative isolate overflow-hidden border-b border-slate-200 transition-colors duration-300 dark:border-white/10">
        <div className="absolute inset-0 -z-10">
          <div className="h-full w-full bg-[url('/logo.png')] bg-[length:34rem_34rem] bg-[position:78%_12%] bg-no-repeat opacity-[0.045] dark:opacity-[0.035]" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(248,250,252,0.74)_0%,rgba(248,250,252,0.96)_72%,#f8fafc_100%)] dark:bg-[linear-gradient(180deg,rgba(7,8,13,0.70)_0%,rgba(7,8,13,0.94)_72%,#07080d_100%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.055)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.055)_1px,transparent_1px)] bg-[size:72px_72px] opacity-70 dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.055)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.055)_1px,transparent_1px)] dark:opacity-30" />
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
              <p className="text-xs text-slate-500 dark:text-white/45">
                Drive-backed data platform
              </p>
            </div>
          </div>

          <nav
            aria-label="Landing page"
            className="hidden items-center gap-7 text-sm text-slate-500 md:flex dark:text-white/58"
          >
            <a
              className="transition hover:text-slate-950 dark:hover:text-white"
              href="#platform"
            >
              Platform
            </a>
            <a
              className="transition hover:text-slate-950 dark:hover:text-white"
              href="#workflow"
            >
              Workflow
            </a>
            <a
              className="transition hover:text-slate-950 dark:hover:text-white"
              href="#sdk"
            >
              SDK
            </a>
            <a
              className="transition hover:text-slate-950 dark:hover:text-white"
              href="#features"
            >
              Features
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <LandingThemeToggle />
            <a
              href="#signin"
              className="shrink-0 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm transition hover:border-pink-300 hover:text-pink-600 dark:border-white/12 dark:bg-white/8 dark:text-white dark:hover:border-white/22 dark:hover:bg-white/12"
            >
              Sign in
            </a>
          </div>
        </header>

        <div className="mx-auto grid w-full min-w-0 max-w-[22rem] items-center gap-12 px-5 pb-20 pt-12 sm:max-w-7xl sm:px-8 md:pt-20 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,0.82fr)] lg:px-10">
          <div className="min-w-0 max-w-3xl">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-pink-200 bg-pink-50 px-3 py-1.5 text-xs font-semibold text-pink-700 dark:border-pink-400/24 dark:bg-pink-400/10 dark:text-pink-200">
              <Sparkles className="h-3.5 w-3.5" />
              Google Drive as an operational database
            </div>

            <h1 className="max-w-3xl text-4xl font-semibold leading-[1.05] sm:text-6xl lg:text-7xl">
              Build database apps on top of Google Drive.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 dark:text-white/64">
              GDrive Database turns Drive into a structured NoSQL workspace with
              tables, schema, storage, server functions, SDK access, and API docs
              in one dashboard.
            </p>

            <div
              id="signin"
              className="mt-8 flex scroll-mt-24 flex-col gap-3 sm:flex-row sm:items-center"
            >
              <SignInForm
                onSubmit={onSubmit}
                isGoogleLoginConfigured={isGoogleLoginConfigured}
                compact
              />
              <a
                href="#platform"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-pink-300 hover:text-pink-600 dark:border-white/12 dark:bg-transparent dark:text-white/82 dark:hover:border-white/25 dark:hover:bg-white/8 dark:hover:text-white"
              >
                Explore platform
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>

            <div className="mt-8 grid gap-3 text-sm text-slate-600 sm:grid-cols-3 dark:text-white/54">
              {heroPillars.map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-300" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-200/70 transition-colors duration-300 dark:border-white/10 dark:bg-white/[0.04] dark:shadow-black/30">
            <div className="mb-8 flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-pink-50 text-pink-600 dark:bg-pink-400/12 dark:text-pink-200">
                <Database className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-pink-600 dark:text-pink-200">
                  Platform map
                </p>
                <h2 className="mt-2 text-2xl font-semibold">
                  Everything on the public page points to code already in this
                  app.
                </h2>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ["Dashboard", "/dashboard"],
                ["Bucket", "/dashboard/bucket"],
                ["Functions", "/dashboard/functions"],
                ["API docs", "/dashboard/apidocs"],
                ["Usage", "/dashboard/usage"],
                ["Settings", "/dashboard/settings"],
              ].map(([label, route]) => (
                <div
                  key={label}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-[#0b0d14]"
                >
                  <p className="text-sm font-semibold">{label}</p>
                  <p className="mt-1 font-mono text-xs text-slate-500 dark:text-white/38">
                    {route}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section
        id="platform"
        className="scroll-mt-24 border-b border-slate-200 bg-slate-50 transition-colors duration-300 dark:border-white/10 dark:bg-[#07080d]"
      >
        <div className="mx-auto max-w-[22rem] px-5 py-20 sm:max-w-7xl sm:px-8 lg:px-10">
          <div className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-end">
            <div>
              <p className="text-sm font-semibold text-pink-600 dark:text-pink-200">
                Platform
              </p>
              <h2 className="mt-3 text-4xl font-semibold leading-tight">
                A full dashboard for Drive-backed data operations.
              </h2>
            </div>
            <p className="max-w-2xl text-base leading-7 text-slate-600 lg:ml-auto dark:text-white/56">
              The app already includes pages and components for records, files,
              server functions, SDK docs, account settings, backups, and usage.
              The landing page now explains that actual product surface.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {platformModules.map((module) => (
              <article
                key={module.title}
                className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/70 dark:border-white/10 dark:bg-white/[0.035] dark:shadow-none"
              >
                <div className="mb-8 flex h-11 w-11 items-center justify-center rounded-lg bg-pink-50 text-pink-600 dark:bg-pink-400/12 dark:text-pink-200">
                  <module.icon className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-semibold">{module.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-white/54">
                  {module.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        id="workflow"
        className="scroll-mt-24 border-b border-slate-200 bg-white transition-colors duration-300 dark:border-white/10 dark:bg-[#090b12]"
      >
        <div className="mx-auto max-w-[22rem] px-5 py-20 sm:max-w-7xl sm:px-8 lg:px-10">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-pink-600 dark:text-pink-200">
              Workflow
            </p>
            <h2 className="mt-3 text-4xl font-semibold leading-tight">
              From Drive folder to usable data platform in minutes.
            </h2>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {workflowSteps.map((step, index) => (
              <div
                key={step.title}
                className="rounded-lg border border-slate-200 bg-slate-50 p-6 shadow-sm shadow-slate-200/70 dark:border-white/10 dark:bg-white/[0.035] dark:shadow-none"
              >
                <div className="mb-8 flex h-10 w-10 items-center justify-center rounded-lg bg-slate-950 text-sm font-semibold text-white dark:bg-white dark:text-slate-950">
                  {index + 1}
                </div>
                <h3 className="text-xl font-semibold">{step.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-white/52">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="features"
        className="scroll-mt-24 border-b border-slate-200 bg-slate-50 transition-colors duration-300 dark:border-white/10 dark:bg-[#07080d]"
      >
        <div className="mx-auto max-w-[22rem] px-5 py-20 sm:max-w-7xl sm:px-8 lg:px-10">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <div>
              <p className="text-sm font-semibold text-pink-600 dark:text-pink-200">
                Features
              </p>
              <h2 className="mt-3 text-4xl font-semibold leading-tight">
                Built for teams that already live in Google Drive.
              </h2>
            </div>
            <p className="max-w-2xl text-base leading-7 text-slate-600 lg:ml-auto dark:text-white/56">
              Use Drive for storage and GDrive Database for the operational
              layer: records, schema, APIs, files, functions, and settings in
              one place.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {featureRows.map((feature) => (
              <article
                key={feature.title}
                className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/70 dark:border-white/10 dark:bg-white/[0.035] dark:shadow-none"
              >
                <div className="mb-8 flex h-11 w-11 items-center justify-center rounded-lg bg-pink-50 text-pink-600 dark:bg-pink-400/12 dark:text-pink-200">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-semibold">{feature.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-white/54">
                  {feature.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        id="schema"
        className="scroll-mt-24 border-b border-slate-200 bg-white transition-colors duration-300 dark:border-white/10 dark:bg-[#090b12]"
      >
        <div className="mx-auto grid max-w-[22rem] gap-8 px-5 py-20 sm:max-w-7xl sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:px-10">
          <div>
            <p className="text-sm font-semibold text-pink-600 dark:text-pink-200">
              Data model
            </p>
            <h2 className="mt-3 text-4xl font-semibold leading-tight">
              Schema where you need it, Drive ownership where you want it.
            </h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-600 dark:text-white/56">
              Define practical column types, relationships, storage fields, and
              defaults while keeping files and data anchored in Google Drive.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {schemaTypes.map((type) => (
              <div
                key={type}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-4 dark:border-white/10 dark:bg-white/[0.04]"
              >
                <span className="font-mono text-sm text-slate-800 dark:text-white/82">
                  {type}
                </span>
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="sdk"
        className="scroll-mt-24 border-b border-slate-200 bg-slate-50 transition-colors duration-300 dark:border-white/10 dark:bg-[#07080d]"
      >
        <div className="mx-auto grid max-w-[22rem] gap-8 px-5 py-20 sm:max-w-7xl sm:px-8 lg:grid-cols-[0.82fr_1.18fr] lg:px-10">
          <div>
            <p className="text-sm font-semibold text-pink-600 dark:text-pink-200">
              SDK
            </p>
            <h2 className="mt-3 text-4xl font-semibold leading-tight">
              A TypeScript client for data, schema, and bucket files.
            </h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-600 dark:text-white/56">
              The README documents the `gdatabase` package with chainable calls
              for tables, records, schema management, relations, and storage.
            </p>
          </div>

          <pre className="overflow-x-auto rounded-lg border border-slate-200 bg-slate-950 p-5 text-sm leading-7 text-slate-100 shadow-sm dark:border-white/10 dark:bg-[#0b0d14] dark:text-white/72">
            <code>{`const db = new GDatabase(apiKey, appUrl);

await db.database("crm").table("customers").create({
  name: "Ada Lovelace",
  status: "active",
});

const rows = await db
  .database("crm")
  .table("customers")
  .list();`}</code>
          </pre>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white transition-colors duration-300 dark:border-white/10 dark:bg-[#090b12]">
        <div className="mx-auto max-w-[22rem] px-5 py-20 sm:max-w-7xl sm:px-8 lg:px-10">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-pink-600 dark:text-pink-200">
              Use cases
            </p>
            <h2 className="mt-3 text-4xl font-semibold leading-tight">
              Useful when a full database is too much and spreadsheets are not
              enough.
            </h2>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {useCases.map((item) => (
              <div
                key={item}
                className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-5 shadow-sm shadow-slate-200/70 dark:border-white/10 dark:bg-white/[0.035] dark:shadow-none"
              >
                <Network className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-300" />
                <p className="text-base leading-7 text-slate-700 dark:text-white/72">
                  {item}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white transition-colors duration-300 dark:border-white/10 dark:bg-[#05060a]">
        <div className="mx-auto grid max-w-[22rem] gap-10 px-5 py-12 text-sm text-slate-600 sm:max-w-7xl sm:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr] sm:px-8 lg:px-10 dark:text-white/54">
          <div>
            <div className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt=""
                width={34}
                height={34}
                className="h-8 w-8 rounded-md"
              />
              <div>
                <p className="font-semibold text-slate-950 dark:text-white">
                  GDrive Database
                </p>
                <p className="text-xs text-slate-500 dark:text-white/40">
                  Drive-native database workspace
                </p>
              </div>
            </div>
            <p className="mt-5 max-w-sm leading-6">
              A NoSQL-style dashboard, SDK, and API layer powered by Google
              Drive ownership.
            </p>
          </div>

          <div>
            <p className="font-semibold text-slate-950 dark:text-white">
              Product
            </p>
            <div className="mt-4 grid gap-3">
              <a
                href="#platform"
                className="transition hover:text-slate-950 dark:hover:text-white"
              >
                Platform
              </a>
              <a
                href="#features"
                className="transition hover:text-slate-950 dark:hover:text-white"
              >
                Features
              </a>
              <a
                href="#schema"
                className="transition hover:text-slate-950 dark:hover:text-white"
              >
                Schema
              </a>
            </div>
          </div>

          <div>
            <p className="font-semibold text-slate-950 dark:text-white">
              Developers
            </p>
            <div className="mt-4 grid gap-3">
              <a
                href="#sdk"
                className="transition hover:text-slate-950 dark:hover:text-white"
              >
                SDK
              </a>
              <a
                href="#signin"
                className="transition hover:text-slate-950 dark:hover:text-white"
              >
                Sign in
              </a>
            </div>
          </div>

          <div>
            <p className="font-semibold text-slate-950 dark:text-white">Stack</p>
            <div className="mt-4 grid gap-3">
              <span className="flex items-center gap-2">
                <Files className="h-4 w-4" />
                Google Drive
              </span>
              <span className="flex items-center gap-2">
                <KeyRound className="h-4 w-4" />
                Google OAuth
              </span>
              <span className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Usage dashboard
              </span>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 dark:border-white/10">
          <div className="mx-auto flex max-w-[22rem] flex-col gap-3 px-5 py-6 text-xs text-slate-500 sm:max-w-7xl sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10 dark:text-white/36">
            <span>© 2026 GDrive Database</span>
            <span>Built for Drive-backed apps and internal tools.</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
