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
import { Settings, Database } from "lucide-react";

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
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gradient-purple">
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
            <div className="col-span-full empty-state">
              <Database className="empty-state-icon" />
              <p className="text-neutral-400">
                {searchQuery
                  ? `No databases found matching "${searchQuery}"`
                  : "No databases found. Create a new database to get started."}
              </p>
            </div>
          ) : (
            files.map((file: any) => (
              <div key={file.id} className="group card-glow p-0 flex flex-col">
                <Link
                  href={`/dashboard/database/${file.id}`}
                  className="flex-1 p-6 relative z-10"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="icon-box icon-box-lg icon-box-purple">
                      <Database className="w-5 h-5 text-purple-400" />
                    </div>
                    <span className="badge badge-neutral">
                      {new Date(file.createdTime).toLocaleDateString()}
                    </span>
                  </div>
                  <h3
                    className="font-medium text-white truncate mb-2 group-hover:text-purple-200 transition-colors"
                    title={file.name}
                  >
                    {file.name}
                  </h3>
                  <div className="flex items-center gap-2">
                    <CopyButton text={file.id} label="Database ID" />
                  </div>
                </Link>

                <div className="px-6 pb-6 pt-2 relative z-10">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      setSettingsDatabase(file);
                    }}
                    className="btn btn-primary w-full"
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
            setSettingsDatabase(null);
          }}
        />
      )}
    </div>
  );
}
