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
      className={`relative overflow-hidden rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 p-5 transition-all duration-300 hover:bg-white/[0.08] hover:border-white/20 group ${className}`}
    >
      {/* Gold accent line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#D4A843] to-transparent opacity-60" />

      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-slate-400 mb-1">{label}</p>
          <p className="text-3xl font-bold text-slate-50 tracking-tight">
            {prefix}
            {value}
            {suffix}
          </p>
          {trend !== undefined && (
            <div className="flex items-center gap-1.5 mt-2">
              <TrendIcon className={`h-3.5 w-3.5 ${trendColor}`} />
              <span className={`text-xs font-medium ${trendColor}`}>
                {trend > 0 ? '+' : ''}
                {trend}
                {trendLabel && <span className="text-slate-500 ml-0.5">{trendLabel}</span>}
              </span>
            </div>
          )}
        </div>
        {Icon && (
          <div className="p-2.5 rounded-lg bg-[#D4A843]/10 border border-[#D4A843]/20">
            <Icon className="h-5 w-5 text-[#D4A843]" />
          </div>
        )}
      </div>

      {/* Subtle glow effect */}
      <div className="absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-[#D4A843]/5 blur-2xl group-hover:bg-[#D4A843]/10 transition-all duration-500" />
    </div>
  );
}
