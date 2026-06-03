"use client";

import {
  ChevronDown,
  ChevronRight,
  Database,
  Home,
  Settings,
  X,
  FileJson,
  Folder,
  FolderOpen,
  Pencil,
  PanelLeftClose,
  PanelLeft,
  Network,
  FunctionSquare,
  Gamepad2,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import RenameModal from "./RenameModal";
import ProfileMenu from "./ProfileMenu";
import ThemeToggle from "./ThemeToggle";
import type { AppSession } from "@/lib/gdrive/google-oauth";

interface SidebarProps {
  treeData: {
    id: string;
    name: string;
    tables: { id: string; name: string }[];
  }[];
  user: AppSession;
  logoutAction: () => Promise<void>;
}

function readSavedSidebarCollapsed() {
  if (typeof window === "undefined") return false;

  try {
    return Boolean(
      JSON.parse(localStorage.getItem("sidebar-collapsed") ?? "false")
    );
  } catch {
    return false;
  }
}

export default function Sidebar({ treeData, user, logoutAction }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false); // Mobile menu
  const [isCollapsed, setIsCollapsed] = useState(false); // Desktop collapse
  const [expandedDbs, setExpandedDbs] = useState<Set<string>>(new Set());
  const [renamingItem, setRenamingItem] = useState<{
    id: string;
    name: string;
    type: "database" | "collection";
    parentId?: string;
  } | null>(null);
  const activeDatabaseId =
    pathname.match(/\/dashboard\/database\/([^\/]+)/)?.[1] ?? null;

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setIsCollapsed(readSavedSidebarCollapsed());
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", JSON.stringify(isCollapsed));
    window.dispatchEvent(new Event("sidebar-collapsed-change"));
  }, [isCollapsed]);

  const toggleDb = (e: React.MouseEvent, dbId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const newExpanded = new Set(expandedDbs);
    if (newExpanded.has(dbId)) {
      newExpanded.delete(dbId);
    } else {
      newExpanded.add(dbId);
    }
    setExpandedDbs(newExpanded);
  };

  const toggleSidebar = () => {
    if (!isOpen) {
      setIsCollapsed(false);
    }
    setIsOpen(!isOpen);
  };
  const toggleCollapse = () => setIsCollapsed(!isCollapsed);

  const handleDatabaseClick = (dbId: string) => {
    router.push(`/dashboard/database/${dbId}`);
    if (!expandedDbs.has(dbId)) {
      setExpandedDbs(new Set(expandedDbs).add(dbId));
    }
  };

  const handleRename = (
    e: React.MouseEvent,
    item: {
      id: string;
      name: string;
      type: "database" | "collection";
      parentId?: string;
    }
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setRenamingItem(item);
  };

  const sidebarWidth = isCollapsed ? "w-16" : "w-64";

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-50 rounded-xl border border-slate-200 bg-white/90 p-2.5 text-slate-900 shadow-xl shadow-slate-900/10 backdrop-blur-md transition-all hover:scale-105 hover:border-primary/30 hover:bg-white active:scale-95 md:hidden dark:border-neutral-700/50 dark:bg-neutral-900/90 dark:text-white dark:hover:bg-neutral-800"
      >
        {isOpen ? <X className="w-5 h-5" /> : <PanelLeft className="w-5 h-5" />}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 animate-in bg-slate-950/40 backdrop-blur-md duration-200 fade-in md:hidden dark:bg-black/70"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 ${sidebarWidth} flex flex-col border-r border-slate-200 bg-white/95 text-slate-900 shadow-xl shadow-slate-900/5 backdrop-blur-xl transition-all duration-300 ease-out md:translate-x-0 dark:border-neutral-800/60 dark:bg-linear-to-b dark:from-[rgb(14,14,14)] dark:via-[rgb(10,10,10)] dark:to-[rgb(8,8,8)] dark:text-white dark:shadow-black/40 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{
          boxShadow: "var(--sidebar-shadow)",
        }}
      >
        {/* Subtle gradient overlay */}
        <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-primary/5 via-transparent to-transparent dark:from-primary/2" />

        {/* Header */}
        <div
          className={`relative flex items-center border-b border-slate-200 p-4 dark:border-neutral-800/50 ${
            isCollapsed ? "justify-center" : "gap-3"
          }`}
        >
          {/* Header glow */}
          <div className="pointer-events-none absolute left-0 right-0 top-0 h-24 bg-linear-to-b from-primary/8 to-transparent dark:from-primary/5" />

          <div className="relative">
            <Image
              src="/logo.png"
              alt="GDrive DB Logo"
              width={40}
              height={40}
              className="rounded-xl"
            />
          </div>
          {!isCollapsed && (
            <h1 className="relative text-lg font-bold tracking-tight text-slate-950 dark:text-white">
              GDrive DB
            </h1>
          )}
        </div>

        {/* Navigation */}
        <nav
          className={`relative flex-1 overflow-y-auto ${
            isCollapsed ? "p-2" : "p-3"
          } space-y-1 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-300 dark:scrollbar-thumb-neutral-700/50`}
        >
          {/* NAVIGATION SECTION */}
          <Link
            href="/dashboard"
            className={`group flex items-center ${
              isCollapsed ? "justify-center" : "gap-3"
            } px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              pathname === "/dashboard"
                ? "border border-primary/25 bg-primary/10 text-primary shadow-sm dark:bg-linear-to-r dark:from-primary-from/15 dark:to-primary-to/10 dark:shadow-lg dark:shadow-primary/10"
                : "border border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-100 hover:text-slate-950 dark:text-neutral-400 dark:hover:border-white/5 dark:hover:bg-white/5 dark:hover:text-white"
            }`}
            title={isCollapsed ? "Home" : undefined}
          >
            <Home
              className={`w-4 h-4 transition-all duration-200 ${
                pathname === "/dashboard"
                  ? "text-primary drop-shadow-sm"
                  : "group-hover:scale-110 group-hover:text-primary"
              }`}
            />
            {!isCollapsed && "Home"}
          </Link>

          {/* DATA MANAGEMENT SECTION */}
          {!isCollapsed && (
            <div className="pt-4 pb-3 px-1 flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <div className="h-px flex-1 bg-linear-to-r from-slate-200 via-slate-200 to-transparent dark:from-neutral-700/60 dark:via-neutral-600/30" />
                <span className="whitespace-nowrap px-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500 dark:text-neutral-500">
                  Databases
                </span>
                <div className="h-px flex-1 bg-linear-to-l from-slate-200 via-slate-200 to-transparent dark:from-neutral-700/60 dark:via-neutral-600/30" />
              </div>
              {treeData.length > 0 && (
                <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full font-semibold ml-1">
                  {treeData.length}
                </span>
              )}
            </div>
          )}

          {/* Database Tree */}
          <div className="space-y-0.5">
            {treeData.length === 0 ? (
              // Empty State
              !isCollapsed && (
                <div className="px-4 py-6 text-center">
                  <div className="flex justify-center mb-3">
                    <Folder className="h-8 w-8 text-slate-400 dark:text-neutral-600" />
                  </div>
                  <p className="text-xs text-slate-500 dark:text-neutral-500">
                    No databases yet
                  </p>
                </div>
              )
            ) : (
              treeData.map((db) => {
                const isExpanded =
                  expandedDbs.has(db.id) || activeDatabaseId === db.id;
                const isExactDb = pathname === `/dashboard/database/${db.id}`;

                if (isCollapsed) {
                  return (
                    <button
                      key={db.id}
                      onClick={() => handleDatabaseClick(db.id)}
                      className={`w-full flex items-center justify-center p-2.5 rounded-xl text-sm transition-all duration-200 ${
                        isExactDb
                          ? "border border-primary/25 bg-primary/10 text-primary"
                          : "border border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-100 hover:text-slate-950 dark:text-neutral-400 dark:hover:border-white/5 dark:hover:bg-white/5 dark:hover:text-white"
                      }`}
                      title={db.name}
                    >
                      <Folder className="w-4 h-4" />
                    </button>
                  );
                }

                return (
                  <div key={db.id} className="select-none">
                    <div
                      className={`group flex items-center gap-1 px-2 py-2 rounded-xl text-sm transition-all duration-200 cursor-pointer ${
                        isExactDb
                          ? "border border-primary/25 bg-primary/10 text-primary shadow-sm dark:bg-linear-to-r dark:from-primary-from/15 dark:to-primary-to/10 dark:text-white dark:shadow-lg dark:shadow-primary/10"
                          : "border border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-100 hover:text-slate-950 dark:text-neutral-400 dark:hover:border-white/5 dark:hover:bg-white/5 dark:hover:text-white"
                      }`}
                      onClick={() => handleDatabaseClick(db.id)}
                    >
                      <button
                        onClick={(e) => toggleDb(e, db.id)}
                        className="rounded-lg p-1 text-slate-400 transition-all duration-150 hover:bg-slate-200/70 hover:text-slate-950 dark:text-neutral-500 dark:hover:bg-white/10 dark:hover:text-white"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {isExpanded ? (
                          <FolderOpen
                            className={`w-4 h-4 transition-all duration-200 ${
                              isExactDb
                                ? "text-primary"
                                : "text-slate-500 group-hover:text-primary dark:text-neutral-500"
                            }`}
                          />
                        ) : (
                          <Folder
                            className={`w-4 h-4 transition-all duration-200 ${
                              isExactDb
                                ? "text-primary"
                                : "text-slate-500 group-hover:text-primary dark:text-neutral-500"
                            }`}
                          />
                        )}
                        <span className="truncate font-medium">{db.name}</span>
                      </div>

                      <button
                        onClick={(e) =>
                          handleRename(e, {
                            id: db.id,
                            name: db.name,
                            type: "database",
                          })
                        }
                        className="rounded-lg p-1.5 text-slate-400 opacity-0 transition-all duration-150 hover:bg-slate-200/70 hover:text-slate-950 group-hover:opacity-100 dark:text-neutral-500 dark:hover:bg-white/10 dark:hover:text-white"
                        title="Rename Database"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Animated tables container using CSS Grid for smooth animation */}
                    <div
                      className="grid transition-[grid-template-rows] duration-300 ease-out"
                      style={{
                        gridTemplateRows:
                          isExpanded && !isCollapsed ? "1fr" : "0fr",
                      }}
                    >
                      <div className="overflow-hidden">
                        {db.tables.length > 0 && (
                          <div className="ml-4 mt-1 space-y-0.5 border-l border-slate-200 pl-3 dark:border-neutral-700/40">
                            {db.tables.map((table) => {
                              const isTableActive =
                                pathname ===
                                `/dashboard/database/${db.id}/table/${table.id}`;
                              return (
                                <Link
                                  key={table.id}
                                  href={`/dashboard/database/${db.id}/table/${table.id}`}
                                  className={`group flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all duration-200 ${
                                    isTableActive
                                      ? "border border-primary/25 bg-primary/10 text-primary dark:bg-linear-to-r dark:from-primary-from/15 dark:to-primary-to/10"
                                      : "border border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-100 hover:text-slate-950 dark:text-neutral-400 dark:hover:border-white/5 dark:hover:bg-white/5 dark:hover:text-white"
                                  }`}
                                >
                                  <FileJson
                                    className={`w-3.5 h-3.5 transition-all duration-200 ${
                                      isTableActive
                                        ? "text-primary"
                                        : "text-slate-500 group-hover:text-primary dark:text-neutral-500"
                                    }`}
                                  />
                                  <span className="truncate flex-1">
                                    {table.name}
                                  </span>
                                  <button
                                    onClick={(e) =>
                                      handleRename(e, {
                                        id: table.id,
                                        name: table.name,
                                        type: "collection",
                                        parentId: db.id,
                                      })
                                    }
                                    className="p-1 text-slate-400 opacity-0 transition-all duration-150 hover:text-slate-950 group-hover:opacity-100 dark:text-neutral-500 dark:hover:text-white"
                                    title="Rename Collection"
                                  >
                                    <Pencil className="w-3 h-3" />
                                  </button>
                                </Link>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* TOOLS SECTION */}
          {!isCollapsed && (
            <div className="pt-4 pb-2 px-1">
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-linear-to-r from-slate-200 via-slate-200 to-transparent dark:from-neutral-700/60 dark:via-neutral-600/30" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500 dark:text-neutral-500">
                  Tools
                </span>
                <div className="h-px flex-1 bg-linear-to-l from-slate-200 via-slate-200 to-transparent dark:from-neutral-700/60 dark:via-neutral-600/30" />
              </div>
            </div>
          )}

          {/* API Docs */}
          <Link
            href="/dashboard/apidocs"
            className={`group flex items-center ${
              isCollapsed ? "justify-center" : "gap-3"
            } px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              pathname === "/dashboard/apidocs"
                ? "border border-primary/25 bg-primary/10 text-primary shadow-sm dark:bg-linear-to-r dark:from-primary-from/15 dark:to-primary-to/10 dark:shadow-lg dark:shadow-primary/10"
                : "border border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-100 hover:text-slate-950 dark:text-neutral-400 dark:hover:border-white/5 dark:hover:bg-white/5 dark:hover:text-white"
            }`}
            title={isCollapsed ? "API Docs" : undefined}
          >
            <FileJson
              className={`w-4 h-4 transition-all duration-200 ${
                pathname === "/dashboard/apidocs"
                  ? "text-primary drop-shadow-sm"
                  : "group-hover:scale-110 group-hover:text-primary"
              }`}
            />
            {!isCollapsed && "API Docs"}
          </Link>

          {/* Analyzer */}
          <Link
            href="/dashboard/analyzer"
            className={`group flex items-center ${
              isCollapsed ? "justify-center" : "gap-3"
            } px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              pathname === "/dashboard/analyzer"
                ? "border border-primary/25 bg-primary/10 text-primary shadow-sm dark:bg-linear-to-r dark:from-primary-from/15 dark:to-primary-to/10 dark:shadow-lg dark:shadow-primary/10"
                : "border border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-100 hover:text-slate-950 dark:text-neutral-400 dark:hover:border-white/5 dark:hover:bg-white/5 dark:hover:text-white"
            }`}
            title={isCollapsed ? "Analyzer" : undefined}
          >
            <Network
              className={`w-4 h-4 transition-all duration-200 ${
                pathname === "/dashboard/analyzer"
                  ? "text-primary drop-shadow-sm"
                  : "group-hover:scale-110 group-hover:text-primary"
              }`}
            />
            {!isCollapsed && "Analyzer"}
          </Link>

          {/* Functions */}
          <Link
            href="/dashboard/functions"
            className={`group flex items-center ${
              isCollapsed ? "justify-center" : "gap-3"
            } px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              pathname === "/dashboard/functions"
                ? "border border-primary/25 bg-primary/10 text-primary shadow-sm dark:bg-linear-to-r dark:from-primary-from/15 dark:to-primary-to/10 dark:shadow-lg dark:shadow-primary/10"
                : "border border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-100 hover:text-slate-950 dark:text-neutral-400 dark:hover:border-white/5 dark:hover:bg-white/5 dark:hover:text-white"
            }`}
            title={isCollapsed ? "Functions" : undefined}
          >
            <FunctionSquare
              className={`w-4 h-4 transition-all duration-200 ${
                pathname === "/dashboard/functions"
                  ? "text-primary drop-shadow-sm"
                  : "group-hover:scale-110 group-hover:text-primary"
              }`}
            />
            {!isCollapsed && "Functions"}
          </Link>

          {/* API Playground */}
          <Link
            href="/dashboard/playground"
            className={`group flex items-center ${
              isCollapsed ? "justify-center" : "gap-3"
            } px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              pathname === "/dashboard/playground"
                ? "border border-primary/25 bg-primary/10 text-primary shadow-sm dark:bg-linear-to-r dark:from-primary-from/15 dark:to-primary-to/10 dark:shadow-lg dark:shadow-primary/10"
                : "border border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-100 hover:text-slate-950 dark:text-neutral-400 dark:hover:border-white/5 dark:hover:bg-white/5 dark:hover:text-white"
            }`}
            title={isCollapsed ? "Playground" : undefined}
          >
            <Gamepad2
              className={`w-4 h-4 transition-all duration-200 ${
                pathname === "/dashboard/playground"
                  ? "text-primary drop-shadow-sm"
                  : "group-hover:scale-110 group-hover:text-primary"
              }`}
            />
            {!isCollapsed && "Playground"}
          </Link>

          {/* STORAGE SECTION */}
          {!isCollapsed && (
            <div className="pt-4 pb-3 px-1">
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-linear-to-r from-slate-200 via-slate-200 to-transparent dark:from-neutral-700/60 dark:via-neutral-600/30" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500 dark:text-neutral-500">
                  Storage
                </span>
                <div className="h-px flex-1 bg-linear-to-l from-slate-200 via-slate-200 to-transparent dark:from-neutral-700/60 dark:via-neutral-600/30" />
              </div>
            </div>
          )}
          <Link
            href="/dashboard/bucket"
            className={`group flex items-center ${
              isCollapsed ? "justify-center" : "gap-3"
            } px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              pathname === "/dashboard/bucket"
                ? "border border-primary/25 bg-primary/10 text-primary shadow-sm dark:bg-linear-to-r dark:from-primary-from/15 dark:to-primary-to/10 dark:shadow-lg dark:shadow-primary/10"
                : "border border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-100 hover:text-slate-950 dark:text-neutral-400 dark:hover:border-white/5 dark:hover:bg-white/5 dark:hover:text-white"
            }`}
            title={isCollapsed ? "Bucket" : undefined}
          >
            <Database
              className={`w-4 h-4 transition-all duration-200 ${
                pathname === "/dashboard/bucket"
                  ? "text-primary drop-shadow-sm"
                  : "group-hover:scale-110 group-hover:text-primary"
              }`}
            />
            {!isCollapsed && "Bucket"}
          </Link>

          {/* SYSTEM SECTION */}
          {!isCollapsed && (
            <div className="pt-4 pb-3 px-1">
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-linear-to-r from-slate-200 via-slate-200 to-transparent dark:from-neutral-700/60 dark:via-neutral-600/30" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500 dark:text-neutral-500">
                  System
                </span>
                <div className="h-px flex-1 bg-linear-to-l from-slate-200 via-slate-200 to-transparent dark:from-neutral-700/60 dark:via-neutral-600/30" />
              </div>
            </div>
          )}

          <Link
            href="/dashboard/usage"
            className={`group flex items-center ${
              isCollapsed ? "justify-center" : "gap-3"
            } px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              pathname === "/dashboard/usage"
                ? "border border-primary/25 bg-primary/10 text-primary shadow-sm dark:bg-linear-to-r dark:from-primary-from/15 dark:to-primary-to/10 dark:shadow-lg dark:shadow-primary/10"
                : "border border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-100 hover:text-slate-950 dark:text-neutral-400 dark:hover:border-white/5 dark:hover:bg-white/5 dark:hover:text-white"
            }`}
            title={isCollapsed ? "Usage" : undefined}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`w-4 h-4 transition-all duration-200 ${
                pathname === "/dashboard/usage"
                  ? "text-primary drop-shadow-sm"
                  : "group-hover:scale-110 group-hover:text-primary"
              }`}
            >
              <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
              <path d="M22 12A10 10 0 0 0 12 2v10z" />
            </svg>
            {!isCollapsed && "Usage"}
          </Link>

          <Link
            href="/dashboard/settings"
            className={`group flex items-center ${
              isCollapsed ? "justify-center" : "gap-3"
            } px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              pathname === "/dashboard/settings"
                ? "border border-primary/25 bg-primary/10 text-primary shadow-sm dark:bg-linear-to-r dark:from-primary-from/15 dark:to-primary-to/10 dark:shadow-lg dark:shadow-primary/10"
                : "border border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-100 hover:text-slate-950 dark:text-neutral-400 dark:hover:border-white/5 dark:hover:bg-white/5 dark:hover:text-white"
            }`}
            title={isCollapsed ? "Settings" : undefined}
          >
            <Settings
              className={`w-4 h-4 transition-all duration-200 ${
                pathname === "/dashboard/settings"
                  ? "text-primary drop-shadow-sm"
                  : "group-hover:scale-110 group-hover:text-primary"
              }`}
            />
            {!isCollapsed && "Settings"}
          </Link>
        </nav>

        {/* Footer Account */}
        <div
          className={`relative border-t border-slate-200 p-3 dark:border-neutral-800/50 ${
            isCollapsed
              ? "flex flex-col items-center justify-center gap-2"
              : "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2"
          }`}
        >
          <ProfileMenu
            user={user}
            logoutAction={logoutAction}
            variant="sidebar"
            collapsed={isCollapsed}
          />
          <ThemeToggle collapsed />
        </div>

        {/* Collapse Toggle Button - Centered on right edge */}
        <style>{`
          .sidebar-toggle-icon {
            transition: all 400ms cubic-bezier(0.34, 1.56, 0.64, 1);
          }
          .sidebar-toggle-icon.rotate {
            transform: rotate(180deg);
          }
        `}</style>
        <button
          onClick={toggleCollapse}
          className="absolute top-1/2 -right-4 z-50 hidden h-16 w-8 -translate-y-1/2 transform items-center justify-center rounded-r-2xl border border-l-0 border-slate-200 bg-white/80 backdrop-blur-xl transition-all duration-300 hover:scale-125 active:scale-95 md:flex dark:border-neutral-800/70 dark:bg-neutral-950/70"
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <div className="relative flex items-center justify-center">
            {/* Multiple glow layers */}
            <div className="absolute inset-0 bg-primary rounded-lg blur-xl opacity-0 group-hover:opacity-30 transition-all duration-300" />
            <div className="absolute inset-1 bg-primary-from rounded-lg blur-md opacity-0 group-hover:opacity-20 transition-all duration-300" />
            
            {/* Icon with enhanced effects */}
            <div
              className={`sidebar-toggle-icon relative text-slate-500 transition-all duration-400 drop-shadow-[0_0_8px_rgba(236,72,153,0)] group-hover:text-primary group-hover:drop-shadow-[0_0_16px_rgba(236,72,153,0.8)] dark:text-neutral-400 ${
                !isCollapsed ? "rotate" : ""
              }`}
            >
              {isCollapsed ? (
                <PanelLeft className="w-4 h-4" />
              ) : (
                <PanelLeftClose className="w-4 h-4" />
              )}
            </div>

            {/* Active state indicator */}
            {!isCollapsed && (
              <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            )}
          </div>
        </button>
      </aside>

      {renamingItem && (
        <RenameModal
          isOpen={!!renamingItem}
          onClose={() => setRenamingItem(null)}
          currentName={renamingItem.name}
          itemId={renamingItem.id}
          itemType={renamingItem.type as "database" | "collection"}
          parentId={renamingItem.parentId}
        />
      )}
    </>
  );
}
