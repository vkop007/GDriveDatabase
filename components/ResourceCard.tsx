"use client";

import Link from "next/link";
import { Database, Table, Settings } from "lucide-react";
import CopyButton from "./CopyButton";
import GradientButton from "./GradientButton";

interface ResourceCardProps {
  name: string;
  id: string;
  createdTime: string | Date;
  type: "database" | "collection";
  href: string;
  onSettingsClick: (e: React.MouseEvent) => void;
}

export default function ResourceCard({
  name,
  id,
  createdTime,
  type,
  href,
  onSettingsClick,
}: ResourceCardProps) {
  const isDatabase = type === "database";

  // Color configurations based on type
  const theme = isDatabase
    ? {
        borderHover: "hover:border-primary/30",
        shadowHover: "hover:shadow-primary/10",
        gradientStart: "from-primary/5",
        gradientEnd: "to-primary/5",
        iconBoxGradientStart:
          "bg-linear-to-br from-slate-100 to-white dark:from-neutral-800 dark:to-neutral-900",
        iconBoxHoverStart: "group-hover:from-primary/20",
        iconBoxHoverEnd: "group-hover:to-primary/20",
        iconBoxBorderHover: "group-hover:border-primary/30",
        iconColor: "text-primary",
        iconHoverColor: "group-hover:text-primary",
        badgeBorderHover: "group-hover:border-primary/20",
        titleHover: "group-hover:text-primary",
        Icon: Database,
        buttonVariant: "pink" as const,
      }
    : {
        borderHover: "hover:border-primary/30",
        shadowHover: "hover:shadow-primary/10",
        gradientStart: "from-primary/5",
        gradientEnd: "to-primary/5",
        iconBoxGradientStart:
          "bg-linear-to-br from-slate-100 to-white dark:from-neutral-800 dark:to-neutral-900",
        iconBoxHoverStart: "group-hover:from-primary/20",
        iconBoxHoverEnd: "group-hover:to-primary/20",
        iconBoxBorderHover: "group-hover:border-primary/30",
        iconColor: "text-primary",
        iconHoverColor: "group-hover:text-primary",
        badgeBorderHover: "group-hover:border-primary/20",
        titleHover: "group-hover:text-primary",
        Icon: Table,
        buttonVariant: "pink" as const,
      };

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-900/5 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-white/5 dark:bg-neutral-900/50 ${theme.borderHover} ${theme.shadowHover}`}
    >
      {/* Gradient Glow */}
      <div
        className={`absolute inset-0 bg-linear-to-br ${theme.gradientStart} via-transparent ${theme.gradientEnd} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
      />

      <Link href={href} className="block p-6 relative z-10">
        <div className="flex items-start justify-between mb-6">
          <div
            className={`w-12 h-12 rounded-xl ${theme.iconBoxGradientStart} border border-slate-200 dark:border-white/10 flex items-center justify-center ${theme.iconBoxHoverStart} ${theme.iconBoxHoverEnd} ${theme.iconBoxBorderHover} transition-all duration-300 shadow-lg shadow-slate-900/5 dark:shadow-black/20`}
          >
            <theme.Icon
              className={`w-6 h-6 text-slate-500 dark:text-neutral-400 ${theme.iconHoverColor} transition-colors`}
            />
          </div>
          <span
            className={`text-[10px] font-medium text-slate-500 dark:text-neutral-500 bg-slate-100 dark:bg-neutral-900/50 border border-slate-200 dark:border-white/5 px-2 py-1 rounded-full ${theme.badgeBorderHover} transition-colors`}
          >
            {new Date(createdTime).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>

        <h3
          className={`text-lg font-semibold text-slate-950 dark:text-white truncate mb-1 ${theme.titleHover} transition-colors`}
          title={name}
        >
          {name}
        </h3>

        <div className="flex items-center gap-2 mb-2">
          <CopyButton text={id} label="ID" />
        </div>
      </Link>

      <div className="px-6 pb-6 pt-2 relative z-10">
        <GradientButton
          variant={theme.buttonVariant}
          className="w-full text-sm"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onSettingsClick(e);
          }}
          icon={<Settings className="w-4 h-4" />}
        >
          Settings
        </GradientButton>
      </div>
    </div>
  );
}
