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
  Video,
  Music,
  FileText,
  FileCode,
  FileArchive,
  FileSpreadsheet,
  Presentation,
  FileJson,
  Eye,
  X,
  ZoomIn,
  ZoomOut,
  Download,
} from "lucide-react";
import { uploadBucketFiles, deleteBucketFile } from "../../app/actions/bucket";
import Image from "next/image";
import UploadSuccessModal from "./UploadSuccessModal";
import { useConfirm } from "../../contexts/ConfirmContext";
import { createPortal } from "react-dom";

// Helper to get file icon based on MIME type
const getFileIcon = (mimeType: string) => {
  if (mimeType.includes("video")) {
    return <Video className="w-12 h-12 text-purple-400" />;
  }
  if (mimeType.includes("audio")) {
    return <Music className="w-12 h-12 text-green-400" />;
  }
  if (mimeType.includes("pdf")) {
    return <FileText className="w-12 h-12 text-red-400" />;
  }
  if (
    mimeType.includes("zip") ||
    mimeType.includes("rar") ||
    mimeType.includes("tar") ||
    mimeType.includes("gzip") ||
    mimeType.includes("compressed")
  ) {
    return <FileArchive className="w-12 h-12 text-amber-400" />;
  }
  if (
    mimeType.includes("spreadsheet") ||
    mimeType.includes("excel") ||
    mimeType.includes("csv")
  ) {
    return <FileSpreadsheet className="w-12 h-12 text-emerald-400" />;
  }
  if (mimeType.includes("presentation") || mimeType.includes("powerpoint")) {
    return <Presentation className="w-12 h-12 text-orange-400" />;
  }
  if (mimeType.includes("json")) {
    return <FileJson className="w-12 h-12 text-yellow-400" />;
  }
  if (
    mimeType.includes("javascript") ||
    mimeType.includes("typescript") ||
    mimeType.includes("html") ||
    mimeType.includes("css") ||
    mimeType.includes("xml")
  ) {
    return <FileCode className="w-12 h-12 text-blue-400" />;
  }
  if (
    mimeType.includes("text") ||
    mimeType.includes("document") ||
    mimeType.includes("word")
  ) {
    return <FileText className="w-12 h-12 text-sky-400" />;
  }
  return <FileIcon className="w-12 h-12 text-neutral-500" />;
};

// Helper to get small file icon for table view
const getSmallFileIcon = (mimeType: string) => {
  if (mimeType.includes("video")) {
    return <Video className="w-4 h-4 text-purple-400" />;
  }
  if (mimeType.includes("audio")) {
    return <Music className="w-4 h-4 text-green-400" />;
  }
  if (mimeType.includes("pdf")) {
    return <FileText className="w-4 h-4 text-red-400" />;
  }
  if (
    mimeType.includes("zip") ||
    mimeType.includes("rar") ||
    mimeType.includes("tar") ||
    mimeType.includes("gzip") ||
    mimeType.includes("compressed")
  ) {
    return <FileArchive className="w-4 h-4 text-amber-400" />;
  }
  if (
    mimeType.includes("spreadsheet") ||
    mimeType.includes("excel") ||
    mimeType.includes("csv")
  ) {
    return <FileSpreadsheet className="w-4 h-4 text-emerald-400" />;
  }
  if (mimeType.includes("presentation") || mimeType.includes("powerpoint")) {
    return <Presentation className="w-4 h-4 text-orange-400" />;
  }
  if (mimeType.includes("json")) {
    return <FileJson className="w-4 h-4 text-yellow-400" />;
  }
  if (
    mimeType.includes("javascript") ||
    mimeType.includes("typescript") ||
    mimeType.includes("html") ||
    mimeType.includes("css") ||
    mimeType.includes("xml")
  ) {
    return <FileCode className="w-4 h-4 text-blue-400" />;
  }
  if (
    mimeType.includes("text") ||
    mimeType.includes("document") ||
    mimeType.includes("word")
  ) {
    return <FileText className="w-4 h-4 text-sky-400" />;
  }
  return <FileIcon className="w-4 h-4 text-neutral-500" />;
};

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
  const [previewFile, setPreviewFile] = useState<any | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);
  const confirm = useConfirm();

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

  const handleDelete = async (id: string, fileName?: string) => {
    const confirmed = await confirm({
      title: "Delete File",
      description: `Are you sure you want to delete "${
        fileName || "this file"
      }"? This action cannot be undone.`,
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "danger",
    });
    if (!confirmed) return;
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
        <div className="absolute inset-0 z-50 bg-primary/10 border-2 border-primary border-dashed rounded-xl flex items-center justify-center backdrop-blur-sm transition-all pointer-events-none">
          <div className="flex flex-col items-center animate-bounce">
            <Upload className="w-12 h-12 text-primary mb-2" />
            <p className="text-xl font-bold text-white">Drop files to upload</p>
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-neutral-900 via-neutral-900 to-neutral-800 border border-neutral-800 p-6 mb-8">
        {/* Glow effect */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-linear-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/20">
                <Upload className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-2xl font-bold bg-linear-to-r from-white to-neutral-400 bg-clip-text text-transparent">
                Storage Bucket
              </h2>
            </div>
            <p className="text-neutral-400 text-sm ml-13">
              Upload assets and get permanent API links. Drag & drop supported.
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
              className="group flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white rounded-xl font-medium transition-all disabled:opacity-50 shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98]"
            >
              {isUploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4 group-hover:animate-bounce" />
              )}
              Upload Files
            </button>
          </div>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex items-center gap-2 mb-6 p-1.5 bg-neutral-900/50 rounded-xl border border-neutral-800 w-fit">
        <button
          onClick={() => setViewMode("grid")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            viewMode === "grid"
              ? "bg-primary/10 text-primary border border-primary/20 shadow-sm"
              : "text-neutral-400 hover:text-white hover:bg-neutral-800/50"
          }`}
        >
          <LayoutGrid className="w-4 h-4" />
          Grid
        </button>
        <button
          onClick={() => setViewMode("table")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            viewMode === "table"
              ? "bg-primary/10 text-primary border border-primary/20 shadow-sm"
              : "text-neutral-400 hover:text-white hover:bg-neutral-800/50"
          }`}
        >
          <TableIcon className="w-4 h-4" />
          List
        </button>
      </div>

      {viewMode === "grid" ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-5">
          {files.map((file) => (
            <div
              key={file.id}
              className="group relative bg-linear-to-br from-neutral-900 to-neutral-900/50 border border-neutral-800 rounded-2xl overflow-hidden hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1"
            >
              {/* Preview */}
              <div
                className={`aspect-square relative bg-linear-to-br from-neutral-950/80 to-neutral-900/50 flex items-center justify-center p-4 overflow-hidden ${
                  isImage(file.mimeType) ? "cursor-pointer" : ""
                }`}
                onClick={() => isImage(file.mimeType) && setPreviewFile(file)}
              >
                {isImage(file.mimeType) ? (
                  <>
                    <Image
                      src={`/api/resources?id=${file.id}`}
                      alt={file.name}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      unoptimized
                    />
                    {/* Overlay with Eye icon on hover */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <div className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                        <Eye className="w-5 h-5 text-white" />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    {getFileIcon(file.mimeType)}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-4 bg-linear-to-t from-neutral-900 to-transparent">
                {renamingId === file.id ? (
                  <input
                    type="text"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={submitRename}
                    onKeyDown={(e) => e.key === "Enter" && submitRename()}
                    className="w-full bg-neutral-800/80 backdrop-blur text-white text-sm px-3 py-2 rounded-lg border border-neutral-600 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none mb-3"
                    autoFocus
                  />
                ) : (
                  <p
                    className="text-sm font-medium text-white truncate mb-3 cursor-pointer hover:text-primary transition-colors"
                    title={file.name + " (Click to rename)"}
                    onClick={() => startRename(file)}
                  >
                    {file.name}
                  </p>
                )}

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => copyLink(file.id)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-linear-to-r from-primary/20 to-primary/10 hover:from-primary hover:to-primary/80 text-xs text-primary hover:text-white rounded-lg font-medium transition-all border border-primary/20 hover:border-primary shadow-sm hover:shadow-primary/25"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span className="text-[11px]">Copy</span>
                  </button>
                  <button
                    onClick={() => handleDelete(file.id, file.name)}
                    disabled={isDeleting === file.id}
                    className="p-2 text-neutral-400 hover:text-white bg-neutral-800/50 hover:bg-red-500 transition-all rounded-lg border border-neutral-700/50 hover:border-red-500"
                  >
                    {isDeleting === file.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}

          {files.length === 0 && (
            <div className="col-span-full py-16 flex flex-col items-center justify-center text-neutral-400 border-2 border-dashed border-neutral-700/50 rounded-2xl bg-linear-to-br from-neutral-900/50 to-transparent">
              <div className="w-16 h-16 rounded-2xl bg-neutral-800/50 flex items-center justify-center mb-4">
                <Upload className="w-8 h-8 text-neutral-500" />
              </div>
              <p className="text-lg font-medium mb-1">No files in bucket</p>
              <p className="text-sm text-neutral-500 mb-4">
                Drag & drop files or click to upload
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 text-sm bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors border border-primary/20"
              >
                Upload some files
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="border border-neutral-800 rounded-2xl overflow-hidden bg-linear-to-br from-neutral-900 to-neutral-900/50">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-neutral-800 text-xs font-semibold text-neutral-400 uppercase tracking-wider bg-neutral-900/80">
                <th className="px-6 py-4">File</th>
                <th className="px-6 py-4 hidden md:table-cell">ID</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/50">
              {files.map((file) => (
                <tr
                  key={file.id}
                  className="group hover:bg-primary/5 transition-all duration-200"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-linear-to-br from-neutral-800 to-neutral-800/50 flex items-center justify-center shrink-0 border border-neutral-700/50 group-hover:border-primary/20 transition-colors overflow-hidden">
                        {isImage(file.mimeType) ? (
                          <div className="relative w-full h-full">
                            <Image
                              src={`/api/resources?id=${file.id}`}
                              alt=""
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                        ) : (
                          getSmallFileIcon(file.mimeType)
                        )}
                      </div>
                      <div className="flex flex-col">
                        {renamingId === file.id ? (
                          <input
                            type="text"
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onBlur={submitRename}
                            onKeyDown={(e) =>
                              e.key === "Enter" && submitRename()
                            }
                            className="bg-neutral-800/80 backdrop-blur text-white text-sm px-3 py-1.5 rounded-lg border border-neutral-600 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none w-full max-w-xs"
                            autoFocus
                          />
                        ) : (
                          <span
                            className="font-medium text-white truncate max-w-xs cursor-pointer hover:text-primary transition-colors"
                            onClick={() => startRename(file)}
                          >
                            {file.name}
                          </span>
                        )}
                        <span className="text-xs text-neutral-500 mt-0.5 md:hidden">
                          {file.id.slice(0, 12)}...
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    <div className="flex items-center gap-2">
                      <code className="text-xs font-mono text-neutral-500 bg-neutral-800/50 px-2 py-1 rounded">
                        {file.id}
                      </code>
                      <button
                        onClick={() => copyLink(file.id)}
                        className="text-neutral-600 hover:text-primary transition-colors p-1 hover:bg-primary/10 rounded"
                        title="Copy ID"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => copyLink(file.id)}
                        className="text-sm text-primary hover:text-white font-medium px-4 py-2 rounded-lg bg-primary/10 hover:bg-primary transition-all border border-primary/20 hover:border-primary"
                      >
                        Copy Link
                      </button>
                      <button
                        onClick={() => handleDelete(file.id, file.name)}
                        className="p-2 text-neutral-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all border border-transparent hover:border-red-500/20"
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
                  <td colSpan={3} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 rounded-2xl bg-neutral-800/50 flex items-center justify-center mb-4">
                        <Upload className="w-8 h-8 text-neutral-500" />
                      </div>
                      <p className="text-lg font-medium text-neutral-400 mb-1">
                        No files found
                      </p>
                      <p className="text-sm text-neutral-500">
                        Upload files to get started
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Image Preview Modal */}
      {previewFile &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center"
            onClick={() => {
              setPreviewFile(null);
              setZoomLevel(1);
            }}
          >
            {/* Close button */}
            <button
              onClick={() => {
                setPreviewFile(null);
                setZoomLevel(1);
              }}
              className="absolute top-6 right-6 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all border border-white/20 z-10"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Controls */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 px-4 py-3 rounded-xl bg-neutral-900/90 backdrop-blur-xl border border-neutral-700/50 z-10">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setZoomLevel(Math.max(0.5, zoomLevel - 0.25));
                }}
                className="p-2 rounded-lg hover:bg-neutral-800 text-white transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="w-5 h-5" />
              </button>
              <span className="text-sm text-neutral-400 min-w-[60px] text-center">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setZoomLevel(Math.min(3, zoomLevel + 0.25));
                }}
                className="p-2 rounded-lg hover:bg-neutral-800 text-white transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="w-5 h-5" />
              </button>
              <div className="w-px h-6 bg-neutral-700" />
              <a
                href={`/api/resources?id=${previewFile.id}`}
                download={previewFile.name}
                onClick={(e) => e.stopPropagation()}
                className="p-2 rounded-lg hover:bg-neutral-800 text-white transition-colors"
                title="Download"
              >
                <Download className="w-5 h-5" />
              </a>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  copyLink(previewFile.id);
                }}
                className="p-2 rounded-lg hover:bg-neutral-800 text-white transition-colors"
                title="Copy Link"
              >
                <Copy className="w-5 h-5" />
              </button>
            </div>

            {/* Image */}
            <div
              className="relative max-w-[90vw] max-h-[85vh] transition-transform duration-200"
              style={{ transform: `scale(${zoomLevel})` }}
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={`/api/resources?id=${previewFile.id}`}
                alt={previewFile.name}
                width={1200}
                height={800}
                className="object-contain max-h-[85vh] rounded-lg shadow-2xl"
                unoptimized
              />
            </div>

            {/* File name */}
            <div className="absolute top-6 left-6 text-white">
              <p className="text-lg font-medium">{previewFile.name}</p>
            </div>
          </div>,
          document.body
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
