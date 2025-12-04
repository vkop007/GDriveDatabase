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
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

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
        className={`fixed inset-y-0 left-0 z-40 w-(--sidebar-width) bg-(--sidebar-bg) border-r border-(--sidebar-border) transform transition-transform duration-200 ease-in-out md:translate-x-0 flex flex-col ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6 border-b border-(--sidebar-border) flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-linear-to-br from-purple-500 to-blue-500 flex items-center justify-center">
            <Database className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-lg font-bold text-foreground tracking-tight">
            GDrive DB
          </h1>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          <Link
            href="/dashboard"
            className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all group ${
              pathname === "/dashboard"
                ? "bg-(--sidebar-accent) text-(--sidebar-accent-foreground)"
                : "text-(--sidebar-foreground) hover:text-(--sidebar-accent-foreground) hover:bg-(--sidebar-accent)"
            }`}
          >
            <Home className="w-4 h-4 group-hover:text-purple-400 transition-colors" />
            Home
          </Link>

          <div className="pt-6 pb-2 px-3 text-xs font-semibold text-(--sidebar-foreground) uppercase tracking-wider opacity-70">
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
                    className={`group flex items-center gap-1 px-2 py-1.5 rounded-md text-sm transition-colors cursor-pointer ${
                      isExactDb
                        ? "bg-blue-500/10 text-blue-400"
                        : "text-(--sidebar-foreground) hover:text-(--sidebar-accent-foreground) hover:bg-(--sidebar-accent)"
                    }`}
                    onClick={() => handleDatabaseClick(db.id)}
                  >
                    <button
                      onClick={(e) => toggleDb(e, db.id)}
                      className="p-1 rounded-sm hover:bg-(--sidebar-accent) text-(--sidebar-foreground) hover:text-(--sidebar-accent-foreground) transition-colors"
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
                              : "text-(--sidebar-foreground) group-hover:text-(--sidebar-accent-foreground)"
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
                  </div>

                  {isExpanded && (
                    <div className="ml-4 pl-2 border-l border-(--sidebar-border) mt-0.5 space-y-0.5">
                      {db.tables.length === 0 && (
                        <div className="px-3 py-2 text-xs text-(--sidebar-foreground) italic opacity-60">
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
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
                              isTableActive
                                ? "bg-(--sidebar-accent) text-(--sidebar-accent-foreground)"
                                : "text-(--sidebar-foreground) hover:text-(--sidebar-accent-foreground) hover:bg-(--sidebar-accent)"
                            }`}
                          >
                            <FileJson
                              className={`w-3.5 h-3.5 ${
                                isTableActive
                                  ? "text-green-400"
                                  : "text-(--sidebar-foreground)"
                              }`}
                            />
                            <span className="truncate">{table.name}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="pt-6 pb-2 px-3 text-xs font-semibold text-(--sidebar-foreground) uppercase tracking-wider opacity-70">
            System
          </div>
          <Link
            href="/dashboard/settings"
            className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all group ${
              pathname === "/dashboard/settings"
                ? "bg-(--sidebar-accent) text-(--sidebar-accent-foreground)"
                : "text-(--sidebar-foreground) hover:text-(--sidebar-accent-foreground) hover:bg-(--sidebar-accent)"
            }`}
          >
            <Settings className="w-4 h-4 group-hover:text-purple-400 transition-colors" />
            Settings
          </Link>
        </nav>

        <div className="p-4 border-t border-(--sidebar-border)">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-(--sidebar-accent) border border-(--sidebar-border)">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-(--sidebar-foreground)">
              System Online
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}
