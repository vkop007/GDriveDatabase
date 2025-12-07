"use client";

import { useState } from "react";
import ApiAccess from "./ApiAccess";
import CopyButton from "./CopyButton";
import CreateDatabaseModal from "./CreateDatabaseModal";
import RenameModal from "./RenameModal";
import ItemSettingsModal from "./ItemSettingsModal";
import SearchInput from "./SearchInput";
import { deleteDatabase } from "../app/actions";
import Link from "next/link";
import { Settings } from "lucide-react";

interface DashboardViewProps {
  initialDatabases: any[];
}

export default function DashboardView({
  initialDatabases,
}: DashboardViewProps) {
  const [renamingDatabase, setRenamingDatabase] = useState<any>(null);
  const [settingsDatabase, setSettingsDatabase] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const files = searchQuery
    ? initialDatabases.filter((file) =>
        file.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : initialDatabases;

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-linear-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Databases
            </h1>
            <div className="flex flex-wrap items-center gap-4 mt-2">
              <p className="text-neutral-400">Manage your NoSQL Databases</p>
              <ApiAccess />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <SearchInput
              placeholder="Search databases..."
              value={searchQuery}
              onChange={setSearchQuery}
            />
            <CreateDatabaseModal />
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {files.length === 0 ? (
            <div className="col-span-full text-center py-12 text-neutral-500 bg-neutral-900/50 rounded-xl border border-neutral-800">
              {searchQuery
                ? `No databases found matching "${searchQuery}"`
                : "No databases found. Create a new database to get started."}
            </div>
          ) : (
            files.map((file: any) => (
              <div
                key={file.id}
                className="bg-neutral-900/50 border border-neutral-800 rounded-xl hover:border-purple-500/50 transition-colors group relative flex flex-col"
              >
                <Link
                  href={`/dashboard/database/${file.id}`}
                  className="flex-1 p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-2 bg-neutral-800 rounded-lg group-hover:bg-purple-500/20 group-hover:text-purple-400 transition-colors">
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
                        />
                      </svg>
                    </div>
                    <span className="text-xs text-neutral-500">
                      {new Date(file.createdTime).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="font-medium truncate mb-1" title={file.name}>
                    {file.name}
                  </h3>
                  <div className="flex items-center gap-2 mb-4">
                    <CopyButton text={file.id} label="Database ID" />
                  </div>
                </Link>

                <div className="px-6 pb-6 pt-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      setSettingsDatabase(file);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors text-sm font-medium shadow-lg shadow-purple-900/20"
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {renamingDatabase && (
        <RenameModal
          isOpen={!!renamingDatabase}
          onClose={() => setRenamingDatabase(null)}
          currentName={renamingDatabase.name}
          itemId={renamingDatabase.id}
          itemType="database"
        />
      )}

      {settingsDatabase && (
        <ItemSettingsModal
          isOpen={!!settingsDatabase}
          onClose={() => setSettingsDatabase(null)}
          item={settingsDatabase}
          type="database"
          onRename={() => {
            setRenamingDatabase(settingsDatabase);
            // Settings modal will close automatically or we can keep it open?
            // Usually we close settings when opening rename.
            setSettingsDatabase(null); // Close settings
          }}
        />
      )}
    </div>
  );
}
