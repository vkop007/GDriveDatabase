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
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import RenameModal from "./RenameModal";

interface SidebarProps {
  treeData: {
    id: string;
    name: string;
    tables: { id: string; name: string }[];
  }[];
}

export default function Sidebar({ treeData }: SidebarProps) {
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

  // Persist collapse state
  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved) setIsCollapsed(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  // Auto-expand parent database when viewing a table or collection page
  useEffect(() => {
    // Check if we're on a database or table page
    const databaseMatch = pathname.match(/\/dashboard\/database\/([^\/]+)/);
    if (databaseMatch) {
      const dbId = databaseMatch[1];
      if (!expandedDbs.has(dbId)) {
        setExpandedDbs((prev) => new Set(prev).add(dbId));
      }
    }
  }, [pathname]);

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

  const toggleSidebar = () => setIsOpen(!isOpen);
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
        className="fixed top-4 left-4 z-50 p-2 bg-neutral-900/80 backdrop-blur-sm border border-neutral-700/50 rounded-xl md:hidden text-white hover:bg-neutral-800 transition-all hover:scale-105 active:scale-95 shadow-lg"
      >
        {isOpen ? <X className="w-5 h-5" /> : <PanelLeft className="w-5 h-5" />}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-md"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 ${sidebarWidth} bg-linear-to-b from-[rgb(12,12,12)] to-[rgb(8,8,8)] border-r border-neutral-800/50 transform transition-all duration-300 ease-out md:translate-x-0 flex flex-col ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{
          boxShadow: "4px 0 24px rgba(0, 0, 0, 0.3)",
        }}
      >
        {/* Header */}
        <div
          className={`p-4 border-b border-neutral-800/50 flex items-center ${
            isCollapsed ? "justify-center" : "gap-3"
          }`}
        >
          <div className="relative group">
            <div className="absolute inset-0 bg-linear-to-br from-purple-500 to-pink-500 rounded-xl blur-md opacity-50 group-hover:opacity-70 transition-opacity" />
            <div className="relative w-9 h-9 rounded-xl bg-linear-to-br from-purple-500 via-fuchsia-500 to-pink-500 flex items-center justify-center shadow-lg">
              <Database className="w-4 h-4 text-white" />
            </div>
          </div>
          {!isCollapsed && (
            <h1 className="text-lg font-bold text-white tracking-tight">
              GDrive DB
            </h1>
          )}
        </div>

        {/* Navigation */}
        <nav
          className={`flex-1 overflow-y-auto ${
            isCollapsed ? "p-2" : "p-3"
          } space-y-1 scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-transparent`}
        >
          {/* Home */}
          <Link
            href="/dashboard"
            className={`group flex items-center ${
              isCollapsed ? "justify-center" : "gap-3"
            } px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              pathname === "/dashboard"
                ? "bg-linear-to-r from-purple-500/20 to-pink-500/10 text-white border border-purple-500/30 shadow-lg shadow-purple-500/10"
                : "text-neutral-400 hover:text-white hover:bg-neutral-800/50"
            }`}
            title={isCollapsed ? "Home" : undefined}
          >
            <Home
              className={`w-4 h-4 ${
                pathname === "/dashboard"
                  ? "text-purple-400"
                  : "group-hover:text-purple-400"
              } transition-colors`}
            />
            {!isCollapsed && "Home"}
          </Link>

          {/* API Docs */}
          <Link
            href="/dashboard/apidocs"
            className={`group flex items-center ${
              isCollapsed ? "justify-center" : "gap-3"
            } px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              pathname === "/dashboard/apidocs"
                ? "bg-linear-to-r from-purple-500/20 to-pink-500/10 text-white border border-purple-500/30 shadow-lg shadow-purple-500/10"
                : "text-neutral-400 hover:text-white hover:bg-neutral-800/50"
            }`}
            title={isCollapsed ? "API Docs" : undefined}
          >
            <FileJson
              className={`w-4 h-4 ${
                pathname === "/dashboard/apidocs"
                  ? "text-purple-400"
                  : "group-hover:text-purple-400"
              } transition-colors`}
            />
            {!isCollapsed && "API Docs"}
          </Link>

          {/* Explorer Section */}
          {!isCollapsed && (
            <div className="pt-6 pb-2 px-3">
              <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-linear-to-r from-neutral-700/50 to-transparent" />
                <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-widest">
                  Explorer
                </span>
                <div className="h-px flex-1 bg-linear-to-l from-neutral-700/50 to-transparent" />
              </div>
            </div>
          )}

          {/* Database Tree */}
          <div className="space-y-0.5">
            {treeData.map((db) => {
              const isExpanded = expandedDbs.has(db.id);
              const isExactDb = pathname === `/dashboard/database/${db.id}`;

              if (isCollapsed) {
                return (
                  <button
                    key={db.id}
                    onClick={() => handleDatabaseClick(db.id)}
                    className={`w-full flex items-center justify-center p-2.5 rounded-xl text-sm transition-all ${
                      isExactDb
                        ? "bg-linear-to-r from-blue-500/20 to-cyan-500/10 text-blue-400 border border-blue-500/30"
                        : "text-neutral-400 hover:text-white hover:bg-neutral-800/50"
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
                    className={`group flex items-center gap-1 px-2 py-2 rounded-xl text-sm transition-all cursor-pointer ${
                      isExactDb
                        ? "bg-linear-to-r from-blue-500/20 to-cyan-500/10 text-white border border-blue-500/30 shadow-lg shadow-blue-500/5"
                        : "text-neutral-400 hover:text-white hover:bg-neutral-800/50"
                    }`}
                    onClick={() => handleDatabaseClick(db.id)}
                  >
                    <button
                      onClick={(e) => toggleDb(e, db.id)}
                      className="p-1 rounded-lg hover:bg-neutral-700/50 text-neutral-500 hover:text-white transition-all"
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
                          className={`w-4 h-4 ${
                            isExactDb
                              ? "text-blue-400"
                              : "text-neutral-500 group-hover:text-blue-400"
                          } transition-colors`}
                        />
                      ) : (
                        <Folder
                          className={`w-4 h-4 ${
                            isExactDb
                              ? "text-blue-400"
                              : "text-neutral-500 group-hover:text-blue-400"
                          } transition-colors`}
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
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-neutral-500 hover:text-white hover:bg-neutral-700/50 transition-all"
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
                      <div className="ml-4 pl-3 border-l border-neutral-700/50 mt-1 space-y-0.5">
                        {db.tables.length === 0 && (
                          <div className="px-3 py-2 text-xs text-neutral-600 italic">
                            No tables found
                          </div>
                        )}
                        {db.tables.map((table) => {
                          const isTableActive =
                            pathname ===
                            `/dashboard/database/${db.id}/table/${table.id}`;
                          return (
                            <Link
                              key={table.id}
                              href={`/dashboard/database/${db.id}/table/${table.id}`}
                              className={`group flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all ${
                                isTableActive
                                  ? "bg-linear-to-r from-emerald-500/20 to-teal-500/10 text-emerald-400 border border-emerald-500/30"
                                  : "text-neutral-400 hover:text-white hover:bg-neutral-800/50"
                              }`}
                            >
                              <FileJson
                                className={`w-3.5 h-3.5 ${
                                  isTableActive
                                    ? "text-emerald-400"
                                    : "text-neutral-500 group-hover:text-emerald-400"
                                } transition-colors`}
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
                                className="opacity-0 group-hover:opacity-100 p-1 text-neutral-500 hover:text-white transition-all"
                                title="Rename Collection"
                              >
                                <Pencil className="w-3 h-3" />
                              </button>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Storage Section */}
          {!isCollapsed && (
            <div className="pt-6 pb-2 px-3">
              <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-linear-to-r from-neutral-700/50 to-transparent" />
                <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-widest">
                  Storage
                </span>
                <div className="h-px flex-1 bg-linear-to-l from-neutral-700/50 to-transparent" />
              </div>
            </div>
          )}
          <Link
            href="/dashboard/bucket"
            className={`group flex items-center ${
              isCollapsed ? "justify-center" : "gap-3"
            } px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              pathname === "/dashboard/bucket"
                ? "bg-linear-to-r from-purple-500/20 to-pink-500/10 text-white border border-purple-500/30 shadow-lg shadow-purple-500/10"
                : "text-neutral-400 hover:text-white hover:bg-neutral-800/50"
            }`}
            title={isCollapsed ? "Bucket" : undefined}
          >
            <Database
              className={`w-4 h-4 ${
                pathname === "/dashboard/bucket"
                  ? "text-purple-400"
                  : "group-hover:text-purple-400"
              } transition-colors`}
            />
            {!isCollapsed && "Bucket"}
          </Link>

          {/* System Section */}
          {!isCollapsed && (
            <div className="pt-6 pb-2 px-3">
              <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-linear-to-r from-neutral-700/50 to-transparent" />
                <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-widest">
                  System
                </span>
                <div className="h-px flex-1 bg-linear-to-l from-neutral-700/50 to-transparent" />
              </div>
            </div>
          )}

          <Link
            href="/dashboard/usage"
            className={`group flex items-center ${
              isCollapsed ? "justify-center" : "gap-3"
            } px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              pathname === "/dashboard/usage"
                ? "bg-linear-to-r from-purple-500/20 to-pink-500/10 text-white border border-purple-500/30 shadow-lg shadow-purple-500/10"
                : "text-neutral-400 hover:text-white hover:bg-neutral-800/50"
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
              className={`w-4 h-4 ${
                pathname === "/dashboard/usage"
                  ? "text-purple-400"
                  : "group-hover:text-purple-400"
              } transition-colors`}
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
            } px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              pathname === "/dashboard/settings"
                ? "bg-linear-to-r from-purple-500/20 to-pink-500/10 text-white border border-purple-500/30 shadow-lg shadow-purple-500/10"
                : "text-neutral-400 hover:text-white hover:bg-neutral-800/50"
            }`}
            title={isCollapsed ? "Settings" : undefined}
          >
            <Settings
              className={`w-4 h-4 ${
                pathname === "/dashboard/settings"
                  ? "text-purple-400"
                  : "group-hover:text-purple-400"
              } transition-colors`}
            />
            {!isCollapsed && "Settings"}
          </Link>
        </nav>

        {/* Footer Status */}
        <div
          className={`p-3 border-t border-neutral-800/50 ${
            isCollapsed ? "flex justify-center" : ""
          }`}
        >
          {isCollapsed ? (
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shadow-lg shadow-emerald-500/50" />
          ) : (
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-linear-to-r from-neutral-900/80 to-neutral-800/50 border border-neutral-700/30">
              <div className="relative">
                <div className="absolute inset-0 bg-emerald-500 rounded-full blur-sm animate-pulse" />
                <div className="relative w-2.5 h-2.5 rounded-full bg-emerald-500" />
              </div>
              <span className="text-xs text-neutral-400 font-medium">
                System Online
              </span>
            </div>
          )}
        </div>

        {/* Collapse Toggle Button - Centered on right edge */}
        <button
          onClick={toggleCollapse}
          className="hidden md:flex absolute top-1/2 -right-4 transform -translate-y-1/2 w-7 h-14 items-center justify-center bg-neutral-900/95 backdrop-blur-sm border border-neutral-700/50 rounded-r-xl hover:bg-neutral-800 hover:border-purple-500/50 transition-all group shadow-xl z-50"
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <PanelLeft className="w-4 h-4 text-neutral-400 group-hover:text-purple-400 transition-colors" />
          ) : (
            <PanelLeftClose className="w-4 h-4 text-neutral-400 group-hover:text-purple-400 transition-colors" />
          )}
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
