"use client";

import { useState } from "react";
import ApiAccess from "./ApiAccess";
import CreateDatabaseModal from "./CreateDatabaseModal";
import RenameModal from "./RenameModal";
import ItemSettingsModal from "./ItemSettingsModal";
import SearchInput from "./SearchInput";
import { Database, Link2 } from "lucide-react";
import ResourceCard from "./ResourceCard";
import DriveSetupClient from "./DriveSetupClient";

interface DashboardViewProps {
  initialDatabases: any[];
  needsDriveConnection?: boolean;
  driveSetupAction?: (formData: FormData) => void;
}

export default function DashboardView({
  initialDatabases,
  needsDriveConnection = false,
  driveSetupAction,
}: DashboardViewProps) {
  const [renamingDatabase, setRenamingDatabase] = useState<any>(null);
  const [settingsDatabase, setSettingsDatabase] = useState<any>(null);
  const [isDriveSetupOpen, setIsDriveSetupOpen] =
    useState(needsDriveConnection);
  const [searchQuery, setSearchQuery] = useState("");

  const files = searchQuery
    ? initialDatabases.filter((file) =>
        file.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : initialDatabases;

  return (
    <div className="min-h-screen bg-neutral-950 text-white pt-20 px-4 pb-4 md:p-8">
      <div className="max-w-full mx-auto space-y-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-linear-to-r from-white via-white to-white bg-clip-text text-transparent">
              Databases
            </h1>
            <div className="flex flex-wrap items-center gap-4 mt-2">
              <p className="text-neutral-400">Manage your NoSQL Databases</p>
              {!needsDriveConnection && <ApiAccess />}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            {!needsDriveConnection && (
              <>
                <SearchInput
                  placeholder="Search databases..."
                  value={searchQuery}
                  onChange={setSearchQuery}
                />
                <CreateDatabaseModal />
              </>
            )}
            {needsDriveConnection && (
              <button
                type="button"
                onClick={() => setIsDriveSetupOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary/90"
              >
                <Link2 className="h-4 w-4" />
                Connect Drive
              </button>
            )}
          </div>
        </header>

        {needsDriveConnection && (
          <div className="rounded-2xl border border-primary/25 bg-primary/10 p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="font-semibold text-white">
                  Google Drive is not connected
                </h2>
                <p className="mt-1 text-sm text-neutral-400">
                  Connect your Drive credentials to load databases, create
                  collections, and enable storage.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsDriveSetupOpen(true)}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-primary/30 bg-neutral-950 px-4 py-2.5 text-sm font-semibold text-primary transition hover:bg-primary/10"
              >
                <Link2 className="h-4 w-4" />
                Connect Google Drive
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {files.length === 0 ? (
            <div className="col-span-full empty-state">
              <Database className="empty-state-icon" />
              <p className="text-neutral-400">
                {searchQuery
                  ? `No databases found matching "${searchQuery}"`
                  : needsDriveConnection
                  ? "Connect Google Drive to load databases and create your first one."
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

      {needsDriveConnection && driveSetupAction && (
        <DriveSetupClient
          isOpen={isDriveSetupOpen}
          onClose={() => setIsDriveSetupOpen(false)}
          onSubmit={driveSetupAction}
        />
      )}
    </div>
  );
}
