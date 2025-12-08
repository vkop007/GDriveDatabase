"use client";

import { useState, useRef } from "react";
import {
  Copy,
  Trash2,
  Upload,
  File as FileIcon,
  Loader2,
  Image as ImageIcon,
  LayoutGrid,
  Table as TableIcon,
} from "lucide-react";
import { uploadBucketFiles, deleteBucketFile } from "../../app/actions/bucket";
import Image from "next/image";
import UploadSuccessModal from "./UploadSuccessModal";

interface FileManagerProps {
  initialFiles: any[];
}

export default function FileManager({ initialFiles }: FileManagerProps) {
  const [files, setFiles] = useState(initialFiles);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<any[] | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [isDragging, setIsDragging] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.length) return;

    setIsUploading(true);
    const formData = new FormData();
    Array.from(event.target.files).forEach((file) => {
      formData.append("files", file);
    });

    try {
      const result = (await uploadBucketFiles(formData)) as any;
      if (result.success && result.files) {
        setUploadedFiles(result.files);
      } else {
        alert("Upload failed");
      }
    } catch (e) {
      console.error(e);
      alert("Upload error");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const copyLink = (id: string) => {
    const link = `${window.location.origin}/api/resources?id=${id}`;
    navigator.clipboard.writeText(link);
    alert("Resource Link Copied!");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    setIsDeleting(id);
    const formData = new FormData();
    formData.append("fileId", id);
    await deleteBucketFile(formData);
    setFiles(files.filter((f) => f.id !== id));
    setIsDeleting(null);
  };

  const startRename = (file: any) => {
    setRenamingId(file.id);
    setRenameValue(file.name);
  };

  const submitRename = async () => {
    if (!renamingId || !renameValue.trim()) return;

    const fileId = renamingId;
    const newName = renameValue.trim();

    // Optimistic update
    setFiles(files.map((f) => (f.id === fileId ? { ...f, name: newName } : f)));
    setRenamingId(null);

    try {
      // Dynamic import to avoid server action issues if any
      const { renameBucketFile } = await import("../../app/actions/bucket");
      const formData = new FormData();
      formData.append("fileId", fileId);
      formData.append("newName", newName);
      await renameBucketFile(formData);
    } catch (error) {
      console.error("Rename failed", error);
      alert("Rename failed");
      // Revert on failure involves complex state management relying on router refresh usually
      // For now we assume success or user will refresh
    }
  };

  const isImage = (mimeType: string) => mimeType.includes("image");

  const onDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current += 1;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current -= 1;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  };

  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    dragCounter.current = 0;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setIsUploading(true);
      const formData = new FormData();
      Array.from(e.dataTransfer.files).forEach((file) => {
        formData.append("files", file);
      });

      try {
        const result = (await uploadBucketFiles(formData)) as any;
        if (result.success && result.files) {
          setUploadedFiles(result.files);
        } else {
          alert("Upload failed");
        }
      } catch (error) {
        console.error(error);
        alert("Upload error");
      } finally {
        setIsUploading(false);
      }
    }
  };

  return (
    <div
      className="space-y-6 relative min-h-[500px]"
      onDragEnter={onDragEnter}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {/* Drag Overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-50 bg-blue-500/10 border-2 border-blue-500 border-dashed rounded-xl flex items-center justify-center backdrop-blur-sm transition-all pointer-events-none">
          <div className="flex flex-col items-center animate-bounce">
            <Upload className="w-12 h-12 text-blue-400 mb-2" />
            <p className="text-xl font-bold text-blue-100">
              Drop files to upload
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold mb-1">Storage Bucket</h2>
          <p className="text-neutral-400 text-sm">
            Upload assets and get permanent API links.
          </p>
        </div>

        <div className="relative">
          <input
            type="file"
            multiple
            className="hidden"
            ref={fileInputRef}
            onChange={handleUpload}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {isUploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            Upload Files
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-6 border-b border-neutral-800 pb-4">
        <button
          onClick={() => setViewMode("grid")}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            viewMode === "grid"
              ? "bg-purple-500/20 text-purple-400 border border-purple-500/20"
              : "text-neutral-400 hover:text-white hover:bg-neutral-800"
          }`}
        >
          <LayoutGrid className="w-4 h-4" />
          Grid
        </button>
        <button
          onClick={() => setViewMode("table")}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            viewMode === "table"
              ? "bg-purple-500/20 text-purple-400 border border-purple-500/20"
              : "text-neutral-400 hover:text-white hover:bg-neutral-800"
          }`}
        >
          <TableIcon className="w-4 h-4" />
          List
        </button>
      </div>

      {viewMode === "grid" ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {files.map((file) => (
            <div
              key={file.id}
              className="group relative bg-neutral-900/50 border border-neutral-800 rounded-xl overflow-hidden hover:border-neutral-700 transition-colors"
            >
              {/* Preview */}
              <div className="aspect-square relative bg-neutral-950/50 flex items-center justify-center p-4">
                {isImage(file.mimeType) ? (
                  <Image
                    src={`/api/resources?id=${file.id}`}
                    alt={file.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <FileIcon className="w-12 h-12 text-neutral-600" />
                )}
              </div>

              {/* Info */}
              <div className="p-3">
                {renamingId === file.id ? (
                  <input
                    type="text"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={submitRename}
                    onKeyDown={(e) => e.key === "Enter" && submitRename()}
                    className="w-full bg-neutral-800 text-white text-sm px-2 py-1 rounded border border-neutral-600 focus:border-blue-500 outline-none mb-2"
                    autoFocus
                  />
                ) : (
                  <p
                    className="text-sm font-medium text-neutral-200 truncate mb-2 cursor-pointer hover:text-blue-400"
                    title={file.name + " (Click to rename)"}
                    onClick={() => startRename(file)}
                  >
                    {file.name}
                  </p>
                )}

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyLink(file.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-xs text-neutral-300 rounded font-medium transition-colors"
                  >
                    <Copy className="w-3 h-3" />
                    Link
                  </button>
                  <button
                    onClick={() => handleDelete(file.id)}
                    disabled={isDeleting === file.id}
                    className="p-1.5 text-neutral-500 hover:text-red-400 transition-colors rounded hover:bg-red-500/10"
                  >
                    {isDeleting === file.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Trash2 className="w-3 h-3" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}

          {files.length === 0 && (
            <div className="col-span-full py-12 flex flex-col items-center justify-center text-neutral-500 border-2 border-dashed border-neutral-800 rounded-xl">
              <Upload className="w-10 h-10 mb-4 opacity-50" />
              <p>No files in bucket</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="mt-2 text-blue-400 hover:underline"
              >
                Upload some files
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="border border-neutral-800 rounded-xl overflow-hidden">
          <table className="w-full text-left bg-neutral-900/50">
            <thead>
              <tr className="border-b border-neutral-800 text-xs font-semibold text-neutral-400 uppercase tracking-wider bg-neutral-900">
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {files.map((file) => (
                <tr
                  key={file.id}
                  className="group hover:bg-neutral-800/50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-neutral-800 flex items-center justify-center shrink-0 border border-neutral-700">
                        {isImage(file.mimeType) ? (
                          <div className="relative w-full h-full">
                            <Image
                              src={`/api/resources?id=${file.id}`}
                              alt=""
                              fill
                              className="object-cover rounded"
                              unoptimized
                            />
                          </div>
                        ) : (
                          <FileIcon className="w-4 h-4 text-neutral-500" />
                        )}
                      </div>
                      {renamingId === file.id ? (
                        <input
                          type="text"
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onBlur={submitRename}
                          onKeyDown={(e) => e.key === "Enter" && submitRename()}
                          className="bg-neutral-800 text-white text-sm px-2 py-1 rounded border border-neutral-600 focus:border-blue-500 outline-none w-full max-w-xs"
                          autoFocus
                        />
                      ) : (
                        <span
                          className="font-medium text-white truncate max-w-xs cursor-pointer hover:text-blue-400"
                          onClick={() => startRename(file)}
                        >
                          {file.name}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <code className="text-xs font-mono text-neutral-400">
                        {file.id}
                      </code>
                      <button
                        onClick={() => copyLink(file.id)}
                        className="text-neutral-600 hover:text-white transition-colors"
                        title="Copy ID"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => copyLink(file.id)}
                        className="text-sm text-blue-400 hover:text-blue-300 font-medium px-3 py-1.5 rounded hover:bg-blue-500/10 transition-colors"
                      >
                        Copy Link
                      </button>
                      <button
                        onClick={() => handleDelete(file.id)}
                        className="p-2 text-neutral-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                        disabled={isDeleting === file.id}
                      >
                        {isDeleting === file.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {files.length === 0 && (
                <tr>
                  <td
                    colSpan={3}
                    className="px-6 py-12 text-center text-neutral-500"
                  >
                    No files found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <UploadSuccessModal
        files={uploadedFiles || []}
        isOpen={!!uploadedFiles}
        onClose={() => {
          setUploadedFiles(null);
          window.location.reload(); // Refresh to show new files in grid
        }}
      />
    </div>
  );
}
