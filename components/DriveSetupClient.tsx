"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { CheckCircle2, Link2, Upload } from "lucide-react";
import Modal from "./Modal";

type DriveSetupClientProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: FormData) => void;
};

function ConnectButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <Link2 className="h-4 w-4" />
      {pending ? "Opening Google..." : "Connect Google Drive"}
    </button>
  );
}

export default function DriveSetupClient({
  isOpen,
  onClose,
  onSubmit,
}: DriveSetupClientProps) {
  const [jsonText, setJsonText] = useState("");
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [projectId, setProjectId] = useState("");
  const [jsonStatus, setJsonStatus] = useState<"idle" | "valid" | "invalid">(
    "idle"
  );

  const parseCredentials = (value: string) => {
    setJsonText(value);

    if (!value.trim()) {
      setJsonStatus("idle");
      return;
    }

    try {
      const parsed = JSON.parse(value);
      const creds = parsed.web || parsed.installed || parsed;

      if (!creds.client_id || !creds.client_secret || !creds.project_id) {
        throw new Error("Missing credentials");
      }

      setClientId(creds.client_id);
      setClientSecret(creds.client_secret);
      setProjectId(creds.project_id);
      setJsonStatus("valid");
    } catch {
      setJsonStatus("invalid");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Connect Google Drive"
      maxWidth="max-w-5xl"
    >
      <div className="space-y-5 text-white">
        <p className="max-w-2xl text-sm leading-6 text-neutral-400">
          Add your Google Cloud OAuth credentials so GDrive Database can create
          and manage files in your Drive.
        </p>

        <div className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
          <section className="rounded-xl border border-neutral-800 bg-neutral-950/70 p-5">
            <div className="mb-4 flex items-center gap-3">
              <Upload className="h-4 w-4 text-primary" />
              <h3 className="text-base font-semibold">Paste credentials JSON</h3>
            </div>
            <textarea
              value={jsonText}
              onChange={(event) => parseCredentials(event.target.value)}
              spellCheck={false}
              placeholder='{"web":{"client_id":"...","client_secret":"...","project_id":"..."}}'
              className="min-h-72 w-full resize-y rounded-xl border border-neutral-800 bg-neutral-950 p-4 font-mono text-xs leading-5 text-neutral-200 outline-none transition placeholder:text-neutral-600 focus:border-primary/70"
            />
            {jsonStatus === "valid" && (
              <div className="mt-3 flex items-center gap-2 text-sm text-emerald-300">
                <CheckCircle2 className="h-4 w-4" />
                Credentials loaded into the form.
              </div>
            )}
            {jsonStatus === "invalid" && (
              <p className="mt-3 text-sm text-amber-300">
                Paste a Google OAuth JSON file with client_id, client_secret,
                and project_id.
              </p>
            )}
          </section>

          <section className="rounded-xl border border-neutral-800 bg-neutral-950/70 p-5">
            <h3 className="mb-4 text-base font-semibold">Review and connect</h3>
            <form action={onSubmit} className="space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm text-neutral-300">
                  Client ID
                </span>
                <input
                  name="clientId"
                  value={clientId}
                  onChange={(event) => setClientId(event.target.value)}
                  required
                  className="h-11 w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 text-sm text-white outline-none transition focus:border-primary/70"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm text-neutral-300">
                  Client Secret
                </span>
                <input
                  name="clientSecret"
                  value={clientSecret}
                  onChange={(event) => setClientSecret(event.target.value)}
                  required
                  type="password"
                  className="h-11 w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 text-sm text-white outline-none transition focus:border-primary/70"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm text-neutral-300">
                  Project ID
                </span>
                <input
                  name="projectId"
                  value={projectId}
                  onChange={(event) => setProjectId(event.target.value)}
                  required
                  className="h-11 w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 text-sm text-white outline-none transition focus:border-primary/70"
                />
              </label>
              <ConnectButton />
            </form>
          </section>
        </div>
      </div>
    </Modal>
  );
}
