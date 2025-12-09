import { getStorageUsage } from "../../actions/usage";
import { Database, HardDrive, AlertCircle, CheckCircle2 } from "lucide-react";

export default async function UsagePage() {
  const { success, data } = await getStorageUsage();

  if (!success || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-neutral-400">
        <AlertCircle className="w-10 h-10 mb-4 text-red-400" />
        <p>Failed to load usage data.</p>
      </div>
    );
  }

  // data structure assumed: { limit: number, usage: number, usageInDrive: number, usageInTrash: number }
  const total = Number(data.limit);
  const used = Number(data.usage);
  const usedInDrive = Number(data.usageInDrive);
  const usedInTrash = Number(data.usageInDriveTrash);

  const percentage = total > 0 ? (used / total) * 100 : 0;

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto py-8">
      <div>
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-linear-to-r from-white to-neutral-500">
          Storage Usage
        </h1>
        <p className="text-neutral-400 mt-2">
          Overview of your Google Drive storage consumption.
        </p>
      </div>

      {/* Main Usage Card */}
      <div className="relative overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900/50 p-8">
        <div className="absolute top-0 right-0 p-32 bg-purple-500/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-neutral-800 flex items-center justify-center border border-neutral-700">
                <HardDrive className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">
                  Total Storage
                </h3>
                <p className="text-sm text-neutral-400">
                  {formatBytes(used)} of {formatBytes(total)} used
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-3xl font-bold text-white">
                {percentage.toFixed(1)}%
              </span>
            </div>
          </div>

          <div className="relative h-4 bg-neutral-800 rounded-full overflow-hidden">
            <div
              className="absolute top-0 left-0 h-full bg-linear-to-r from-purple-500 to-blue-500 transition-all duration-1000 ease-out"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Breakdown Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-6 rounded-xl border border-neutral-800 bg-neutral-900/30 hover:bg-neutral-900/50 transition-colors">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <Database className="w-5 h-5 text-green-400" />
            </div>
            <h3 className="font-semibold text-neutral-200">App Storage</h3>
          </div>
          <p className="text-2xl font-bold text-white">
            {formatBytes(Number(data.appUsage || 0))}
          </p>
          <p className="text-sm text-neutral-500 mt-1">Used by GDriveDB</p>
        </div>

        <div className="p-6 rounded-xl border border-neutral-800 bg-neutral-900/30 hover:bg-neutral-900/50 transition-colors">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Database className="w-5 h-5 text-blue-400" />
            </div>
            <h3 className="font-semibold text-neutral-200">Drive Files</h3>
          </div>
          <p className="text-2xl font-bold text-white">
            {formatBytes(usedInDrive)}
          </p>
          <p className="text-sm text-neutral-500 mt-1">Total Active files</p>
        </div>

        <div className="p-6 rounded-xl border border-neutral-800 bg-neutral-900/30 hover:bg-neutral-900/50 transition-colors">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-400" />
            </div>
            <h3 className="font-semibold text-neutral-200">Trash</h3>
          </div>
          <p className="text-2xl font-bold text-white">
            {formatBytes(usedInTrash)}
          </p>
          <p className="text-sm text-neutral-500 mt-1">Files in trash</p>
        </div>
      </div>
    </div>
  );
}
