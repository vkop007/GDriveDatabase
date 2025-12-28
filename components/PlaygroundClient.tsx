"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import {
  Play,
  Loader2,
  Copy,
  Trash2,
  Terminal,
  Code2,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { executePlaygroundCode } from "@/app/actions/playground";

// Dynamically import Monaco Editor to avoid SSR issues
const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

const DEFAULT_CODE = `// GDatabase SDK Playground
// The 'db' instance is already initialized for you!

(async () => {
  // Example: List all items from a table
  const items = await db.database("YOUR_DATABASE_ID").table("YOUR_TABLE_ID").list();
  console.log("Items:", items);

  // Example: Get table schema
  // const schema = await db.database("YOUR_DATABASE_ID").table("YOUR_TABLE_ID").schema().get();
  // console.log("Schema:", schema);
})();
`;

// JSON syntax highlighting function
function highlightJSON(text: string): React.ReactNode {
  // Try to find and highlight JSON in the text
  let key = 0;

  // Check if the entire text is JSON
  const trimmed = text.trim();
  if (
    (trimmed.startsWith("{") || trimmed.startsWith("[")) &&
    (trimmed.endsWith("}") || trimmed.endsWith("]"))
  ) {
    try {
      JSON.parse(trimmed);
      return highlightJSONString(trimmed, key);
    } catch {
      // Not valid JSON, continue with normal processing
    }
  }

  // Look for "Label: JSON" pattern
  const colonIndex = text.indexOf(":");
  if (colonIndex > 0 && colonIndex < 30) {
    const label = text.slice(0, colonIndex + 1);
    const rest = text.slice(colonIndex + 1).trim();

    if (
      (rest.startsWith("{") || rest.startsWith("[")) &&
      (rest.endsWith("}") || rest.endsWith("]"))
    ) {
      try {
        JSON.parse(rest);
        return (
          <>
            <span className="text-amber-400">{label}</span>{" "}
            {highlightJSONString(rest, key)}
          </>
        );
      } catch {
        // Not valid JSON
      }
    }
  }

  return text;
}

function highlightJSONString(json: string, startKey: number): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let i = 0;
  let key = startKey;

  const addPart = (content: string, className: string) => {
    parts.push(
      <span key={key++} className={className}>
        {content}
      </span>
    );
  };

  while (i < json.length) {
    const char = json[i];

    // Whitespace and newlines
    if (/\s/.test(char)) {
      let ws = "";
      while (i < json.length && /\s/.test(json[i])) {
        ws += json[i];
        i++;
      }
      parts.push(<span key={key++}>{ws}</span>);
      continue;
    }

    // Brackets and braces
    if (char === "{" || char === "}" || char === "[" || char === "]") {
      addPart(char, "text-neutral-400");
      i++;
      continue;
    }

    // Comma and colon
    if (char === "," || char === ":") {
      addPart(char, "text-neutral-500");
      i++;
      continue;
    }

    // String
    if (char === '"') {
      let str = '"';
      i++;
      while (i < json.length && json[i] !== '"') {
        if (json[i] === "\\") {
          str += json[i];
          i++;
          if (i < json.length) {
            str += json[i];
            i++;
          }
        } else {
          str += json[i];
          i++;
        }
      }
      if (i < json.length) {
        str += '"';
        i++;
      }

      // Check if this is a key (followed by colon)
      let j = i;
      while (j < json.length && /\s/.test(json[j])) j++;
      const isKey = json[j] === ":";

      if (isKey) {
        addPart(str, "text-cyan-400");
      } else {
        addPart(str, "text-emerald-400");
      }
      continue;
    }

    // Number
    if (/[\d\-]/.test(char)) {
      let num = "";
      while (i < json.length && /[\d.\-eE+]/.test(json[i])) {
        num += json[i];
        i++;
      }
      addPart(num, "text-orange-400");
      continue;
    }

    // Boolean or null
    if (json.slice(i, i + 4) === "true") {
      addPart("true", "text-purple-400");
      i += 4;
      continue;
    }
    if (json.slice(i, i + 5) === "false") {
      addPart("false", "text-purple-400");
      i += 5;
      continue;
    }
    if (json.slice(i, i + 4) === "null") {
      addPart("null", "text-neutral-500");
      i += 4;
      continue;
    }

    // Other characters
    parts.push(<span key={key++}>{char}</span>);
    i++;
  }

  return <>{parts}</>;
}

interface PlaygroundClientProps {
  initialApiKey: string;
}

export default function PlaygroundClient({
  initialApiKey,
}: PlaygroundClientProps) {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [apiKey, setApiKey] = useState(initialApiKey);
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [success, setSuccess] = useState<boolean | null>(null);

  const handleRun = async () => {
    if (!apiKey) {
      toast.error("Please enter your API Key");
      return;
    }

    setIsRunning(true);
    setOutput([]);
    setError(null);
    setSuccess(null);

    try {
      const baseUrl = window.location.origin;
      const result = await executePlaygroundCode(code, apiKey, baseUrl);

      setOutput(result.output);
      setDuration(result.duration);
      setSuccess(result.success);

      if (!result.success && result.error) {
        setError(result.error);
      }
    } catch (err: any) {
      setError(err.message || "Execution failed");
      setSuccess(false);
    } finally {
      setIsRunning(false);
    }
  };

  const handleClear = () => {
    setOutput([]);
    setError(null);
    setSuccess(null);
    setDuration(null);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output.join("\n"));
    toast.success("Output copied to clipboard");
  };

  return (
    <div className="min-h-screen bg-neutral-950 p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-2.5 rounded-xl bg-linear-to-br from-primary-from/20 to-primary-to/20 border border-primary/30">
            <Code2 className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
              SDK Playground
              <span className="text-xs bg-linear-to-r from-primary-from/10 to-primary-to/10 text-primary px-2.5 py-1 rounded-full border border-primary/20 font-medium">
                gdatabase
              </span>
            </h1>
            <p className="text-neutral-400 mt-1">
              Write and test SDK code in real-time
            </p>
          </div>
        </div>

        {/* API Key Input */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-neutral-900/80 border border-neutral-800 rounded-xl px-4 py-2.5">
            <Sparkles size={16} className="text-amber-400" />
            <span className="text-sm text-neutral-400 font-medium">
              API Key
            </span>
            <div className="w-px h-4 bg-neutral-700" />
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk_..."
              className="bg-transparent border-none text-sm w-40 focus:outline-none text-neutral-200 placeholder:text-neutral-600"
            />
          </div>
          <button
            onClick={handleRun}
            disabled={isRunning}
            className="flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-primary-from to-primary-to text-white font-medium rounded-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
          >
            {isRunning ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Play size={18} fill="white" />
            )}
            Run Code
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-200px)]">
        {/* Code Editor Panel */}
        <div className="group relative rounded-2xl bg-[#0a0a0a] border border-neutral-800/50 hover:border-primary/40 transition-all duration-300 overflow-hidden flex flex-col shadow-2xl shadow-black/50">
          {/* Glow effect */}
          <div className="absolute -inset-px bg-linear-to-b from-primary/10 via-transparent to-transparent pointer-events-none rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          <div className="relative flex items-center justify-between px-4 py-3 border-b border-neutral-800/50 bg-neutral-900/30 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <Code2 size={16} className="text-primary" />
              <span className="text-sm font-medium text-neutral-300">
                Code Editor
              </span>
              <span className="text-[10px] text-neutral-600 bg-neutral-800/50 px-2 py-0.5 rounded-md">
                TypeScript
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/80 shadow-lg shadow-red-500/30" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80 shadow-lg shadow-amber-500/30" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80 shadow-lg shadow-emerald-500/30" />
            </div>
          </div>

          <div className="flex-1 overflow-hidden bg-[#0a0a0a]">
            <Editor
              height="100%"
              defaultLanguage="typescript"
              value={code}
              onChange={(value) => setCode(value || "")}
              beforeMount={(monaco) => {
                // Define custom dark theme
                monaco.editor.defineTheme("gdatabase-dark", {
                  base: "vs-dark",
                  inherit: true,
                  rules: [
                    {
                      token: "comment",
                      foreground: "4a5568",
                      fontStyle: "italic",
                    },
                    { token: "keyword", foreground: "eb0081" },
                    { token: "string", foreground: "34d399" },
                    { token: "number", foreground: "fb923c" },
                    { token: "type", foreground: "38bdf8" },
                    { token: "function", foreground: "fbbf24" },
                    { token: "variable", foreground: "e5e5e5" },
                    { token: "constant", foreground: "fb923c" },
                  ],
                  colors: {
                    "editor.background": "#0a0a0a",
                    "editor.foreground": "#e5e5e5",
                    "editor.lineHighlightBackground": "#1a1a1a",
                    "editor.selectionBackground": "#eb008130",
                    "editor.inactiveSelectionBackground": "#eb008120",
                    "editorCursor.foreground": "#eb0081",
                    "editorLineNumber.foreground": "#3a3a3a",
                    "editorLineNumber.activeForeground": "#666666",
                    "editorIndentGuide.background": "#1a1a1a",
                    "editorIndentGuide.activeBackground": "#333333",
                    "editor.selectionHighlightBackground": "#eb008120",
                    "editorBracketMatch.background": "#eb008130",
                    "editorBracketMatch.border": "#eb008150",
                  },
                });

                // Configure TypeScript compiler options
                monaco.languages.typescript.typescriptDefaults.setCompilerOptions(
                  {
                    target: monaco.languages.typescript.ScriptTarget.ESNext,
                    module: monaco.languages.typescript.ModuleKind.ESNext,
                    allowNonTsExtensions: true,
                    strict: false,
                    noEmit: true,
                    esModuleInterop: true,
                    allowJs: true,
                  }
                );

                // Add type definitions for the playground environment
                monaco.languages.typescript.typescriptDefaults.addExtraLib(
                  `
                  interface TableClient {
                    list(): Promise<any[]>;
                    get(id: string): Promise<any>;
                    create(data: Record<string, any>): Promise<any>;
                    update(id: string, data: Record<string, any>): Promise<any>;
                    delete(id: string): Promise<void>;
                    schema(): SchemaClient;
                  }
                  
                  interface SchemaClient {
                    get(): Promise<any>;
                    update(schema: any): Promise<any>;
                  }
                  
                  interface DatabaseClient {
                    table(tableId: string): TableClient;
                  }
                  
                  interface BucketClient {
                    upload(file: File): Promise<any>;
                    list(): Promise<any[]>;
                    delete(fileId: string): Promise<void>;
                  }
                  
                  interface FunctionsClient {
                    run(functionId: string, params?: Record<string, any>): Promise<any>;
                  }
                  
                  interface GDatabase {
                    database(databaseId: string): DatabaseClient;
                    bucket(): BucketClient;
                    functions(): FunctionsClient;
                  }
                  
                  declare const db: GDatabase;
                  declare const console: Console;
                `,
                  "ts:playground-globals.d.ts"
                );
              }}
              onMount={(editor, monaco) => {
                monaco.editor.setTheme("gdatabase-dark");
              }}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                fontFamily:
                  "'JetBrains Mono', 'Fira Code', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                fontLigatures: true,
                lineNumbers: "on",
                scrollBeyondLastLine: false,
                wordWrap: "on",
                automaticLayout: true,
                padding: { top: 16, bottom: 16 },
                lineHeight: 24,
                cursorBlinking: "smooth",
                cursorSmoothCaretAnimation: "on",
                smoothScrolling: true,
                contextmenu: false,
                folding: true,
                foldingHighlight: false,
                renderLineHighlight: "line",
                renderLineHighlightOnlyWhenFocus: false,
                guides: {
                  indentation: true,
                  bracketPairs: true,
                },
                bracketPairColorization: {
                  enabled: true,
                },
                scrollbar: {
                  vertical: "auto",
                  horizontal: "auto",
                  verticalScrollbarSize: 6,
                  horizontalScrollbarSize: 6,
                  verticalSliderSize: 6,
                  horizontalSliderSize: 6,
                },
              }}
              loading={
                <div className="flex items-center justify-center h-full bg-[#0a0a0a]">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <span className="text-sm text-neutral-500">
                      Loading editor...
                    </span>
                  </div>
                </div>
              }
            />
          </div>
        </div>

        {/* Console Output Panel */}
        <div className="group relative rounded-2xl bg-[#0a0a0a] border border-neutral-800/50 hover:border-emerald-500/40 transition-all duration-300 overflow-hidden flex flex-col shadow-2xl shadow-black/50">
          {/* Glow effect */}
          <div className="absolute -inset-px bg-linear-to-b from-emerald-500/10 via-transparent to-transparent pointer-events-none rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          <div className="relative flex items-center justify-between px-4 py-3 border-b border-neutral-800/50 bg-neutral-900/30 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Terminal size={16} className="text-emerald-400" />
                <span className="text-sm font-medium text-neutral-300">
                  Console Output
                </span>
              </div>
              {success !== null && (
                <div
                  className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg font-medium ${
                    success
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                      : "bg-red-500/10 text-red-400 border border-red-500/30"
                  }`}
                >
                  {success ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                  {success ? "Success" : "Error"}
                </div>
              )}
              {duration !== null && (
                <div className="flex items-center gap-1.5 text-xs text-neutral-500 bg-neutral-800/50 px-2 py-1 rounded-lg">
                  <Clock size={12} />
                  {duration}ms
                </div>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleCopy}
                disabled={output.length === 0}
                className="p-2 text-neutral-500 hover:text-white hover:bg-neutral-800/50 rounded-lg transition-all disabled:opacity-30"
                title="Copy Output"
              >
                <Copy size={14} />
              </button>
              <button
                onClick={handleClear}
                disabled={output.length === 0 && !error}
                className="p-2 text-neutral-500 hover:text-white hover:bg-neutral-800/50 rounded-lg transition-all disabled:opacity-30"
                title="Clear Console"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          <div
            className="flex-1 overflow-auto bg-[#0a0a0a] p-4 font-mono text-sm"
            style={{
              fontFamily:
                "'JetBrains Mono', 'Fira Code', ui-monospace, monospace",
            }}
          >
            {output.length === 0 && !error ? (
              <div className="h-full flex flex-col items-center justify-center text-neutral-700 gap-4">
                <div className="relative">
                  <Terminal size={48} className="opacity-20" />
                  <div className="absolute inset-0 bg-linear-to-t from-[#0a0a0a] to-transparent" />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-sm text-neutral-500">
                    Run your code to see output here
                  </p>
                  <p className="text-xs text-neutral-600">
                    Press the Run Code button or use your API
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {output.map((line, i) => (
                  <div
                    key={i}
                    className="text-neutral-200 whitespace-pre-wrap leading-relaxed flex group/line"
                  >
                    <span className="text-primary/50 select-none mr-3 font-bold shrink-0 group-hover/line:text-primary/80 transition-colors">
                      {line.startsWith("→") ? "→" : ">"}
                    </span>
                    <span
                      className={
                        line.startsWith("[ERROR]")
                          ? "text-red-400"
                          : line.startsWith("[WARN]")
                          ? "text-amber-400"
                          : line.startsWith("[INFO]")
                          ? "text-blue-400"
                          : ""
                      }
                    >
                      {highlightJSON(
                        line.startsWith("→") ? line.slice(1).trim() : line
                      )}
                    </span>
                  </div>
                ))}
                {error && (
                  <div className="text-red-400 mt-3 p-4 bg-red-500/5 border border-red-500/20 rounded-xl">
                    <span className="text-red-500 font-semibold">Error: </span>
                    {error}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
