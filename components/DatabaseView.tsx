"use client";

import { useState } from "react";
import ApiAccess from "./ApiAccess";
import CopyButton from "./CopyButton";
import CreateTableModal from "./CreateTableModal";
import SearchInput from "./SearchInput";
import { deleteCollection } from "../app/actions";
import Link from "next/link";

interface DatabaseViewProps {
  initialTables: any[];
  databaseId: string;
}

export default function DatabaseView({
  initialTables,
  databaseId,
}: DatabaseViewProps) {
  const [searchQuery, setSearchQuery] = useState("");

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
                className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6 hover:border-purple-500/50 transition-colors group"
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
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-neutral-800">
                  <Link
                    href={`/dashboard/table/${file.id}`}
                    className="text-xs font-medium text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    Open Table
                  </Link>
                  <form action={deleteCollection}>
                    <input type="hidden" name="fileId" value={file.id} />
                    <input type="hidden" name="parentId" value={databaseId} />
                    <button
                      type="submit"
                      className="text-xs font-medium text-red-500 hover:text-red-400 transition-colors"
                    >
                      Delete
                    </button>
                  </form>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
