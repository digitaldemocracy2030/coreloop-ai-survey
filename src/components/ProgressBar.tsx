"use client";

interface ProgressBarProps {
  current: number;
  total: number;
  label?: string;
}

export default function ProgressBar({ current, total, label }: ProgressBarProps) {
  const percentage = Math.round((current / total) * 100);

  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-text-muted">{label}</span>
          <span className="text-xs text-text-muted">{percentage}%</span>
        </div>
      )}
      <div className="w-full h-1.5 bg-surface-dark rounded-full overflow-hidden">
        <div
          className="progress-bar h-full bg-accent rounded-full"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
