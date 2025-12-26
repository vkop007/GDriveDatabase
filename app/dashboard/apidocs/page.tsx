import { Globe, Database, Sparkles, Package } from "lucide-react";
import { DocsTabs } from "../../../components/docs/DocsTabs";
import Link from "next/link";

export default function ApiDocsPage() {
  return (
    <div className="max-w-full mx-auto p-8 space-y-8 text-neutral-200">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-neutral-900 via-neutral-900 to-neutral-800 border border-neutral-800 p-8">
        {/* Glow effects */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-linear-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/20">
              <Package className="w-7 h-7 text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white">
                GDatabase SDK
              </h1>
              <p className="text-neutral-400">
                The official NPM package for GDrive Database
              </p>
            </div>
          </div>

          <p className="text-lg text-neutral-400 max-w-2xl">
            A simple, type-safe JavaScript/TypeScript client to manage your
            database. No complex queries – just methods you already know.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/dashboard/settings"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-sm font-medium text-white transition-colors border border-neutral-700"
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
      <div className="bg-linear-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl p-5 flex items-start gap-4">
        <div className="p-2 rounded-lg bg-green-500/20">
          <Database className="h-5 w-5 text-green-400" />
        </div>
        <div>
          <h4 className="font-semibold text-white mb-1">Simple & Intuitive</h4>
          <p className="text-sm text-neutral-300">
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
