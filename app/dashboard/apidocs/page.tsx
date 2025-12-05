"use client";

import { useState } from "react";
import { Copy, Check, Terminal, Globe, Code2, Database } from "lucide-react";

export default function ApiDocsPage() {
  const [copied, setCopied] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"package" | "api">("package");

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const CodeBlock = ({
    code,
    language = "typescript",
    id,
  }: {
    code: string;
    language?: string;
    id: string;
  }) => (
    <div className="relative group rounded-lg overflow-hidden bg-neutral-950 border border-neutral-800 my-4">
      <div className="flex items-center justify-between px-4 py-2 bg-neutral-900/50 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          {language === "bash" ? (
            <Terminal className="w-3.5 h-3.5 text-neutral-400" />
          ) : (
            <Code2 className="w-3.5 h-3.5 text-neutral-400" />
          )}
          <span className="text-xs font-medium text-neutral-400">
            {language}
          </span>
        </div>
        <button
          className="h-6 w-6 flex items-center justify-center rounded hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
          onClick={() => copyToClipboard(code, id)}
        >
          {copied === id ? (
            <Check className="w-3.5 h-3.5 text-green-500" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </button>
      </div>
      <div className="p-4 overflow-x-auto">
        <pre className="text-sm font-mono text-neutral-300">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto p-8 space-y-8 text-neutral-200">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
            <Globe className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            API Documentation
          </h1>
        </div>
        <p className="text-lg text-neutral-400 max-w-2xl">
          Learn how to integrate your GDrive Database into your applications
          using our simple NPM package or REST API.
        </p>
      </div>

      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 flex items-start gap-4">
        <Database className="h-5 w-5 text-blue-400 mt-0.5" />
        <div>
          <h4 className="font-medium text-blue-400 mb-1">New to Databases?</h4>
          <p className="text-sm text-blue-400/80">
            Our Simple Client makes connecting to your database as easy as using
            a local array. No complex SQL queries needed!
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Custom Tabs */}
        <div className="bg-neutral-900 border border-neutral-800 p-1 rounded-lg inline-flex">
          <button
            onClick={() => setActiveTab("package")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "package"
                ? "bg-neutral-800 text-white shadow-sm"
                : "text-neutral-400 hover:text-white hover:bg-neutral-800/50"
            }`}
          >
            NPM Package (Recommended)
          </button>
          <button
            onClick={() => setActiveTab("api")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "api"
                ? "bg-neutral-800 text-white shadow-sm"
                : "text-neutral-400 hover:text-white hover:bg-neutral-800/50"
            }`}
          >
            REST API
          </button>
        </div>

        {activeTab === "package" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="border border-neutral-800 bg-neutral-900/50 rounded-xl overflow-hidden">
              <div className="p-6 border-b border-neutral-800">
                <h3 className="text-xl font-semibold text-white mb-1">
                  Getting Started
                </h3>
                <p className="text-sm text-neutral-400">
                  Install the client package to interact with your database.
                </p>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <h3 className="text-sm font-medium mb-2 text-white">
                    1. Installation
                  </h3>
                  <CodeBlock
                    code="npm install gdatabase"
                    language="bash"
                    id="install"
                  />
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-2 text-white">
                    2. Initialize
                  </h3>
                  <p className="text-sm text-neutral-400 mb-4">
                    Get your API Key from the Settings page.
                  </p>
                  <CodeBlock
                    code={`import { GDatabase } from "gdatabase";\n\n// Initialize with your API Key and App URL\nconst db = new GDatabase("YOUR_API_KEY", "https://your-app.com");`}
                    id="init"
                  />
                </div>
              </div>
            </div>

            <div className="border border-neutral-800 bg-neutral-900/50 rounded-xl overflow-hidden">
              <div className="p-6 border-b border-neutral-800">
                <h3 className="text-xl font-semibold text-white mb-1">
                  Basic Operations
                </h3>
                <p className="text-sm text-neutral-400">
                  Simple examples for common tasks.
                </p>
              </div>
              <div className="p-6 space-y-8">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-500/10 text-green-500 border border-green-500/20">
                      Read
                    </span>
                    <h3 className="text-sm font-medium text-white">
                      Fetch all items
                    </h3>
                  </div>
                  <CodeBlock
                    code={`const users = await db\n  .database("your-database-id")\n  .table("users")\n  .list();\n\nconsole.log(users);`}
                    id="list"
                  />
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-500/10 text-blue-500 border border-blue-500/20">
                      Create
                    </span>
                    <h3 className="text-sm font-medium text-white">
                      Add a new item
                    </h3>
                  </div>
                  <CodeBlock
                    code={`const newUser = await db\n  .database("your-database-id")\n  .table("users")\n  .create({\n    name: "John Doe",\n    email: "john@example.com",\n    role: "user"\n  });`}
                    id="create"
                  />
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
                      Update
                    </span>
                    <h3 className="text-sm font-medium text-white">
                      Update an item
                    </h3>
                  </div>
                  <CodeBlock
                    code={`await db\n  .database("your-database-id")\n  .table("users")\n  .update("document-id", {\n    role: "admin"\n  });`}
                    id="update"
                  />
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-500/10 text-red-500 border border-red-500/20">
                      Delete
                    </span>
                    <h3 className="text-sm font-medium text-white">
                      Delete an item
                    </h3>
                  </div>
                  <CodeBlock
                    code={`await db\n  .database("your-database-id")\n  .table("users")\n  .delete("document-id");`}
                    id="delete"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "api" && (
          <div className="border border-neutral-800 bg-neutral-900/50 rounded-xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="p-6 border-b border-neutral-800">
              <h3 className="text-xl font-semibold text-white mb-1">
                REST API Endpoints
              </h3>
              <p className="text-sm text-neutral-400">
                Direct access for any language or framework.
              </p>
            </div>
            <div className="p-6 space-y-8">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 rounded text-xs font-bold bg-blue-500 text-white">
                    GET
                  </span>
                  <code className="bg-neutral-950 px-2 py-1 rounded text-sm text-neutral-300 font-mono">
                    /api/v1/:databaseId/:tableId
                  </code>
                </div>
                <p className="text-sm text-neutral-400">
                  List all documents in a table.
                </p>

                <div className="grid gap-2">
                  <div className="text-xs font-medium text-neutral-400 uppercase tracking-wider">
                    Headers
                  </div>
                  <div className="bg-neutral-950 p-2 rounded text-sm font-mono text-neutral-300 border border-neutral-800">
                    x-api-key: YOUR_API_KEY
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-neutral-800">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 rounded text-xs font-bold bg-green-500 text-white">
                    POST
                  </span>
                  <code className="bg-neutral-950 px-2 py-1 rounded text-sm text-neutral-300 font-mono">
                    /api/v1/:databaseId/:tableId
                  </code>
                </div>
                <p className="text-sm text-neutral-400">
                  Create a new document.
                </p>

                <div className="grid gap-2">
                  <div className="text-xs font-medium text-neutral-400 uppercase tracking-wider">
                    Body
                  </div>
                  <CodeBlock
                    code={`{\n  "name": "New Item",\n  "status": "active"\n}`}
                    language="json"
                    id="post-body"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
