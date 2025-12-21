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
import { Database } from "lucide-react";
import ResourceCard from "./ResourceCard";

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
            <h1 className="text-3xl font-bold bg-linear-to-r from-white via-white to-white bg-clip-text text-transparent">
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
              <ResourceCard
                key={file.id}
                name={file.name}
                id={file.id}
                createdTime={file.createdTime}
                type="database"
                href={`/dashboard/database/${file.id}`}
                onSettingsClick={() => setSettingsDatabase(file)}
              />
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
