import { Globe, Database, Sparkles, Package } from "lucide-react";
import { DocsTabs } from "../../../components/docs/DocsTabs";
import Link from "next/link";

export default function ApiDocsPage() {
  return (
    <div className="max-w-full mx-auto p-8 space-y-8 text-slate-950 dark:text-neutral-200">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-8 shadow-sm shadow-slate-900/5 dark:border-neutral-800 dark:bg-linear-to-br dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-800 dark:shadow-none">
        <div className="relative space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl border border-blue-500/20 bg-linear-to-br from-blue-500/15 to-purple-500/10">
              <Package className="w-7 h-7 text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
                GDatabase SDK
              </h1>
              <p className="text-slate-500 dark:text-neutral-400">
                The official NPM package for GDrive Database
              </p>
            </div>
          </div>

          <p className="text-lg text-slate-600 max-w-2xl dark:text-neutral-400">
            A simple, type-safe JavaScript/TypeScript client to manage your
            database. No complex queries – just methods you already know.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/dashboard/settings"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-medium text-slate-800 transition-colors hover:bg-slate-200 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:hover:bg-neutral-700"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              Get API Key
            </Link>
            <a
              href="https://www.npmjs.com/package/gdatabase"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-linear-to-r from-primary/20 to-primary/10 hover:from-primary/30 hover:to-primary/20 text-sm font-medium text-primary transition-colors border border-primary/20"
            >
              <Globe className="w-4 h-4" />
              View on NPM
            </a>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="flex items-start gap-4 rounded-xl border border-emerald-500/20 bg-emerald-50 p-5 dark:bg-linear-to-r dark:from-green-500/10 dark:to-emerald-500/10">
        <div className="p-2 rounded-lg bg-green-500/20">
          <Database className="h-5 w-5 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <h4 className="font-semibold text-slate-950 mb-1 dark:text-white">
            Simple & Intuitive
          </h4>
          <p className="text-sm text-slate-600 dark:text-neutral-300">
            GDatabase feels like working with local arrays. Create, read,
            update, and delete documents with clean, chainable methods. Perfect
            for beginners and pros alike!
          </p>
        </div>
      </div>

      {/* Docs Content */}
      <DocsTabs />
    </div>
  );
}
