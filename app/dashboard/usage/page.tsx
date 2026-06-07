import { getStorageUsage } from "../../actions/usage";
import {
  Database,
  HardDrive,
  AlertCircle,
  Trash2,
  FolderOpen,
  Cloud,
} from "lucide-react";
import StorageChart from "../../../components/StorageChart";

type DatabaseUsageItem = {
  id: string;
  name: string;
  size: number;
  tableCount: number;
};

export default async function UsagePage() {
  const { success, data } = await getStorageUsage();

  if (!success || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-slate-500 dark:text-neutral-400">
        <AlertCircle className="w-10 h-10 mb-4 text-red-400" />
        <p>Failed to load usage data.</p>
      </div>
    );
  }

  const toBytes = (value: unknown) => {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : 0;
  };

  const total = toBytes(data.limit);
  const used = toBytes(data.usage);
  const usedInDrive = toBytes(data.usageInDrive);
  const usedInTrash = toBytes(data.usageInDriveTrash);
  const appUsage = toBytes(data.appUsage);
  const bucketUsage = toBytes(data.bucketUsage);
  const otherUsage = Math.max(0, used - appUsage - usedInTrash);
  const databaseUsage = ((data.databaseUsage || []) as DatabaseUsageItem[]).map(
    (db) => ({
      ...db,
      size: toBytes(db.size),
      tableCount: Number.isFinite(Number(db.tableCount))
        ? Number(db.tableCount)
        : 0,
    })
  );

  const percentage = total > 0 ? (used / total) * 100 : 0;
  const percentageOfTotal = (value: number) =>
    total > 0 ? Math.min((value / total) * 100, 100) : 0;
  const bucketAppPercentage =
    appUsage > 0 ? Math.min((bucketUsage / appUsage) * 100, 100) : 0;

  const formatBytes = (bytes: number) => {
    if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.min(
      sizes.length - 1,
      Math.floor(Math.log(bytes) / Math.log(k))
    );
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Chart segments
  const segments = [
    { label: "GDriveDB App", value: appUsage, color: "#eb0081" },
    { label: "Other Drive Files", value: otherUsage, color: "#3b82f6" },
    { label: "Trash", value: usedInTrash, color: "#ef4444" },
  ].filter((s) => s.value > 0);

  // Status color based on usage percentage
  const getStatusColor = () => {
    if (percentage >= 90) return "text-red-400";
    if (percentage >= 70) return "text-yellow-400";
    return "text-green-400";
  };

  const getStatusText = () => {
    if (percentage >= 90) return "Critical";
    if (percentage >= 70) return "Warning";
    return "Healthy";
  };

  return (
    <div className="space-y-8 max-w-full mx-auto py-8 px-4">
      {/* Header Section */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 dark:border-neutral-800 dark:bg-neutral-950 dark:shadow-none">
        {/* Glow effect */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none dark:hidden" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl pointer-events-none dark:hidden" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-primary/25 bg-primary shadow-sm shadow-primary/10 dark:bg-neutral-950 dark:shadow-none">
              <HardDrive className="w-6 h-6 text-white dark:text-primary" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-950 dark:text-white">
                Storage Usage
              </h1>
              <p className="text-slate-500 text-sm mt-1 dark:text-neutral-400">
                Google Drive storage breakdown and analysis
              </p>
            </div>
          </div>

          <div
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border ${
              percentage >= 90
                ? "bg-red-500/10 border-red-500/30"
                : percentage >= 70
                ? "bg-amber-500/10 border-amber-500/30"
                : "bg-emerald-500/10 border-emerald-500/30"
            }`}
          >
            <div
              className={`w-2.5 h-2.5 rounded-full ${
                percentage >= 90
                  ? "bg-red-400"
                  : percentage >= 70
                  ? "bg-amber-400"
                  : "bg-emerald-400"
              } animate-pulse`}
            />
            <span className={`text-sm font-medium ${getStatusColor()}`}>
              {getStatusText()}
            </span>
            <span className="text-slate-400 text-sm dark:text-neutral-500">•</span>
            <span className="text-slate-500 text-sm font-medium dark:text-neutral-400">
              {percentage.toFixed(1)}% used
            </span>
          </div>
        </div>
      </div>

      {/* Main Chart Card */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-900/5 dark:border-neutral-800 dark:bg-neutral-950 dark:shadow-none">
        {/* Glow effects */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px] rounded-full pointer-events-none dark:hidden" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 blur-[80px] rounded-full pointer-events-none dark:hidden" />

        <div className="relative z-10">
          <div className="p-6 border-b border-slate-200 dark:border-neutral-800">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/25 bg-primary/10 dark:bg-neutral-950">
                <Cloud className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold text-slate-950 dark:text-white">Storage Overview</h2>
                <p className="text-sm text-slate-500 dark:text-neutral-400">
                  {formatBytes(used)} of {formatBytes(total)} used
                </p>
              </div>
            </div>
          </div>

          <StorageChart segments={segments} total={total} used={used} />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Storage */}
        <div className="group relative overflow-hidden p-6 rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-900/5 hover:border-primary/30 transition-all duration-500 dark:border-neutral-800 dark:bg-neutral-950 dark:shadow-none">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 blur-2xl rounded-full pointer-events-none group-hover:bg-primary/20 transition-colors dark:hidden" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 group-hover:border-primary/40 transition-colors dark:bg-neutral-950">
                <HardDrive className="w-6 h-6 text-primary" />
              </div>
              <div className="w-10 h-10 relative">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="20"
                    cy="20"
                    r="16"
                    fill="none"
                    stroke="rgb(64,64,64)"
                    strokeWidth="3"
                  />
                  <circle
                    cx="20"
                    cy="20"
                    r="16"
                    fill="none"
                    stroke="var(--primary)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={`${100.5} 100.5`}
                    className="transition-all duration-1000"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-primary">
                  MAX
                </span>
              </div>
            </div>
            <h3 className="text-sm font-medium text-slate-500 mb-1 dark:text-neutral-400">
              Total Quota
            </h3>
            <p className="text-2xl font-bold text-slate-950 dark:text-white">
              {formatBytes(total)}
            </p>
            <p className="text-xs text-primary/70 mt-2">Google Drive limit</p>
          </div>
        </div>

        {/* GDriveDB Usage */}
        <div className="group relative overflow-hidden p-6 rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-900/5 hover:border-pink-500/30 transition-all duration-500 dark:border-neutral-800 dark:bg-neutral-950 dark:shadow-none">
          <div className="absolute top-0 right-0 w-24 h-24 bg-pink-500/10 blur-2xl rounded-full pointer-events-none group-hover:bg-pink-500/20 transition-colors dark:hidden" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-pink-500/10 flex items-center justify-center border border-pink-500/20 group-hover:border-pink-500/40 transition-colors dark:bg-neutral-950">
                <Database className="w-6 h-6 text-pink-400" />
              </div>
              <div className="w-10 h-10 relative">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="20"
                    cy="20"
                    r="16"
                    fill="none"
                    stroke="rgb(64,64,64)"
                    strokeWidth="3"
                  />
                  <circle
                    cx="20"
                    cy="20"
                    r="16"
                    fill="none"
                    stroke="rgb(236,72,153)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={`${percentageOfTotal(appUsage) * 1.005} 100.5`}
                    className="transition-all duration-1000"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-pink-400">
                  {percentageOfTotal(appUsage).toFixed(0)}%
                </span>
              </div>
            </div>
            <h3 className="text-sm font-medium text-slate-500 mb-1 dark:text-neutral-400">
              GDriveDB
            </h3>
            <p className="text-2xl font-bold text-slate-950 dark:text-white">
              {formatBytes(appUsage)}
            </p>
            <p className="text-xs text-pink-400/70 mt-2">
              {percentageOfTotal(appUsage).toFixed(2)}% of quota
            </p>
          </div>
        </div>

        {/* Active Files */}
        <div className="group relative overflow-hidden p-6 rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-900/5 hover:border-blue-500/30 transition-all duration-500 dark:border-neutral-800 dark:bg-neutral-950 dark:shadow-none">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 blur-2xl rounded-full pointer-events-none group-hover:bg-blue-500/20 transition-colors dark:hidden" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 group-hover:border-blue-500/40 transition-colors dark:bg-neutral-950">
                <FolderOpen className="w-6 h-6 text-blue-400" />
              </div>
              <div className="w-10 h-10 relative">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="20"
                    cy="20"
                    r="16"
                    fill="none"
                    stroke="rgb(64,64,64)"
                    strokeWidth="3"
                  />
                  <circle
                    cx="20"
                    cy="20"
                    r="16"
                    fill="none"
                    stroke="rgb(59,130,246)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={`${percentageOfTotal(usedInDrive) * 1.005} 100.5`}
                    className="transition-all duration-1000"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-blue-400">
                  {percentageOfTotal(usedInDrive).toFixed(0)}%
                </span>
              </div>
            </div>
            <h3 className="text-sm font-medium text-slate-500 mb-1 dark:text-neutral-400">
              Drive Files
            </h3>
            <p className="text-2xl font-bold text-slate-950 dark:text-white">
              {formatBytes(usedInDrive)}
            </p>
            <p className="text-xs text-blue-400/70 mt-2">All active files</p>
          </div>
        </div>

        {/* Trash */}
        <div className="group relative overflow-hidden p-6 rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-900/5 hover:border-red-500/30 transition-all duration-500 dark:border-neutral-800 dark:bg-neutral-950 dark:shadow-none">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/10 blur-2xl rounded-full pointer-events-none group-hover:bg-red-500/20 transition-colors dark:hidden" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/20 group-hover:border-red-500/40 transition-colors dark:bg-neutral-950">
                <Trash2 className="w-6 h-6 text-red-400" />
              </div>
              <div className="w-10 h-10 relative">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="20"
                    cy="20"
                    r="16"
                    fill="none"
                    stroke="rgb(64,64,64)"
                    strokeWidth="3"
                  />
                  <circle
                    cx="20"
                    cy="20"
                    r="16"
                    fill="none"
                    stroke="rgb(239,68,68)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={`${percentageOfTotal(usedInTrash) * 1.005} 100.5`}
                    className="transition-all duration-1000"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-red-400">
                  {percentageOfTotal(usedInTrash).toFixed(0)}%
                </span>
              </div>
            </div>
            <h3 className="text-sm font-medium text-slate-500 mb-1 dark:text-neutral-400">Trash</h3>
            <p className="text-2xl font-bold text-slate-950 dark:text-white">
              {formatBytes(usedInTrash)}
            </p>
            <p className="text-xs text-red-400/70 mt-2">
              {usedInTrash > 0 ? "Empty to free space" : "Trash is empty"}
            </p>
          </div>
        </div>
      </div>

      {/* App Usage Breakdown */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-900/5 dark:border-neutral-800 dark:bg-neutral-950 dark:shadow-none">
        {/* Glow effects */}
        <div className="absolute bottom-0 right-0 w-48 h-48 bg-primary/10 blur-[80px] rounded-full pointer-events-none dark:hidden" />

        <div className="relative z-10 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/25 bg-primary/10 dark:bg-neutral-950">
              <Database className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-950 dark:text-white">
                GDriveDB Usage Breakdown
              </h3>
              <p className="text-sm text-slate-500 dark:text-neutral-400">
                {formatBytes(appUsage)} across {(data.databaseCount || 0) + 1}{" "}
                items
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Bucket Section - Primary theme to match */}
            <div className="group p-4 rounded-xl bg-linear-to-r from-primary/10 to-transparent border border-primary/20 hover:border-primary/40 transition-all duration-300 dark:bg-none dark:bg-neutral-900">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/30 dark:bg-neutral-950">
                    <FolderOpen className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-950 group-hover:text-primary transition-colors dark:text-white">
                      Storage Bucket
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-neutral-500">
                      {data.bucketFileCount || 0} files uploaded
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xl font-bold text-slate-950 dark:text-white">
                    {formatBytes(bucketUsage)}
                  </span>
                  <p className="text-xs text-primary">
                    {bucketAppPercentage.toFixed(1)}
                    % of app
                  </p>
                </div>
              </div>
              <div className="h-2 bg-slate-200 rounded-full overflow-hidden dark:bg-neutral-800">
                <div
                  className="h-full bg-linear-to-r from-primary to-primary/70 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${bucketAppPercentage}%` }}
                />
              </div>
            </div>

            {/* Databases Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-sm font-medium text-slate-600 dark:text-neutral-300">
                    Databases
                  </span>
                </div>
                <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full dark:text-neutral-500 dark:bg-neutral-800">
                  {data.databaseCount || 0} total
                </span>
              </div>

              {databaseUsage.length > 0 ? (
                <div className="grid gap-2">
                  {[...databaseUsage]
                    .sort((a, b) => b.size - a.size)
                    .map((db, index) => {
                      const dbPercentage =
                        appUsage > 0
                          ? Math.min((db.size / appUsage) * 100, 100)
                          : 0;
                      const colors = [
                        "from-primary to-primary/70",
                        "from-pink-500 to-pink-400",
                        "from-cyan-500 to-cyan-400",
                        "from-amber-500 to-amber-400",
                        "from-emerald-500 to-emerald-400",
                      ];
                      const colorClass = colors[index % colors.length];

                      return (
                        <div
                          key={db.id}
                          className="group flex items-center gap-4 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 transition-all duration-300 dark:bg-neutral-800/30 dark:hover:bg-neutral-800/60 dark:border-neutral-700/30 dark:hover:border-neutral-600/50"
                        >
                          <div
                            className={`w-1.5 h-8 rounded-full bg-linear-to-b ${colorClass}`}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-slate-700 truncate group-hover:text-slate-950 transition-colors dark:text-neutral-200 dark:group-hover:text-white">
                                {db.name}
                              </span>
                              <span className="text-xs text-slate-500 px-1.5 py-0.5 bg-white rounded shrink-0 dark:text-neutral-500 dark:bg-neutral-800">
                                {db.tableCount} table
                                {db.tableCount !== 1 ? "s" : ""}
                              </span>
                            </div>
                            <div className="h-1 bg-slate-200 rounded-full overflow-hidden dark:bg-neutral-700">
                              <div
                                className={`h-full bg-linear-to-r ${colorClass} rounded-full transition-all duration-1000 ease-out`}
                                style={{
                                  width: `${Math.max(dbPercentage, 2)}%`,
                                }}
                              />
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-slate-950 font-semibold dark:text-white">
                              {formatBytes(db.size)}
                            </span>
                            <p className="text-xs text-slate-500 dark:text-neutral-500">
                              {dbPercentage.toFixed(1)}%
                            </p>
                          </div>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <div className="text-center py-8 rounded-xl bg-slate-50 border border-dashed border-slate-200 dark:bg-neutral-800/20 dark:border-neutral-700">
                  <Database className="w-10 h-10 mx-auto mb-3 text-slate-400 dark:text-neutral-600" />
                  <p className="text-slate-500 dark:text-neutral-500">No databases yet</p>
                  <p className="text-xs text-slate-400 mt-1 dark:text-neutral-600">
                    Create a database to see usage
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tips Section */}
      {percentage > 70 && (
        <div
          className={`rounded-xl border p-4 ${
            percentage >= 90
              ? "border-red-500/30 bg-red-500/10"
              : "border-yellow-500/30 bg-yellow-500/10"
          }`}
        >
          <div className="flex items-start gap-3">
            <AlertCircle
              className={`w-5 h-5 mt-0.5 ${
                percentage >= 90 ? "text-red-400" : "text-yellow-400"
              }`}
            />
            <div>
              <h4
                className={`font-medium ${
                  percentage >= 90 ? "text-red-200" : "text-yellow-200"
                }`}
              >
                {percentage >= 90
                  ? "Storage Almost Full!"
                  : "Storage Getting Low"}
              </h4>
              <p className="text-sm text-slate-600 mt-1 dark:text-neutral-400">
                {usedInTrash > 0
                  ? `You have ${formatBytes(
                      usedInTrash
                    )} in trash. Consider emptying it to free up space.`
                  : "Consider removing unused files or upgrading your Google Drive storage."}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
