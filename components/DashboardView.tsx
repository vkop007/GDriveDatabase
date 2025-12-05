"use client";

import { useState } from "react";
import ApiAccess from "./ApiAccess";
import CopyButton from "./CopyButton";
import CreateDatabaseModal from "./CreateDatabaseModal";
import SearchInput from "./SearchInput";
import { deleteDatabase } from "../app/actions";
import Link from "next/link";

interface DashboardViewProps {
  initialDatabases: any[];
}

export default function DashboardView({
  initialDatabases,
}: DashboardViewProps) {
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
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-neutral-800">
                  <Link
                    href={`/dashboard/database/${file.id}`}
                    className="text-xs font-medium text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    Open
                  </Link>
                  <form action={deleteDatabase}>
                    <input type="hidden" name="fileId" value={file.id} />
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
