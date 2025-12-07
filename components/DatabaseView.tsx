"use client";

import { useState } from "react";
import ApiAccess from "./ApiAccess";
import CopyButton from "./CopyButton";
import CreateTableModal from "./CreateTableModal";
import RenameModal from "./RenameModal";
import ItemSettingsModal from "./ItemSettingsModal";
import SearchInput from "./SearchInput";
import { deleteCollection } from "../app/actions";
import Link from "next/link";
import { Settings } from "lucide-react";

interface DatabaseViewProps {
  initialTables: any[];
  databaseId: string;
}

export default function DatabaseView({
  initialTables,
  databaseId,
}: DatabaseViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [renamingCollection, setRenamingCollection] = useState<any>(null);
  const [settingsCollection, setSettingsCollection] = useState<any>(null);

  const files = searchQuery
    ? initialTables.filter((file) =>
        file.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : initialTables;

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link
                href="/dashboard"
                className="text-neutral-400 hover:text-white transition-colors"
              >
                Databases
              </Link>
              <span className="text-neutral-600">/</span>
              <span className="text-purple-400">Collections</span>
            </div>
            <h1 className="text-3xl font-bold bg-linear-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Collections
            </h1>
            <p className="text-neutral-400 mt-1">
              Manage Tables in this Database
            </p>
            <div className="mt-2">
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
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {files.length === 0 ? (
            <div className="col-span-full text-center py-12 text-neutral-500 bg-neutral-900/50 rounded-xl border border-neutral-800">
              {searchQuery
                ? `No collections found matching "${searchQuery}"`
                : "No collections found. Create a new collection to get started."}
            </div>
          ) : (
            files.map((file: any) => (
              <div
                key={file.id}
                className="bg-neutral-900/50 border border-neutral-800 rounded-xl hover:border-purple-500/50 transition-colors group relative flex flex-col"
              >
                <Link
                  href={`/dashboard/table/${file.id}`}
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
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
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
                    <CopyButton text={file.id} label="Collection ID" />
                  </div>
                </Link>

                <div className="px-6 pb-6 pt-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      setSettingsCollection(file);
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
