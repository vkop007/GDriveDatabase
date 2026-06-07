"use client";

import { useState } from "react";
import ApiAccess from "./ApiAccess";
import CreateTableModal from "./CreateTableModal";
import RenameModal from "./RenameModal";
import ItemSettingsModal from "./ItemSettingsModal";
import SearchInput from "./SearchInput";
import Link from "next/link";
import {
  Table,
  Database,
  ChevronRight,
  Layers,
} from "lucide-react";
import ResourceCard from "./ResourceCard";
import type { Table as TableFile } from "../types";

interface DatabaseViewProps {
  initialTables: TableFile[];
  databaseId: string;
}

export default function DatabaseView({
  initialTables,
  databaseId,
}: DatabaseViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [renamingCollection, setRenamingCollection] =
    useState<TableFile | null>(null);
  const [settingsCollection, setSettingsCollection] =
    useState<TableFile | null>(null);

  const files = searchQuery
    ? initialTables.filter((file) =>
        file.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : initialTables;

  return (
    <div className="min-h-screen bg-slate-50 p-4 text-slate-950 dark:bg-neutral-950 dark:text-white md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="space-y-4">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 transition-all hover:border-slate-300 hover:bg-slate-100 hover:text-slate-950 dark:border-transparent dark:bg-neutral-800/50 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white"
            >
              <Database className="w-3.5 h-3.5" />
              Databases
            </Link>
            <ChevronRight className="w-4 h-4 text-slate-400 dark:text-neutral-600" />
            <span className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-pink-500/10 text-pink-400 text-sm font-medium border border-pink-500/20">
              <Layers className="w-3.5 h-3.5" />
              Collections
            </span>
          </nav>

          {/* Title Section */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="bg-linear-to-r from-slate-950 via-slate-900 to-slate-600 bg-clip-text text-4xl font-bold text-transparent dark:from-white dark:via-white dark:to-neutral-400">
                Collections
              </h1>
              <p className="text-slate-500 mt-2 dark:text-neutral-400">
                Manage Tables in this Database
              </p>
              <div className="mt-3">
                <ApiAccess databaseId={databaseId} />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <SearchInput
                placeholder="Search tables..."
                value={searchQuery}
                onChange={setSearchQuery}
              />
              <CreateTableModal parentId={databaseId} />
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {files.length === 0 ? (
            <div className="col-span-full empty-state">
              <Table className="empty-state-icon" />
              <p className="text-slate-500 dark:text-neutral-400">
                {searchQuery
                  ? `No collections found matching "${searchQuery}"`
                  : "No collections found. Create a new collection to get started."}
              </p>
            </div>
          ) : (
            files.map((file) => (
              <ResourceCard
                key={file.id}
                name={file.name}
                id={file.id}
                createdTime={file.createdTime}
                type="collection"
                href={`/dashboard/database/${databaseId}/table/${file.id}`}
                onSettingsClick={() => setSettingsCollection(file)}
              />
            ))
          )}
        </div>
      </div>

      {renamingCollection && (
        <RenameModal
          isOpen={!!renamingCollection}
          onClose={() => setRenamingCollection(null)}
          currentName={renamingCollection.name}
          itemId={renamingCollection.id}
          itemType="collection"
          parentId={databaseId}
        />
      )}

      {settingsCollection && (
        <ItemSettingsModal
          isOpen={!!settingsCollection}
          onClose={() => setSettingsCollection(null)}
          item={settingsCollection}
          type="collection"
          parentId={databaseId}
          onRename={() => {
            setRenamingCollection(settingsCollection);
            setSettingsCollection(null);
          }}
        />
      )}
    </div>
  );
}
