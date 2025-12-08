"use client";

import { Check, Copy, X } from "lucide-react";
import { useState } from "react";

interface UploadSuccessModalProps {
  files: { id: string; name: string }[];
  isOpen: boolean;
  onClose: () => void;
}

export default function UploadSuccessModal({
  files,
  isOpen,
  onClose,
}: UploadSuccessModalProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (id: string) => {
    const link = `${window.location.origin}/api/resources?id=${id}`;
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
              <Check className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                Upload Successful
              </h2>
              <p className="text-sm text-neutral-400">
                {files.length} files have been added to your bucket
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-800 rounded-lg transition-colors text-neutral-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-4 p-4 bg-neutral-950/50 border border-neutral-800 rounded-lg group hover:border-neutral-700 transition-all"
            >
              <div className="flex-1 min-w-0 space-y-1">
                <p
                  className="font-medium text-white truncate"
                  title={file.name}
                >
                  {file.name}
                </p>
                <code className="block text-xs text-neutral-500 font-mono bg-neutral-900 px-2 py-1 rounded w-fit">
                  ID: {file.id}
                </code>
              </div>
              <button
                onClick={() => handleCopy(file.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all transform active:scale-95 ${
                  copiedId === file.id
                    ? "bg-green-500/10 text-green-500 border border-green-500/20"
                    : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-white border border-neutral-700"
                }`}
              >
                {copiedId === file.id ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy Link
                  </>
                )}
              </button>
            </div>
          ))}
        </div>

        <div className="p-6 border-t border-neutral-800 bg-neutral-900/50 rounded-b-xl">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-white text-black font-semibold rounded-lg hover:bg-neutral-200 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
