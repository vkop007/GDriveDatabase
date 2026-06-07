"use client";

import Image from "next/image";
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
  Mail,
  Moon,
  Network,
  Rows3,
  Search,
  Settings2,
  Sun,
  UploadCloud,
  Workflow,
} from "lucide-react";
import { useTheme } from "./ThemeProvider";

interface LoginClientProps {
  sdkCodeHtml: string;
}

const workflowSteps = [
  {
    title: "Connect Google Drive",
    description:
      "Sign in with email, then connect the Drive workspace that should hold your data.",
    icon: Cloud,
    accent: "text-emerald-600 dark:text-emerald-300",
    surface: "bg-emerald-50 dark:bg-emerald-400/10",
  },
  {
    title: "Model your data",
    description:
      "Create databases, tables, columns, relations, storage fields, and defaults from the dashboard.",
    icon: Database,
    accent: "text-sky-600 dark:text-sky-300",
    surface: "bg-sky-50 dark:bg-sky-400/10",
  },
  {
    title: "Build with APIs",
    description:
      "Use the TypeScript SDK, generated API docs, file bucket, and server functions to ship apps faster.",
    icon: Code2,
    accent: "text-pink-600 dark:text-pink-200",
    surface: "bg-pink-50 dark:bg-pink-400/10",
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

const sdkBadges = ["CRUD", "schema", "relations", "bucket", "functions"];

function HeaderSignInLink() {
  return (
    <a
      href="/signin"
      className="inline-flex h-9 shrink-0 items-center justify-center whitespace-nowrap rounded-lg border border-slate-200 bg-white/85 px-3.5 text-sm font-semibold text-slate-900 shadow-sm transition hover:border-slate-300 hover:bg-white hover:text-slate-950 dark:border-white/12 dark:bg-white/8 dark:text-white dark:hover:border-white/22 dark:hover:bg-white/12"
    >
      Sign in
    </a>
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
      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white/85 text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-white hover:text-slate-950 dark:border-white/12 dark:bg-white/8 dark:text-white/78 dark:hover:border-white/22 dark:hover:bg-white/12 dark:hover:text-white"
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}

export default function LoginClient({
  sdkCodeHtml,
}: LoginClientProps) {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[linear-gradient(180deg,#f8fafc_0%,#fdf2f8_24%,#ecfdf5_54%,#eef2ff_78%,#f8fafc_100%)] text-slate-950 transition-colors duration-300 dark:bg-[linear-gradient(180deg,#07080d_0%,#120c16_28%,#07110f_58%,#0d1020_78%,#05060a_100%)] dark:text-white">
      <section className="relative isolate overflow-hidden border-b border-slate-200 transition-colors duration-300 dark:border-white/10">
        <div className="absolute inset-0 -z-10">
          <div className="h-full w-full bg-[url('/logo.png')] bg-[length:34rem_34rem] bg-[position:78%_12%] bg-no-repeat opacity-[0.045] dark:opacity-[0.035]" />
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(248,250,252,0.78)_0%,rgba(253,242,248,0.82)_38%,rgba(236,253,245,0.72)_70%,rgba(239,246,255,0.90)_100%)] dark:bg-[linear-gradient(135deg,rgba(7,8,13,0.78)_0%,rgba(18,12,22,0.82)_42%,rgba(7,17,15,0.76)_72%,rgba(13,16,32,0.90)_100%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.055)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.055)_1px,transparent_1px)] bg-[size:72px_72px] opacity-70 dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.055)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.055)_1px,transparent_1px)] dark:opacity-30" />
        </div>

        <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/70 backdrop-blur-xl dark:border-white/10 dark:bg-[#07080d]/70">
          <div className="mx-auto flex w-full max-w-[22rem] items-center justify-between px-5 py-4 sm:max-w-7xl sm:px-8 lg:px-10">
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
            <HeaderSignInLink />
          </div>
          </div>
        </header>

        <div className="mx-auto flex min-h-[calc(100vh-4.5rem)] w-full max-w-[22rem] flex-col items-center justify-center px-5 py-16 text-center sm:max-w-4xl sm:px-8 md:py-20 lg:px-10">
          <Image
            src="/logo.png"
            alt=""
            width={72}
            height={72}
            className="mb-8 h-16 w-16 rounded-2xl"
            priority
          />

          <h1 className="max-w-4xl text-4xl font-semibold leading-[1.05] sm:text-6xl lg:text-7xl">
            Build database apps on Google Drive.
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8 dark:text-white/64">
            GDrive Database gives your Drive files a structured dashboard,
            tables, storage, functions, SDK access, and API docs without running
            a separate database server.
          </p>

          <form
            action="/signin"
            method="get"
            className="mt-9 flex w-full max-w-xl flex-col gap-3 rounded-2xl border border-slate-200 bg-white/82 p-2 shadow-2xl shadow-slate-200/70 backdrop-blur sm:flex-row dark:border-white/10 dark:bg-white/[0.055] dark:shadow-black/25"
          >
            <input type="hidden" name="mode" value="signup" />
            <label className="flex min-w-0 flex-1 items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 text-left text-slate-500 ring-1 ring-inset ring-slate-200 focus-within:ring-pink-300 dark:bg-black/20 dark:text-white/45 dark:ring-white/10 dark:focus-within:ring-pink-400/40">
              <Mail className="h-4 w-4 shrink-0" />
              <span className="sr-only">Email address</span>
              <input
                required
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                className="min-w-0 flex-1 bg-transparent text-sm text-slate-950 outline-none placeholder:text-slate-400 dark:text-white"
              />
            </label>
            <button
              type="submit"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white shadow-lg shadow-black/15 transition hover:-translate-y-0.5 hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
            >
              Sign up with email
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <p className="mt-4 text-sm text-slate-500 dark:text-white/42">
            Already have an account?{" "}
            <a
              href="/signin"
              className="font-semibold text-slate-900 underline-offset-4 transition hover:text-pink-600 hover:underline dark:text-white dark:hover:text-pink-200"
            >
              Sign in
            </a>
          </p>
        </div>
      </section>

      <section
        id="platform"
        className="scroll-mt-24 border-b border-slate-200 bg-[linear-gradient(135deg,rgba(248,250,252,0.94)_0%,rgba(253,242,248,0.72)_52%,rgba(236,253,245,0.70)_100%)] transition-colors duration-300 dark:border-white/10 dark:bg-[linear-gradient(135deg,rgba(7,8,13,0.98)_0%,rgba(18,12,22,0.82)_52%,rgba(7,17,15,0.74)_100%)]"
      >
        <div className="mx-auto max-w-[22rem] px-5 py-16 sm:max-w-7xl sm:px-8 md:py-[4.5rem] lg:px-10">
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
              Each surface maps to a practical dashboard workflow.
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
        className="scroll-mt-24 border-b border-slate-200 bg-[linear-gradient(135deg,rgba(255,255,255,0.96)_0%,rgba(240,249,255,0.76)_50%,rgba(255,247,237,0.66)_100%)] transition-colors duration-300 dark:border-white/10 dark:bg-[linear-gradient(135deg,rgba(9,11,18,0.98)_0%,rgba(8,18,24,0.82)_50%,rgba(22,14,10,0.76)_100%)]"
      >
        <div className="mx-auto max-w-[22rem] px-5 py-16 sm:max-w-7xl sm:px-8 md:py-[4.5rem] lg:px-10">
          <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-end">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold text-pink-600 dark:text-pink-200">
                Workflow
              </p>
              <h2 className="mt-3 text-4xl font-semibold leading-tight">
                From Drive folder to usable data platform in minutes.
              </h2>
            </div>
            <p className="max-w-2xl text-base leading-7 text-slate-600 lg:ml-auto dark:text-white/56">
              Every step maps to a real area of the dashboard: OAuth, Drive
              workspace setup, schema modeling, bucket files, functions, and
              generated SDK examples.
            </p>
          </div>

          <div className="relative mt-10 grid gap-4 md:grid-cols-3">
            <div className="absolute left-[16%] right-[16%] top-10 hidden h-px bg-slate-200 md:block dark:bg-white/10" />
            {workflowSteps.map((step, index) => (
              <div
                key={step.title}
                className="relative rounded-lg border border-slate-200 bg-slate-50 p-6 shadow-sm shadow-slate-200/70 dark:border-white/10 dark:bg-white/[0.035] dark:shadow-none"
              >
                <div className="mb-8 flex items-center justify-between">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-lg ${step.surface} ${step.accent}`}
                  >
                    <step.icon className="h-5 w-5" />
                  </div>
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-sm font-semibold text-slate-700 shadow-sm dark:border-white/12 dark:bg-white/10 dark:text-white">
                    {index + 1}
                  </span>
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
        className="scroll-mt-24 border-b border-slate-200 bg-[linear-gradient(135deg,rgba(248,250,252,0.94)_0%,rgba(238,242,255,0.72)_48%,rgba(253,242,248,0.70)_100%)] transition-colors duration-300 dark:border-white/10 dark:bg-[linear-gradient(135deg,rgba(7,8,13,0.98)_0%,rgba(13,16,32,0.84)_48%,rgba(18,12,22,0.76)_100%)]"
      >
        <div className="mx-auto max-w-[22rem] px-5 py-16 sm:max-w-7xl sm:px-8 md:py-[4.5rem] lg:px-10">
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
            {featureRows.map((feature, index) => (
              <article
                key={feature.title}
                className={`rounded-lg border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/70 transition hover:-translate-y-0.5 hover:border-slate-300 dark:border-white/10 dark:bg-white/[0.035] dark:shadow-none dark:hover:border-white/20 ${
                  index === 0
                    ? "border-emerald-200 bg-[linear-gradient(135deg,rgba(255,255,255,0.98)_0%,rgba(236,253,245,0.82)_100%)] dark:border-emerald-400/20 dark:bg-emerald-400/10"
                    : ""
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${
                      index === 0
                        ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-300"
                        : "bg-pink-50 text-pink-600 dark:bg-pink-400/12 dark:text-pink-200"
                    }`}
                  >
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">{feature.title}</h3>
                    <p
                      className={`mt-3 text-sm leading-6 ${
                        index === 0
                          ? "text-slate-600 dark:text-white/54"
                          : "text-slate-600 dark:text-white/54"
                      }`}
                    >
                      {feature.description}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        id="schema"
        className="scroll-mt-24 border-b border-slate-200 bg-[linear-gradient(135deg,rgba(255,255,255,0.96)_0%,rgba(236,253,245,0.70)_48%,rgba(240,249,255,0.74)_100%)] transition-colors duration-300 dark:border-white/10 dark:bg-[linear-gradient(135deg,rgba(9,11,18,0.98)_0%,rgba(7,17,15,0.80)_48%,rgba(8,18,24,0.78)_100%)]"
      >
        <div className="mx-auto grid max-w-[22rem] gap-8 px-5 py-16 sm:max-w-7xl sm:px-8 md:py-[4.5rem] lg:grid-cols-[0.9fr_1.1fr] lg:px-10">
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
        className="scroll-mt-24 border-b border-slate-200 bg-[linear-gradient(135deg,rgba(248,250,252,0.94)_0%,rgba(253,242,248,0.72)_46%,rgba(15,23,42,0.06)_100%)] transition-colors duration-300 dark:border-white/10 dark:bg-[linear-gradient(135deg,rgba(7,8,13,0.98)_0%,rgba(18,12,22,0.82)_46%,rgba(15,23,42,0.86)_100%)]"
      >
        <div className="mx-auto grid max-w-[22rem] gap-8 px-5 py-16 sm:max-w-7xl sm:px-8 md:py-[4.5rem] lg:grid-cols-[0.78fr_1.22fr] lg:items-start lg:px-10">
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
            <div className="mt-6 flex flex-wrap gap-2">
              {sdkBadges.map((badge) => (
                <span
                  key={badge}
                  className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/58"
                >
                  {badge}
                </span>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-slate-200 bg-[#101010] shadow-2xl shadow-slate-200/70 dark:border-white/10 dark:shadow-black/35">
            <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.035] px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              </div>
              <span className="font-mono text-xs text-white/42">
                sdk-example.ts
              </span>
            </div>
            <div
              className="[&_pre]:m-0 [&_pre]:max-h-[34rem] [&_pre]:overflow-x-auto [&_pre]:p-5 [&_pre]:text-sm [&_pre]:leading-7 [&_pre_code]:font-mono"
              dangerouslySetInnerHTML={{ __html: sdkCodeHtml }}
            />
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-[linear-gradient(135deg,rgba(255,255,255,0.96)_0%,rgba(255,247,237,0.66)_50%,rgba(236,253,245,0.70)_100%)] transition-colors duration-300 dark:border-white/10 dark:bg-[linear-gradient(135deg,rgba(9,11,18,0.98)_0%,rgba(22,14,10,0.76)_50%,rgba(7,17,15,0.78)_100%)]">
        <div className="mx-auto max-w-[22rem] px-5 py-16 sm:max-w-7xl sm:px-8 md:py-[4.5rem] lg:px-10">
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

      <footer className="border-t border-slate-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.94)_0%,rgba(248,250,252,0.98)_100%)] transition-colors duration-300 dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(5,6,10,0.94)_0%,rgba(3,4,8,0.98)_100%)]">
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
                Email auth
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
