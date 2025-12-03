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
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  const [isOpen, setIsOpen] = useState(false);
  const [expandedDbs, setExpandedDbs] = useState<Set<string>>(new Set());
  const [expandedCollections, setExpandedCollections] = useState<Set<string>>(
    new Set()
  );

  const toggleDb = (dbId: string) => {
    const newExpanded = new Set(expandedDbs);
    if (newExpanded.has(dbId)) {
      newExpanded.delete(dbId);
    } else {
      newExpanded.add(dbId);
    }
    setExpandedDbs(newExpanded);
  };

  const toggleCollection = (dbId: string) => {
    const newExpanded = new Set(expandedCollections);
    if (newExpanded.has(dbId)) {
      newExpanded.delete(dbId);
    } else {
      newExpanded.add(dbId);
    }
    setExpandedCollections(newExpanded);
  };

  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-50 p-2 bg-neutral-900 border border-neutral-800 rounded-lg md:hidden text-white"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-neutral-950 border-r border-neutral-800 transform transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-neutral-800">
            <h1 className="text-xl font-bold bg-linear-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              GDrive DB
            </h1>
          </div>

          <nav className="flex-1 overflow-y-auto p-4 space-y-2">
            <Link
              href="/dashboard"
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === "/dashboard"
                  ? "bg-purple-500/10 text-purple-400"
                  : "text-neutral-400 hover:text-white hover:bg-neutral-900"
              }`}
            >
              <Home className="w-4 h-4" />
              Home
            </Link>

            <div className="pt-4">
              <div className="px-3 mb-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                Databases
              </div>
              <div className="space-y-1">
                {treeData.map((db) => (
                  <div key={db.id}>
                    <button
                      onClick={() => toggleDb(db.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        pathname.includes(db.id)
                          ? "text-white"
                          : "text-neutral-400 hover:text-white hover:bg-neutral-900"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Database className="w-4 h-4" />
                        <span className="truncate">{db.name}</span>
                      </div>
                      {expandedDbs.has(db.id) ? (
                        <ChevronDown className="w-3 h-3" />
                      ) : (
                        <ChevronRight className="w-3 h-3" />
                      )}
                    </button>

                    {expandedDbs.has(db.id) && (
                      <div className="ml-4 pl-3 border-l border-neutral-800 mt-1 space-y-1">
                        <div>
                          <div
                            className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors group ${
                              pathname === `/dashboard/database/${db.id}`
                                ? "text-purple-400 bg-purple-500/10"
                                : "text-neutral-500 hover:text-white hover:bg-neutral-900"
                            }`}
                          >
                            <Link
                              href={`/dashboard/database/${db.id}`}
                              className="flex items-center gap-3 flex-1 min-w-0"
                            >
                              <span className="truncate font-medium">
                                Collections
                              </span>
                            </Link>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                toggleCollection(db.id);
                              }}
                              className="p-1 hover:bg-neutral-800 rounded"
                            >
                              {expandedCollections.has(db.id) ? (
                                <ChevronDown className="w-3 h-3" />
                              ) : (
                                <ChevronRight className="w-3 h-3" />
                              )}
                            </button>
                          </div>

                          {/* Nested Tables */}
                          {expandedCollections.has(db.id) && (
                            <div className="ml-4 pl-3 border-l border-neutral-800 mt-1 space-y-1">
                              {db.tables.map((table) => (
                                <Link
                                  key={table.id}
                                  href={`/dashboard/table/${table.id}`}
                                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                                    pathname === `/dashboard/table/${table.id}`
                                      ? "text-purple-400 bg-purple-500/10"
                                      : "text-neutral-500 hover:text-white hover:bg-neutral-900"
                                  }`}
                                >
                                  <Table className="w-3 h-3" />
                                  <span className="truncate">{table.name}</span>
                                </Link>
                              ))}
                              {db.tables.length === 0 && (
                                <div className="px-3 py-2 text-xs text-neutral-600 italic">
                                  No tables
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4">
              <div className="px-3 mb-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                System
              </div>
              <Link
                href="/dashboard/settings"
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === "/dashboard/settings"
                    ? "bg-purple-500/10 text-purple-400"
                    : "text-neutral-400 hover:text-white hover:bg-neutral-900"
                }`}
              >
                <Settings className="w-4 h-4" />
                Settings
              </Link>
            </div>
          </nav>
        </div>
      </aside>
    </>
  );
}
