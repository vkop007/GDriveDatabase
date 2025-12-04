import Link from "next/link";
import { createDocument } from "../../actions";

export default function CreateDocument() {
  return (
    <div className="min-h-screen bg-neutral-950 text-white p-8 flex items-center justify-center">
      <div className="w-full max-w-2xl bg-neutral-900/50 border border-neutral-800 rounded-2xl p-8 backdrop-blur-xl shadow-2xl">
        <h1 className="text-2xl font-bold mb-6 bg-linear-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
          Create New Document
        </h1>

        <form action={createDocument} className="space-y-6">
          <div className="space-y-2">
            <label
              htmlFor="filename"
              className="text-sm font-medium text-neutral-300"
            >
              Filename (e.g., users.json)
            </label>
            <input
              id="filename"
              name="filename"
              type="text"
              required
              placeholder="data.json"
              className="w-full bg-neutral-950/50 border border-neutral-800 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all placeholder:text-neutral-600"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="content"
              className="text-sm font-medium text-neutral-300"
            >
              JSON Content
            </label>
            <textarea
              id="content"
              name="content"
              required
              rows={10}
              placeholder='{"key": "value"}'
              className="w-full bg-neutral-950/50 border border-neutral-800 rounded-lg px-4 py-3 text-sm font-mono focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all placeholder:text-neutral-600"
              defaultValue="{}"
            />
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              className="flex-1 bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-medium py-3 rounded-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-purple-500/25"
            >
              Create Document
            </button>
            <Link
              href="/dashboard"
              className="px-6 py-3 rounded-lg border border-neutral-800 hover:bg-neutral-800 transition-colors text-neutral-400 hover:text-white"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
