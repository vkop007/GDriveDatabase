"use client";

import { useState } from "react";
import { Copy, Check, Terminal, Code2 } from "lucide-react";

interface CodeBlockProps {
  code: string;
  language?: string;
  id: string;
}

export function CodeBlock({
  code,
  language = "typescript",
  id,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
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
          onClick={copyToClipboard}
        >
          {copied ? (
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
}
