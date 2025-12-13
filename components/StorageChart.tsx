"use client";

interface StorageChartProps {
  segments: {
    label: string;
    value: number;
    color: string;
  }[];
  total: number;
  used: number;
}

// Utility function for formatting bytes
function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export default function StorageChart({
  segments,
  total,
  used,
}: StorageChartProps) {
  const size = 200;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  // Calculate stroke offsets for each segment
  let accumulatedOffset = 0;
  const segmentData = segments.map((seg) => {
    const percentage = total > 0 ? (seg.value / total) * 100 : 0;
    const strokeDasharray = (percentage / 100) * circumference;
    const strokeDashoffset = -accumulatedOffset;
    accumulatedOffset += strokeDasharray;
    return {
      ...seg,
      percentage,
      strokeDasharray,
      strokeDashoffset,
    };
  });

  const usedPercentage = total > 0 ? (used / total) * 100 : 0;
  const freeSpace = total - used;

  return (
    <div className="flex flex-col lg:flex-row items-center gap-8 p-8">
      {/* Pie Chart */}
      <div className="relative">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="rgb(38, 38, 38)"
            strokeWidth={strokeWidth}
          />

          {/* Segments */}
          {segmentData.map((seg, i) => (
            <circle
              key={seg.label}
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${seg.strokeDasharray} ${circumference}`}
              strokeDashoffset={seg.strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
              style={{
                animationDelay: `${i * 200}ms`,
              }}
            />
          ))}
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-white">
            {usedPercentage.toFixed(0)}%
          </span>
          <span className="text-sm text-neutral-400">used</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex-1 space-y-4">
        <div className="space-y-3">
          {segmentData.map((seg) => (
            <div
              key={seg.label}
              className="flex items-center justify-between gap-4 p-3 rounded-lg bg-neutral-800/50 hover:bg-neutral-800 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: seg.color }}
                />
                <span className="text-neutral-200 font-medium">
                  {seg.label}
                </span>
              </div>
              <div className="text-right">
                <span className="text-white font-semibold">
                  {formatBytes(seg.value)}
                </span>
                <span className="text-neutral-500 text-sm ml-2">
                  ({seg.percentage.toFixed(1)}%)
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Free space indicator */}
        <div className="pt-4 border-t border-neutral-700">
          <div className="flex items-center justify-between">
            <span className="text-neutral-400">Free Space</span>
            <span className="text-green-400 font-semibold">
              {formatBytes(freeSpace)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
