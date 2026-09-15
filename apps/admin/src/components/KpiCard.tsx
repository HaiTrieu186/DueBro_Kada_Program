import React from 'react';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  badge?: {
    text: string;
    variant?: 'success' | 'warning' | 'info' | 'purple' | 'neutral';
  };
  icon: React.ComponentType<{ className?: string }>;
}

export function KpiCard({
  title,
  value,
  subtitle,
  badge,
  icon: Icon,
}: KpiCardProps) {
  const getBadgeStyle = () => {
    switch (badge?.variant) {
      case 'success':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'warning':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'purple':
        return 'bg-[#7C3AED]/15 text-[#A78BFA] border-[#7C3AED]/30';
      case 'info':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      default:
        return 'bg-white/5 text-[#A8A8A8] border-white/10';
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-[#242424] p-5 shadow-sm transition hover:border-white/20">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-[#A8A8A8]">
          {title}
        </span>
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/5 text-[#A8A8A8]">
          <Icon className="h-4 w-4 text-[#FAFAF9]" />
        </div>
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl font-bold tracking-tight text-white">{value}</span>
        {badge && (
          <span
            className={`inline-flex items-center rounded-lg border px-2 py-0.5 text-[11px] font-semibold ${getBadgeStyle()}`}
          >
            {badge.text}
          </span>
        )}
      </div>

      {subtitle && <p className="mt-1 text-xs text-[#737373]">{subtitle}</p>}
    </div>
  );
}
