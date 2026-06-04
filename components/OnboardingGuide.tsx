"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Circle,
  Cloud,
  Database,
  KeyRound,
  LockKeyhole,
  Rows3,
  Table2,
} from "lucide-react";

type StepStatus = "complete" | "current" | "locked";
type StepIcon = "drive" | "database" | "table" | "rows" | "key";

export type OnboardingStep = {
  title: string;
  description: string;
  status: StepStatus;
  icon: StepIcon;
  actionLabel?: string;
  href?: string;
  action?: ReactNode;
};

type OnboardingGuideProps = {
  title: string;
  description: string;
  steps: OnboardingStep[];
  compact?: boolean;
  variant?: "default" | "dark";
};

const iconMap = {
  drive: Cloud,
  database: Database,
  table: Table2,
  rows: Rows3,
  key: KeyRound,
};

const statusLabel = {
  complete: "Done",
  current: "Next",
  locked: "Locked",
};

export default function OnboardingGuide({
  title,
  description,
  steps,
  compact = false,
  variant = "default",
}: OnboardingGuideProps) {
  const completeCount = steps.filter((step) => step.status === "complete").length;
  const progress = Math.round((completeCount / steps.length) * 100);

  return (
    <section
      className={`relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-900/5 dark:border-white/10 dark:bg-neutral-900/70 dark:shadow-none sm:p-5 ${
        variant === "dark" ? "dark" : ""
      }`}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-linear-to-br from-primary/10 via-blue-500/5 to-emerald-500/10 dark:from-primary/15 dark:via-blue-500/10 dark:to-emerald-500/10" />
      <div className="relative space-y-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="mb-2 inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              Setup guide
            </div>
            <h2 className="text-xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-2xl">
              {title}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-neutral-400">
              {description}
            </p>
          </div>
          <div className="w-full rounded-xl border border-slate-200 bg-white/75 p-3 dark:border-white/10 dark:bg-neutral-950/50 lg:w-64">
            <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-neutral-400">
              <span>
                {completeCount} of {steps.length} complete
              </span>
              <span>{progress}%</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-neutral-800">
              <div
                className="h-full rounded-full bg-linear-to-r from-primary to-emerald-400 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        <ol
          className={`grid gap-3 ${
            compact
              ? "md:grid-cols-2 xl:grid-cols-3"
              : "sm:grid-cols-2 xl:grid-cols-5"
          }`}
        >
          {steps.map((step, index) => {
            const Icon = iconMap[step.icon];
            const isComplete = step.status === "complete";
            const isCurrent = step.status === "current";
            const isLocked = step.status === "locked";

            return (
              <li
                key={step.title}
                className={`relative min-w-0 rounded-xl border p-4 transition ${
                  isCurrent
                    ? "border-primary/30 bg-primary/5 shadow-sm shadow-primary/10"
                    : isComplete
                    ? "border-emerald-500/20 bg-emerald-500/5"
                    : "border-slate-200 bg-slate-50/70 dark:border-white/10 dark:bg-neutral-950/40"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
                      isComplete
                        ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
                        : isCurrent
                        ? "border-primary/25 bg-primary/10 text-primary"
                        : "border-slate-200 bg-white text-slate-400 dark:border-white/10 dark:bg-neutral-900 dark:text-neutral-500"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[11px] font-semibold ${
                      isComplete
                        ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                        : isCurrent
                        ? "bg-primary/10 text-primary"
                        : "bg-slate-100 text-slate-500 dark:bg-neutral-800 dark:text-neutral-400"
                    }`}
                  >
                    {isComplete ? (
                      <CheckCircle2 className="h-3 w-3" />
                    ) : isLocked ? (
                      <LockKeyhole className="h-3 w-3" />
                    ) : (
                      <Circle className="h-3 w-3" />
                    )}
                    {statusLabel[step.status]}
                  </span>
                </div>

                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400 dark:text-neutral-500">
                    Step {index + 1}
                  </p>
                  <h3 className="mt-1 text-base font-semibold text-slate-950 dark:text-white">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-neutral-400">
                    {step.description}
                  </p>
                </div>

                {(step.action || step.href) && !isComplete && !isLocked && (
                  <div className="mt-4">
                    {step.action ? (
                      step.action
                    ) : (
                      <Link
                        href={step.href || "#"}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-primary/25 bg-white px-3 py-2 text-sm font-semibold text-primary shadow-sm transition hover:bg-primary/10 dark:bg-neutral-950"
                      >
                        {step.actionLabel || "Continue"}
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
