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
  color = '#D4A843',
}: MetricCardProps) {
  const trendColor =
    trend && trend > 0
      ? 'text-emerald-400'
      : trend && trend < 0
        ? 'text-red-400'
        : 'text-slate-400';

  const TrendIcon =
    trend && trend > 0
      ? TrendingUp
      : trend && trend < 0
        ? TrendingDown
        : Minus;

  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 p-5 transition-all duration-300 hover:bg-white/[0.08] hover:border-white/20 hover:shadow-lg hover:shadow-black/20 group animate-stagger-in ${className}`}
    >
      {/* Color accent line - uses the color prop */}
      <div className="absolute top-0 left-0 right-0 h-[2px] opacity-70" style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />

      {/* Animated background glow on hover */}
      <div className="absolute -bottom-12 -right-12 h-32 w-32 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 blur-3xl" style={{ backgroundColor: `${color}15` }} />

      <div className="flex items-start justify-between relative z-10">
        <div className="flex-1">
          <p className="text-xs text-slate-400 mb-1.5 uppercase tracking-wider font-medium">{label}</p>
          <p className="text-3xl font-bold text-slate-50 tracking-tight animate-count-up">
            {prefix}
            {value}
            {suffix}
          </p>
          {trend !== undefined && (
            <div className="flex items-center gap-1.5 mt-2">
              <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs font-medium ${trend > 0 ? 'bg-emerald-500/10' : trend < 0 ? 'bg-red-500/10' : 'bg-white/5'}`}>
                <TrendIcon className={`h-3 w-3 ${trendColor}`} />
                <span className={trendColor}>
                  {trend > 0 ? '+' : ''}{trend}
                </span>
              </div>
              {trendLabel && <span className="text-[10px] text-slate-500">{trendLabel}</span>}
            </div>
          )}
        </div>
        {Icon && (
          <div className="p-2.5 rounded-xl border transition-all duration-300 group-hover:scale-110 group-hover:shadow-md" style={{ backgroundColor: `${color}15`, borderColor: `${color}30` }}>
            <Icon className="h-5 w-5 transition-colors" style={{ color }} />
          </div>
        )}
      </div>

      {/* Subtle decorative element */}
      <div className="absolute top-3 right-3 h-20 w-20 rounded-full opacity-[0.02] transition-opacity group-hover:opacity-[0.05]" style={{ backgroundColor: color }} />
    </div>
  );
}
