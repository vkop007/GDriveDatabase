"use client";

interface UsageBarProps {
  label: string;
  value: number;
  maxValue: number;
  color: string;
  formatBytes: (bytes: number) => string;
}

export default function UsageBar({
  label,
  value,
  maxValue,
  color,
  formatBytes,
}: UsageBarProps) {
  const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-neutral-300 font-medium">{label}</span>
        <span className="text-white font-semibold">{formatBytes(value)}</span>
      </div>
      <div className="relative h-2 bg-neutral-800 rounded-full overflow-hidden">
        <div
          className="absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-out"
          style={{
            width: `${Math.min(percentage, 100)}%`,
            background: `linear-gradient(90deg, ${color}, ${color}88)`,
          }}
        />
      </div>
      <div className="text-xs text-neutral-500 text-right">
        {percentage.toFixed(1)}% of total
      </div>
    </div>
  );
}
