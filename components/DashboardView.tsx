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
import OnboardingGuide, { type OnboardingStep } from "./OnboardingGuide";
import type { Database as DatabaseFile, DatabaseNavItem } from "../types";

interface DashboardViewProps {
  initialDatabases: DatabaseFile[];
  databaseTree?: DatabaseNavItem[];
  hasApiKey?: boolean;
  needsDriveConnection?: boolean;
  driveSetupAction?: (formData: FormData) => void;
}

export default function DashboardView({
  initialDatabases,
  databaseTree = [],
  hasApiKey = false,
  needsDriveConnection = false,
  driveSetupAction,
}: DashboardViewProps) {
  const [renamingDatabase, setRenamingDatabase] =
    useState<DatabaseFile | null>(null);
  const [settingsDatabase, setSettingsDatabase] =
    useState<DatabaseFile | null>(null);
  const [isDriveSetupOpen, setIsDriveSetupOpen] =
    useState(needsDriveConnection);
  const [searchQuery, setSearchQuery] = useState("");

  const files = searchQuery
    ? initialDatabases.filter((file) =>
        file.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : initialDatabases;
  const hasDriveConnection = !needsDriveConnection;
  const hasDatabases = initialDatabases.length > 0;
  const firstDatabase = initialDatabases[0] ?? databaseTree[0];
  const allTables = databaseTree.flatMap((database) =>
    database.tables.map((table) => ({
      ...table,
      databaseId: database.id,
    }))
  );
  const firstTable = allTables[0];
  const hasTables = allTables.length > 0;
  const onboardingSteps: OnboardingStep[] = [
    {
      title: "Connect Drive",
      description: "Authorize the Google Drive workspace that stores data.",
      status: hasDriveConnection ? "complete" : "current",
      icon: "drive",
      action: !hasDriveConnection ? (
        <button
          type="button"
          onClick={() => setIsDriveSetupOpen(true)}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-primary/25 bg-white px-3 py-2 text-sm font-semibold text-primary shadow-sm transition hover:bg-primary/10 dark:bg-neutral-950"
        >
          <Link2 className="h-4 w-4" />
          Connect Drive
        </button>
      ) : undefined,
    },
    {
      title: "Create database",
      description: "Create the first Drive folder that behaves like a database.",
      status: !hasDriveConnection
        ? "locked"
        : hasDatabases
        ? "complete"
        : "current",
      icon: "database",
      action:
        hasDriveConnection && !hasDatabases ? (
          <CreateDatabaseModal triggerClassName="w-full" />
        ) : undefined,
    },
    {
      title: "Create table",
      description: "Add a JSON table where records and schema can live.",
      status: !hasDatabases ? "locked" : hasTables ? "complete" : "current",
      icon: "table",
      href: firstDatabase ? `/dashboard/database/${firstDatabase.id}` : undefined,
      actionLabel: "Open database",
    },
    {
      title: "Add first row",
      description: "Open a table, add fields, then create a real record.",
      status: !hasTables ? "locked" : "current",
      icon: "rows",
      href: firstTable
        ? `/dashboard/database/${firstTable.databaseId}/table/${firstTable.id}`
        : undefined,
      actionLabel: "Open table",
    },
    {
      title: "Generate API key",
      description: "Enable secure API access for apps and integrations.",
      status: !hasDriveConnection ? "locked" : hasApiKey ? "complete" : "current",
      icon: "key",
      href: "/dashboard/settings",
      actionLabel: "Go to settings",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 px-4 pb-4 pt-20 text-slate-950 transition-colors dark:bg-neutral-950 dark:text-white md:p-8">
      <div className="max-w-full mx-auto space-y-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
              Databases
            </h1>
            <div className="flex flex-wrap items-center gap-4 mt-2">
              <p className="text-slate-500 dark:text-neutral-400">
                Manage your NoSQL Databases
              </p>
              {!needsDriveConnection && <ApiAccess />}
            </div>
          </div>
          {!needsDriveConnection && (
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <SearchInput
                placeholder="Search databases..."
                value={searchQuery}
                onChange={setSearchQuery}
              />
              <CreateDatabaseModal />
            </div>
          )}
        </header>

        {needsDriveConnection && (
          <div className="rounded-2xl border border-primary/20 bg-white p-5 shadow-sm shadow-slate-900/5 dark:border-primary/25 dark:bg-primary/10 dark:shadow-none">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="font-semibold text-slate-950 dark:text-white">
                  Google Drive is not connected
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-neutral-400">
                  Connect your Drive credentials to load databases, create
                  collections, and enable storage.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsDriveSetupOpen(true)}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-primary/25 bg-white px-4 py-2.5 text-sm font-semibold text-primary shadow-sm transition hover:bg-primary/10 dark:border-primary/30 dark:bg-neutral-950"
              >
                <Link2 className="h-4 w-4" />
                Connect Google Drive
              </button>
            </div>
          </div>
        )}

        <OnboardingGuide
          title="Get your first database online"
          description="Follow the shortest path from an empty account to a working Drive-backed API."
          steps={onboardingSteps}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {files.length === 0 ? (
            <div className="col-span-full empty-state">
              <Database className="empty-state-icon" />
              <p className="text-slate-500 dark:text-neutral-400">
                {searchQuery
                  ? `No databases found matching "${searchQuery}"`
                  : needsDriveConnection
                  ? "Connect Google Drive to load databases and create your first one."
                  : "No databases found. Create a new database to get started."}
              </p>
            </div>
          ) : (
            files.map((file) => (
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
