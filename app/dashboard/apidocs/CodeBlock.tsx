"use client";

import { useState } from "react";
import { Copy, Check, Terminal, Code2 } from "lucide-react";

interface CodeBlockProps {
  code: string;
  language?: string;
  id: string;
}

// Simple syntax highlighter for common patterns
function highlightSyntax(code: string, language: string): React.ReactNode[] {
  if (language === "bash") {
    return [
      <span key="bash" className="text-green-400">
        {code}
      </span>,
    ];
  }

  if (language === "json") {
    return code.split("\n").map((line, i) => {
      // Highlight JSON syntax
      const highlighted = line
        .replace(/("[\w$]+")(\s*:)/g, "<key>$1</key>$2") // keys
        .replace(/:\s*(".*?")/g, ": <string>$1</string>") // string values
        .replace(/:\s*(true|false)/g, ": <bool>$1</bool>") // booleans
        .replace(/:\s*(\d+)/g, ": <num>$1</num>"); // numbers

      return (
        <span key={i}>
          {highlighted
            .split(
              /(<key>|<\/key>|<string>|<\/string>|<bool>|<\/bool>|<num>|<\/num>)/
            )
            .map((part, j) => {
              if (
                part === "<key>" ||
                part === "</key>" ||
                part === "<string>" ||
                part === "</string>" ||
                part === "<bool>" ||
                part === "</bool>" ||
                part === "<num>" ||
                part === "</num>"
              ) {
                return null;
              }

              // Check what comes before this part to determine styling
              const prevParts = highlighted
                .split(
                  /(<key>|<\/key>|<string>|<\/string>|<bool>|<\/bool>|<num>|<\/num>)/
                )
                .slice(0, j);
              const lastTag = [...prevParts]
                .reverse()
                .find((p) => p?.startsWith("<") && !p?.startsWith("</"));

              if (lastTag === "<key>") {
                return (
                  <span key={j} className="text-purple-400">
                    {part}
                  </span>
                );
              }
              if (lastTag === "<string>") {
                return (
                  <span key={j} className="text-green-400">
                    {part}
                  </span>
                );
              }
              if (lastTag === "<bool>") {
                return (
                  <span key={j} className="text-amber-400">
                    {part}
                  </span>
                );
              }
              if (lastTag === "<num>") {
                return (
                  <span key={j} className="text-cyan-400">
                    {part}
                  </span>
                );
              }
              return (
                <span key={j} className="text-neutral-300">
                  {part}
                </span>
              );
            })}
          {i < code.split("\n").length - 1 ? "\n" : ""}
        </span>
      );
    });
  }

  // TypeScript/JavaScript highlighting
  const lines = code.split("\n");
  return lines.map((line, lineIndex) => {
    const parts: React.ReactNode[] = [];
    let remaining = line;
    let partIndex = 0;

    // Comments
    const commentMatch = remaining.match(/(\/\/.*)$/);
    if (commentMatch) {
      remaining = remaining.slice(0, -commentMatch[1].length);
    }

    // Process the line
    const tokens = remaining.split(
      /(\s+|[{}()[\],;:.]|"[^"]*"|'[^']*'|`[^`]*`)/g
    );

    tokens.forEach((token, i) => {
      if (!token) return;

      // Keywords
      if (
        /^(import|from|const|let|var|async|await|function|return|if|else|try|catch|new|export|default|class|extends|interface|type)$/.test(
          token
        )
      ) {
        parts.push(
          <span key={partIndex++} className="text-purple-400">
            {token}
          </span>
        );
      }
      // Strings
      else if (/^["'`].*["'`]$/.test(token)) {
        parts.push(
          <span key={partIndex++} className="text-green-400">
            {token}
          </span>
        );
      }
      // Numbers
      else if (/^\d+$/.test(token)) {
        parts.push(
          <span key={partIndex++} className="text-cyan-400">
            {token}
          </span>
        );
      }
      // Property access like .database, .table
      else if (token.startsWith(".") && token.length > 1) {
        parts.push(
          <span key={partIndex++}>
            <span className="text-neutral-400">.</span>
            <span className="text-blue-400">{token.slice(1)}</span>
          </span>
        );
      }
      // Function calls
      else if (tokens[i + 1] === "(") {
        parts.push(
          <span key={partIndex++} className="text-blue-400">
            {token}
          </span>
        );
      }
      // Brackets
      else if (/^[{}()[\]]$/.test(token)) {
        parts.push(
          <span key={partIndex++} className="text-neutral-500">
            {token}
          </span>
        );
      }
      // Punctuation
      else if (/^[,;:.]$/.test(token)) {
        parts.push(
          <span key={partIndex++} className="text-neutral-500">
            {token}
          </span>
        );
      }
      // Default
      else {
        parts.push(
          <span key={partIndex++} className="text-neutral-300">
            {token}
          </span>
        );
      }
    });

    // Add comment if present
    if (commentMatch) {
      parts.push(
        <span key={partIndex++} className="text-neutral-600 italic">
          {commentMatch[1]}
        </span>
      );
    }

    return (
      <span key={lineIndex}>
        {parts}
        {lineIndex < lines.length - 1 ? "\n" : ""}
      </span>
    );
  });
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

  const lines = code.split("\n");
  const showLineNumbers = lines.length > 2;

  return (
    <div className="relative group rounded-xl overflow-hidden bg-neutral-950 border border-neutral-800/80 my-4 shadow-lg">
      <div className="flex items-center justify-between px-4 py-2.5 bg-neutral-900/80 border-b border-neutral-800/80">
        <div className="flex items-center gap-2">
          {language === "bash" ? (
            <Terminal className="w-3.5 h-3.5 text-green-400" />
          ) : (
            <Code2 className="w-3.5 h-3.5 text-blue-400" />
          )}
          <span className="text-xs font-medium text-neutral-400">
            {language}
          </span>
        </div>
        <button
          className="h-7 px-2 flex items-center gap-1.5 rounded-md hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors text-xs"
          onClick={copyToClipboard}
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-green-500" />
              <span className="text-green-500">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <div className="p-4 overflow-x-auto">
        <div className="flex">
          {showLineNumbers && (
            <div className="pr-4 text-right select-none border-r border-neutral-800/50 mr-4">
              {lines.map((_, i) => (
                <div
                  key={i}
                  className="text-xs font-mono text-neutral-600 leading-relaxed"
                >
                  {i + 1}
                </div>
              ))}
            </div>
          )}
          <pre className="text-sm font-mono leading-relaxed flex-1">
            <code>{highlightSyntax(code, language)}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}
