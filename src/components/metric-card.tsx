'use client';

import { TrendingUp, TrendingDown, Minus, type LucideIcon } from 'lucide-react';

interface MetricCardProps {
  value: string | number;
  label: string;
  trend?: number;
  trendLabel?: string;
  icon?: LucideIcon;
  prefix?: string;
  suffix?: string;
  className?: string;
  color?: string;
}

export function MetricCard({
  value,
  label,
  trend,
  trendLabel,
  icon: Icon,
  prefix = '',
  suffix = '',
  className = '',
  color,
}: MetricCardProps) {
  const trendColor =
    trend && trend > 0
      ? 'text-emerald-400'
      : trend && trend < 0
        ? 'text-red-400'
        : 'text-muted-foreground';

  const TrendIcon =
    trend && trend > 0
      ? TrendingUp
      : trend && trend < 0
        ? TrendingDown
        : Minus;

  return (
    <div
      className={`institutional-card overflow-hidden group animate-stagger-in ${className}`}
    >
      {/* Color accent line - more refined */}
      <div className="absolute top-0 left-0 right-0 h-[2px] opacity-60" style={{ background: `linear-gradient(90deg, transparent, ${color || 'var(--primary)'}, transparent)` }} />

      {/* Animated background glow on hover */}
      <div className="absolute -bottom-16 -right-16 h-40 w-40 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-700 blur-3xl" style={{ backgroundColor: `${color || 'var(--primary)'}10` }} />

      <div className="flex items-start justify-between relative z-10">
        <div className="flex-1">
          <p className="text-[11px] text-muted-foreground mb-2 uppercase tracking-[0.1em] font-semibold">{label}</p>
          <p className="text-[2rem] font-bold text-foreground tracking-tight leading-none animate-count-up">
            {prefix}
            {value}
            {suffix}
          </p>
          {trend !== undefined && (
            <div className="flex items-center gap-2 mt-3">
              <div className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold ${trend > 0 ? 'bg-emerald-500/[0.08]' : trend < 0 ? 'bg-red-500/[0.08]' : 'bg-muted'}`}>
                <TrendIcon className={`h-3 w-3 ${trendColor}`} />
                <span className={trendColor}>
                  {trend > 0 ? '+' : ''}{trend}
                </span>
              </div>
              {trendLabel && <span className="text-[10px] text-muted-foreground font-medium">{trendLabel}</span>}
            </div>
          )}
        </div>
        {Icon && (
          <div className="p-3 rounded-xl border transition-all duration-400 group-hover:scale-105 group-hover:shadow-lg" style={{ backgroundColor: `${color || 'var(--primary)'}10`, borderColor: `${color || 'var(--primary)'}25` }}>
            <Icon className="h-5 w-5 transition-colors duration-300" style={{ color: color || 'var(--primary)' }} />
          </div>
        )}
      </div>

      {/* Subtle decorative element */}
      <div className="absolute top-4 right-4 h-24 w-24 rounded-full opacity-[0.015] transition-opacity duration-700 group-hover:opacity-[0.04]" style={{ backgroundColor: color || 'var(--primary)' }} />
    </div>
  );
}
