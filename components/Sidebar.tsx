"use client";

import {
  ChevronDown,
  ChevronRight,
  Database,
  Home,
  Menu,
  Settings,
  Table,
  X,
  FileJson,
  Folder,
  FolderOpen,
  Pencil,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
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
  const [isOpen, setIsOpen] = useState(false);
  const [expandedDbs, setExpandedDbs] = useState<Set<string>>(new Set());
  const [renamingItem, setRenamingItem] = useState<{
    id: string;
    name: string;
    type: "database" | "collection";
    parentId?: string;
  } | null>(null);

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

  const handleDatabaseClick = (dbId: string) => {
    // Navigate to database view
    router.push(`/dashboard/database/${dbId}`);
    // Also expand if not expanded
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

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-50 p-2 bg-neutral-900 border border-neutral-800 rounded-lg md:hidden text-white hover:bg-neutral-800 transition-colors"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-(--sidebar-width) bg-[rgb(15,15,15)] border-r border-[rgb(38,38,38)] transform transition-transform duration-200 ease-in-out md:translate-x-0 flex flex-col ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6 border-b border-[rgb(38,38,38)] flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-linear-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Database className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-lg font-bold text-white tracking-tight">
            GDrive DB
          </h1>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          <Link
            href="/dashboard"
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all group ${
              pathname === "/dashboard"
                ? "bg-[rgba(168,85,247,0.15)] text-purple-400 border border-purple-500/20"
                : "text-neutral-400 hover:text-white hover:bg-[rgb(38,38,38)]"
            }`}
          >
            <Home className="w-4 h-4 group-hover:text-purple-400 transition-colors" />
            Home
          </Link>

          <Link
            href="/dashboard/apidocs"
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all group ${
              pathname === "/dashboard/apidocs"
                ? "bg-[rgba(168,85,247,0.15)] text-purple-400 border border-purple-500/20"
                : "text-neutral-400 hover:text-white hover:bg-[rgb(38,38,38)]"
            }`}
          >
            <FileJson className="w-4 h-4 group-hover:text-purple-400 transition-colors" />
            API Docs
          </Link>

          <div className="pt-6 pb-2 px-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
            Explorer
          </div>

          <div className="space-y-0.5">
            {treeData.map((db) => {
              const isExpanded = expandedDbs.has(db.id);
              const isActive =
                pathname.includes(`/dashboard/database/${db.id}`) ||
                pathname.includes(db.id); // Loose check for children
              const isExactDb = pathname === `/dashboard/database/${db.id}`;

              return (
                <div key={db.id} className="select-none">
                  <div
                    className={`group flex items-center gap-1 px-2 py-1.5 rounded-lg text-sm transition-colors cursor-pointer ${
                      isExactDb
                        ? "bg-[rgba(59,130,246,0.15)] text-blue-400 border border-blue-500/20"
                        : "text-neutral-400 hover:text-white hover:bg-[rgb(38,38,38)]"
                    }`}
                    onClick={() => handleDatabaseClick(db.id)}
                  >
                    <button
                      onClick={(e) => toggleDb(e, db.id)}
                      className="p-1 rounded-sm hover:bg-[rgb(38,38,38)] text-neutral-500 hover:text-white transition-colors"
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
                              : "text-neutral-500 group-hover:text-white"
                          }`}
                        />
                      ) : (
                        <Folder
                          className={`w-4 h-4 ${
                            isExactDb
                              ? "text-blue-400"
                              : "text-(--sidebar-foreground) group-hover:text-(--sidebar-accent-foreground)"
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
                      className="opacity-0 group-hover:opacity-100 p-1 text-neutral-500 hover:text-white transition-all"
                      title="Rename Database"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="ml-4 pl-2 border-l border-[rgb(38,38,38)] mt-0.5 space-y-0.5">
                      {db.tables.length === 0 && (
                        <div className="px-3 py-2 text-xs text-neutral-500 italic">
                          No tables found
                        </div>
                      )}
                      {db.tables.map((table) => {
                        const isTableActive =
                          pathname === `/dashboard/table/${table.id}`;
                        return (
                          <Link
                            key={table.id}
                            href={`/dashboard/table/${table.id}`}
                            className={`group flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                              isTableActive
                                ? "bg-[rgba(34,197,94,0.15)] text-green-400 border border-green-500/20"
                                : "text-neutral-400 hover:text-white hover:bg-[rgb(38,38,38)]"
                            }`}
                          >
                            <FileJson
                              className={`w-3.5 h-3.5 ${
                                isTableActive
                                  ? "text-green-400"
                                  : "text-neutral-500"
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
                              className="opacity-0 group-hover:opacity-100 p-1 text-neutral-500 hover:text-white transition-all"
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
              );
            })}
          </div>

          <div className="pt-6 pb-2 px-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
            Storage
          </div>
          <Link
            href="/dashboard/bucket"
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all group ${
              pathname === "/dashboard/bucket"
                ? "bg-[rgba(168,85,247,0.15)] text-purple-400 border border-purple-500/20"
                : "text-neutral-400 hover:text-white hover:bg-[rgb(38,38,38)]"
            }`}
          >
            <Database className="w-4 h-4 group-hover:text-purple-400 transition-colors" />
            Bucket
          </Link>

          <div className="pt-6 pb-2 px-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
            System
          </div>

          <Link
            href="/dashboard/usage"
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all group ${
              pathname === "/dashboard/usage"
                ? "bg-[rgba(168,85,247,0.15)] text-purple-400 border border-purple-500/20"
                : "text-neutral-400 hover:text-white hover:bg-[rgb(38,38,38)]"
            }`}
          >
            <div
              className={`w-4 h-4 flex items-center justify-center ${
                pathname === "/dashboard/usage"
                  ? ""
                  : "group-hover:text-purple-400"
              } transition-colors`}
            >
              {/* Minimal pie chart icon or similar since we don't have PieChart imported */}
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
                className="w-4 h-4"
              >
                <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
                <path d="M22 12A10 10 0 0 0 12 2v10z" />
              </svg>
            </div>
            Usage
          </Link>

          <Link
            href="/dashboard/settings"
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all group ${
              pathname === "/dashboard/settings"
                ? "bg-[rgba(168,85,247,0.15)] text-purple-400 border border-purple-500/20"
                : "text-neutral-400 hover:text-white hover:bg-[rgb(38,38,38)]"
            }`}
          >
            <Settings className="w-4 h-4 group-hover:text-purple-400 transition-colors" />
            Settings
          </Link>
        </nav>

        <div className="p-4 border-t border-[rgb(38,38,38)]">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-[rgb(23,23,23)] border border-[rgb(38,38,38)]">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-sm shadow-green-500/50" />
            <span className="text-xs text-neutral-400">System Online</span>
          </div>
        </div>
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
