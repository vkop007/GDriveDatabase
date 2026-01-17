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
        iconBoxGradientStart: "bg-linear-to-br from-neutral-800 to-neutral-900",
        iconBoxHoverStart: "group-hover:from-primary/20",
        iconBoxHoverEnd: "group-hover:to-primary/20",
        iconBoxBorderHover: "group-hover:border-primary/30",
        iconColor: "text-primary",
        iconHoverColor: "group-hover:text-primary",
        badgeBorderHover: "group-hover:border-primary/20",
        titleHover: "group-hover:text-primary-foreground",
        Icon: Database,
        buttonVariant: "pink" as const,
      }
    : {
        borderHover: "hover:border-primary/30",
        shadowHover: "hover:shadow-primary/10",
        gradientStart: "from-primary/5",
        gradientEnd: "to-primary/5",
        iconBoxGradientStart: "bg-linear-to-br from-neutral-800 to-neutral-900",
        iconBoxHoverStart: "group-hover:from-primary/20",
        iconBoxHoverEnd: "group-hover:to-primary/20",
        iconBoxBorderHover: "group-hover:border-primary/30",
        iconColor: "text-primary",
        iconHoverColor: "group-hover:text-primary",
        badgeBorderHover: "group-hover:border-primary/20",
        titleHover: "group-hover:text-primary-foreground",
        Icon: Table,
        buttonVariant: "pink" as const,
      };

  return (
    <div
      className={`group relative bg-neutral-900/50 backdrop-blur-sm border border-white/5 rounded-2xl overflow-hidden ${theme.borderHover} transition-all duration-300 hover:shadow-xl ${theme.shadowHover} hover:-translate-y-1`}
    >
      {/* Gradient Glow */}
      <div
        className={`absolute inset-0 bg-linear-to-br ${theme.gradientStart} via-transparent ${theme.gradientEnd} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
      />

      <Link href={href} className="block p-6 relative z-10">
        <div className="flex items-start justify-between mb-6">
          <div
            className={`w-12 h-12 rounded-xl ${theme.iconBoxGradientStart} border border-white/10 flex items-center justify-center ${theme.iconBoxHoverStart} ${theme.iconBoxHoverEnd} ${theme.iconBoxBorderHover} transition-all duration-300 shadow-lg`}
          >
            <theme.Icon
              className={`w-6 h-6 text-neutral-400 ${theme.iconHoverColor} transition-colors`}
            />
          </div>
          <span
            className={`text-[10px] font-medium text-neutral-500 bg-neutral-900/50 border border-white/5 px-2 py-1 rounded-full ${theme.badgeBorderHover} transition-colors`}
          >
            {new Date(createdTime).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>

        <h3
          className={`text-lg font-semibold text-white truncate mb-1 ${theme.titleHover} transition-colors`}
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
