"use client";

import { useState, useRef } from "react";
import {
  Upload,
  FileJson,
  KeyRound,
  ExternalLink,
  ArrowRight,
  Database,
  CheckCircle2,
  AlertCircle,
  Cloud,
  Zap,
  Shield,
  Download,
} from "lucide-react";

interface LoginClientProps {
  onSubmit: (formData: FormData) => void;
}

const STEPS = [
  {
    number: 1,
    title: "Create Project",
    description: "Go to Google Cloud Console and create a new project",
    icon: Cloud,
  },
  {
    number: 2,
    title: "Enable APIs",
    description: "Enable Google Drive API and Apps Script API",
    icon: Zap,
  },
  {
    number: 3,
    title: "OAuth Consent",
    description: "Configure the consent screen with your app details",
    icon: Shield,
  },
  {
    number: 4,
    title: "Create Credentials",
    description: "Create OAuth 2.0 Client ID (Desktop app type)",
    icon: KeyRound,
  },
  {
    number: 5,
    title: "Download JSON",
    description: "Download the credentials JSON file",
    icon: Download,
  },
];

export default function LoginClient({ onSubmit }: LoginClientProps) {
  const [mode, setMode] = useState<"manual" | "json">("json");
  const [dragActive, setDragActive] = useState(false);
  const [jsonData, setJsonData] = useState<{
    clientId: string;
    clientSecret: string;
    projectId: string;
  } | null>(null);
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const parseCredentialsJson = (content: string, name: string) => {
    try {
      const json = JSON.parse(content);
      const creds = json.installed || json.web || json;

      if (!creds.client_id || !creds.client_secret || !creds.project_id) {
        throw new Error("Missing required fields");
      }

      setJsonData({
        clientId: creds.client_id,
        clientSecret: creds.client_secret,
        projectId: creds.project_id,
      });
      setFileName(name);
      setJsonError(null);
    } catch {
      setJsonError("Invalid credentials JSON format");
      setJsonData(null);
      setFileName(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file && file.type === "application/json") {
      const reader = new FileReader();
      reader.onload = (event) => {
        parseCredentialsJson(event.target?.result as string, file.name);
      };
      reader.readAsText(file);
    } else {
      setJsonError("Please upload a JSON file");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        parseCredentialsJson(event.target?.result as string, file.name);
      };
      reader.readAsText(file);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    if (mode === "json" && jsonData) {
      formData.set("clientId", jsonData.clientId);
      formData.set("clientSecret", jsonData.clientSecret);
      formData.set("projectId", jsonData.projectId);
    }

    onSubmit(formData);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-linear-to-br from-primary/10 via-transparent to-purple-600/10" />
        <div className="absolute top-1/3 -left-32 w-[500px] h-[500px] bg-primary/30 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/3 right-0 w-[400px] h-[400px] bg-purple-600/25 rounded-full blur-[120px]" />

        {/* Right Edge Blend */}
        <div className="absolute inset-y-0 right-0 w-48 bg-linear-to-l from-neutral-950 via-neutral-950/80 to-transparent z-20" />

        {/* Grid Pattern */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: "80px 80px",
          }}
        />

        <div className="relative z-10 flex flex-col justify-center p-16 xl:p-24">
          {/* Header */}
          <div className="mb-16">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3.5 rounded-2xl bg-linear-to-br from-primary/30 to-purple-600/30 border border-primary/40 shadow-lg shadow-primary/20">
                <Database className="w-9 h-9 text-primary" />
              </div>
              <h1 className="text-4xl xl:text-5xl font-bold bg-linear-to-r from-white via-white to-neutral-400 bg-clip-text text-transparent">
                GDrive DB
              </h1>
            </div>
            <p className="text-neutral-400 text-xl leading-relaxed max-w-lg">
              Transform your Google Drive into a powerful NoSQL database.
              <span className="text-neutral-500 block mt-2">
                Zero infrastructure. Infinite possibilities.
              </span>
            </p>
          </div>

          {/* Steps Guide */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xs font-semibold text-neutral-500 uppercase tracking-widest">
                How to get credentials
              </h2>
              {/* CTA Button - inline with header */}
              <a
                href="https://console.cloud.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-900/60 border border-neutral-800 hover:border-primary/50 hover:bg-primary/10 text-xs text-neutral-400 hover:text-white transition-all duration-300 group"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="font-medium">Open Console</span>
                <ArrowRight className="w-3 h-3 opacity-0 -ml-1 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300" />
              </a>
            </div>
            <div className="space-y-0">
              {STEPS.map((step, index) => (
                <div key={step.number} className="flex gap-4 group">
                  {/* Step indicator with line */}
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-xl bg-neutral-900/80 border border-neutral-800 flex items-center justify-center group-hover:border-primary/50 group-hover:bg-primary/10 transition-all duration-300 relative">
                      <step.icon className="w-4 h-4 text-neutral-400 group-hover:text-primary transition-colors" />
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-[10px] font-bold text-primary">
                        {step.number}
                      </span>
                    </div>
                    {index < STEPS.length - 1 && (
                      <div className="w-px h-6 bg-neutral-800/60 my-1" />
                    )}
                  </div>
                  {/* Step content */}
                  <div className="pt-2 pb-4">
                    <h3 className="text-white font-medium text-sm">
                      {step.title}
                    </h3>
                    <p className="text-neutral-500 text-xs mt-0.5 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 xl:w-[45%] flex items-center justify-center p-8 lg:p-16">
        <div className="w-full max-w-md">
          {/* Mobile Header */}
          <div className="lg:hidden text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="p-3 rounded-2xl bg-linear-to-br from-primary/30 to-purple-600/30 border border-primary/40">
                <Database className="w-7 h-7 text-primary" />
              </div>
              <h1 className="text-3xl font-bold">GDrive DB</h1>
            </div>
            <p className="text-neutral-400">
              Connect your Google Drive to get started
            </p>
          </div>

          {/* Login Card */}
          <div className="bg-neutral-900/40 backdrop-blur-2xl border border-neutral-800/80 rounded-3xl p-10 shadow-2xl shadow-black/60">
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-white">Get Started</h2>
              <p className="text-neutral-500 mt-2">
                Connect your Google credentials
              </p>
            </div>

            {/* Mode Toggle */}
            <div className="flex p-1.5 bg-neutral-800/40 rounded-2xl mb-8">
              <button
                type="button"
                onClick={() => setMode("json")}
                className={`flex-1 flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                  mode === "json"
                    ? "bg-linear-to-r from-primary to-purple-600 text-white shadow-lg shadow-primary/30"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                <Upload className="w-4 h-4" />
                Upload JSON
              </button>
              <button
                type="button"
                onClick={() => setMode("manual")}
                className={`flex-1 flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                  mode === "manual"
                    ? "bg-linear-to-r from-primary to-purple-600 text-white shadow-lg shadow-primary/30"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                <KeyRound className="w-4 h-4" />
                Manual
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {mode === "json" ? (
                <div className="space-y-4">
                  {/* Drag & Drop Zone */}
                  <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-300 ${
                      dragActive
                        ? "border-primary bg-primary/10 scale-[1.02]"
                        : jsonData
                        ? "border-emerald-500/50 bg-emerald-500/5"
                        : jsonError
                        ? "border-red-500/50 bg-red-500/5"
                        : "border-neutral-700/80 hover:border-neutral-600 hover:bg-neutral-800/20"
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".json,application/json"
                      onChange={handleFileChange}
                      className="hidden"
                    />

                    {jsonData ? (
                      <div className="space-y-3">
                        <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/20 flex items-center justify-center">
                          <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                        </div>
                        <p className="text-emerald-400 font-medium text-lg">
                          {fileName}
                        </p>
                        <p className="text-neutral-500 text-sm">
                          Credentials loaded • Click to change
                        </p>
                      </div>
                    ) : jsonError ? (
                      <div className="space-y-3">
                        <div className="w-14 h-14 mx-auto rounded-2xl bg-red-500/20 flex items-center justify-center">
                          <AlertCircle className="w-7 h-7 text-red-400" />
                        </div>
                        <p className="text-red-400 font-medium">{jsonError}</p>
                        <p className="text-neutral-500 text-sm">
                          Click or drop to try again
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="w-16 h-16 mx-auto rounded-2xl bg-neutral-800/80 flex items-center justify-center border border-neutral-700/50">
                          <FileJson className="w-8 h-8 text-neutral-400" />
                        </div>
                        <div>
                          <p className="text-white font-medium text-lg">
                            Drop credentials JSON
                          </p>
                          <p className="text-neutral-500 text-sm mt-1.5">
                            or click to browse files
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Hidden inputs for form submission */}
                  {jsonData && (
                    <>
                      <input
                        type="hidden"
                        name="clientId"
                        value={jsonData.clientId}
                      />
                      <input
                        type="hidden"
                        name="clientSecret"
                        value={jsonData.clientSecret}
                      />
                      <input
                        type="hidden"
                        name="projectId"
                        value={jsonData.projectId}
                      />
                    </>
                  )}
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <label
                      htmlFor="clientId"
                      className="text-sm font-medium text-neutral-300"
                    >
                      Client ID
                    </label>
                    <input
                      id="clientId"
                      name="clientId"
                      type="text"
                      required={mode === "manual"}
                      placeholder="Your Google Client ID"
                      className="w-full px-4 py-3.5 bg-neutral-800/40 border border-neutral-700/80 rounded-xl text-white placeholder:text-neutral-500 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="clientSecret"
                      className="text-sm font-medium text-neutral-300"
                    >
                      Client Secret
                    </label>
                    <input
                      id="clientSecret"
                      name="clientSecret"
                      type="password"
                      required={mode === "manual"}
                      placeholder="Your Google Client Secret"
                      className="w-full px-4 py-3.5 bg-neutral-800/40 border border-neutral-700/80 rounded-xl text-white placeholder:text-neutral-500 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="projectId"
                      className="text-sm font-medium text-neutral-300"
                    >
                      Project ID
                    </label>
                    <input
                      id="projectId"
                      name="projectId"
                      type="text"
                      required={mode === "manual"}
                      placeholder="Your Google Project ID"
                      className="w-full px-4 py-3.5 bg-neutral-800/40 border border-neutral-700/80 rounded-xl text-white placeholder:text-neutral-500 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={mode === "json" && !jsonData}
                className="w-full py-4 bg-linear-to-r from-primary to-purple-600 text-white font-semibold rounded-xl hover:opacity-90 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed shadow-xl shadow-primary/30 hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98]"
              >
                Connect Google Drive
              </button>
            </form>

            <p className="text-center text-xs text-neutral-500 mt-8 leading-relaxed">
              Your credentials are stored locally and never sent to any external
              server.
            </p>
          </div>

          {/* Mobile Instructions Link */}
          <div className="lg:hidden mt-8 text-center">
            <a
              href="https://console.cloud.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Get credentials from Google Cloud Console
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
