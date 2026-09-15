import React from 'react';

interface MetricProgressProps {
  label: string;
  value: number; // 0 to 100
  displayValue?: string;
  color?: 'purple' | 'emerald' | 'amber' | 'blue';
  hint?: string;
}

export function MetricProgress({
  label,
  value,
  displayValue,
  color = 'purple',
  hint,
}: MetricProgressProps) {
  const clamped = Math.min(100, Math.max(0, value));

  const getColorClasses = () => {
    switch (color) {
      case 'emerald':
        return 'bg-emerald-500';
      case 'amber':
        return 'bg-amber-500';
      case 'blue':
        return 'bg-blue-500';
      default:
        return 'bg-[#7C3AED]';
    }
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-[#FAFAF9]">{label}</span>
        <span className="font-semibold text-white">
          {displayValue || `${clamped.toFixed(1)}%`}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
        <div
          className={`h-full rounded-full transition-all duration-500 ${getColorClasses()}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {hint && <p className="text-[11px] text-[#737373]">{hint}</p>}
    </div>
  );
}
