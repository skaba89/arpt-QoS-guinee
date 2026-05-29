'use client';

import React from 'react';

// Sparkline - tiny line chart with animated draw
interface SparklineProps {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
  strokeWidth?: number;
  animate?: boolean;
}

export function Sparkline({
  data,
  color = '#D4A843',
  width = 80,
  height = 32,
  strokeWidth = 2,
  animate = true,
}: SparklineProps) {
  if (!data.length) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const padding = 2;

  const points = data
    .map((v, i) => {
      const x = padding + (i / (data.length - 1)) * (width - padding * 2);
      const y = height - padding - ((v - min) / range) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(' ');

  const areaPoints = `${padding},${height - padding} ${points} ${width - padding},${height - padding}`;
  const gradId = `spark-${color.replace('#', '')}-${Math.random().toString(36).slice(2, 6)}`;

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={`url(#${gradId})`} />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={animate ? {
          strokeDasharray: 300,
          strokeDashoffset: 300,
          animation: 'drawLine 1.5s ease-out forwards',
        } : undefined}
      />
      {/* End dot */}
      {data.length > 0 && (
        <circle
          cx={padding + ((data.length - 1) / (data.length - 1)) * (width - padding * 2)}
          cy={height - padding - ((data[data.length - 1] - min) / range) * (height - padding * 2)}
          r="2.5"
          fill={color}
          className="animate-pulse"
        />
      )}
      <style>{`@keyframes drawLine { to { stroke-dashoffset: 0; } }`}</style>
    </svg>
  );
}

// Horizontal bar chart with animated bars
interface HBarChartProps {
  data: { label: string; value: number; color: string }[];
  maxValue?: number;
  height?: number;
  showValue?: boolean;
}

export function HBarChart({ data, maxValue, height = 24, showValue = true }: HBarChartProps) {
  const max = maxValue || Math.max(...data.map((d) => d.value)) || 1;

  return (
    <div className="space-y-2.5">
      {data.map((item, i) => (
        <div key={i} className="flex items-center gap-3 group">
          <span className="text-[11px] text-slate-400 w-24 text-right truncate transition-colors group-hover:text-slate-300">
            {item.label}
          </span>
          <div className="flex-1 h-5 bg-white/[0.04] rounded-full overflow-hidden relative">
            <div
              className="h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
              style={{
                width: `${(item.value / max) * 100}%`,
                backgroundColor: item.color,
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
            </div>
          </div>
          {showValue && <span className="text-xs text-slate-300 w-12 font-mono font-medium">{item.value}</span>}
        </div>
      ))}
    </div>
  );
}

// Circular progress gauge with animated fill
interface CircularGaugeProps {
  value: number;
  maxValue?: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
  showValue?: boolean;
}

export function CircularGauge({
  value,
  maxValue = 100,
  size = 80,
  strokeWidth = 6,
  color = '#D4A843',
  label,
  showValue = true,
}: CircularGaugeProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (value / maxValue) * circumference;
  const offset = circumference - progress;

  // Determine quality level for color override
  const percentage = (value / maxValue) * 100;
  const qualityColor = percentage >= 80 ? '#10B981' : percentage >= 60 ? '#D4A843' : percentage >= 40 ? '#F59E0B' : '#EF4444';
  const displayColor = color === '#D4A843' ? qualityColor : color;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={displayColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
          style={{ filter: `drop-shadow(0 0 6px ${displayColor}40)` }}
        />
      </svg>
      {showValue && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold text-slate-50 animate-count-up">{value}</span>
          {label && <span className="text-[10px] text-slate-400">{label}</span>}
        </div>
      )}
    </div>
  );
}

// Radar chart with better styling
interface RadarChartProps {
  data: {
    label: string;
    values: number[];
  }[];
  series: { name: string; color: string }[];
  size?: number;
}

export function RadarChart({ data, series, size = 200 }: RadarChartProps) {
  if (data.length < 3) return null;
  const center = size / 2;
  const maxRadius = size / 2 - 30;
  const levels = 4;
  const angleStep = (2 * Math.PI) / data.length;

  const getPoint = (value: number, index: number) => {
    const angle = angleStep * index - Math.PI / 2;
    const r = (Math.min(Math.max(value, 0), 100) / 100) * maxRadius;
    return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
  };

  return (
    <svg width={size} height={size} className="overflow-visible">
      {/* Grid levels */}
      {Array.from({ length: levels }).map((_, l) => {
        const r = ((l + 1) / levels) * maxRadius;
        const points = Array.from({ length: data.length })
          .map((_, i) => {
            const angle = angleStep * i - Math.PI / 2;
            return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
          })
          .join(' ');
        return (
          <polygon
            key={l}
            points={points}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="1"
          />
        );
      })}

      {/* Axis lines */}
      {data.map((_, i) => {
        const angle = angleStep * i - Math.PI / 2;
        const x = center + maxRadius * Math.cos(angle);
        const y = center + maxRadius * Math.sin(angle);
        return (
          <line
            key={i}
            x1={center}
            y1={center}
            x2={x}
            y2={y}
            stroke="rgba(255,255,255,0.04)"
            strokeWidth="1"
          />
        );
      })}

      {/* Data series with animation */}
      {series.map((s, si) => {
        const points = data.map((d, di) => getPoint(d.values[si], di)).join(' ');
        return (
          <g key={si}>
            <polygon
              points={points}
              fill={`${s.color}15`}
              stroke={s.color}
              strokeWidth="2"
              style={{
                animation: 'stagger-in 0.6s cubic-bezier(0.22, 1, 0.36, 1) both',
                animationDelay: `${si * 150}ms`,
              }}
            />
            {/* Data points on vertices */}
            {data.map((d, di) => {
              const angle = angleStep * di - Math.PI / 2;
              const r = (Math.min(Math.max(d.values[si], 0), 100) / 100) * maxRadius;
              const px = center + r * Math.cos(angle);
              const py = center + r * Math.sin(angle);
              return (
                <circle key={di} cx={px} cy={py} r="3" fill={s.color} stroke="#0A0F1E" strokeWidth="2" />
              );
            })}
          </g>
        );
      })}

      {/* Labels */}
      {data.map((d, i) => {
        const angle = angleStep * i - Math.PI / 2;
        const labelR = maxRadius + 20;
        const x = center + labelR * Math.cos(angle);
        const y = center + labelR * Math.sin(angle);
        return (
          <text
            key={i}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-[10px] fill-slate-400 font-medium"
          >
            {d.label}
          </text>
        );
      })}
    </svg>
  );
}

// Line chart with responsive container
interface LineChartProps {
  data: { label: string; values: number[] }[];
  series: { name: string; color: string }[];
  width?: number;
  height?: number;
}

export function LineChart({
  data,
  series,
  width = 400,
  height = 200,
}: LineChartProps) {
  if (!data.length) return null;
  const padding = { top: 20, right: 20, bottom: 30, left: 40 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const allValues = data.flatMap((d) => d.values);
  const minVal = Math.min(...allValues) - 5;
  const maxVal = Math.max(...allValues) + 5;
  const range = maxVal - minVal || 1;

  const xStep = data.length > 1 ? chartW / (data.length - 1) : 0;

  return (
    <div className="chart-responsive">
      <svg viewBox={`0 0 ${width} ${height}`} className="overflow-visible w-full" preserveAspectRatio="xMidYMid meet">
        {/* Grid lines */}
        {Array.from({ length: 5 }).map((_, i) => {
          const y = padding.top + (i / 4) * chartH;
          const val = Math.round(maxVal - (i / 4) * range);
          return (
            <React.Fragment key={i}>
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="rgba(255,255,255,0.05)"
                strokeWidth="1"
                strokeDasharray={i > 0 ? "4,4" : "none"}
              />
              <text
                x={padding.left - 8}
                y={y}
                textAnchor="end"
                dominantBaseline="middle"
                className="text-[10px] fill-slate-500"
              >
                {val}
              </text>
            </React.Fragment>
          );
        })}

        {/* X labels */}
        {data.map((d, i) => (
          <text
            key={i}
            x={padding.left + i * xStep}
            y={height - 8}
            textAnchor="middle"
            className="text-[10px] fill-slate-500"
          >
            {d.label}
          </text>
        ))}

        {/* Lines with gradient fill */}
        {series.map((s, si) => {
          const linePoints = data.map((d, i) => {
            const x = padding.left + i * xStep;
            const y = padding.top + chartH - ((d.values[si] - minVal) / range) * chartH;
            return { x, y };
          });

          const pointsStr = linePoints.map((p) => `${p.x},${p.y}`).join(' ');
          const areaStr = `${padding.left},${padding.top + chartH} ${pointsStr} ${padding.left + (data.length - 1) * xStep},${padding.top + chartH}`;

          return (
            <g key={si}>
              <defs>
                <linearGradient id={`line-grad-${si}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={s.color} stopOpacity="0.15" />
                  <stop offset="100%" stopColor={s.color} stopOpacity="0" />
                </linearGradient>
              </defs>
              <polygon points={areaStr} fill={`url(#line-grad-${si})`} />
              <polyline
                points={pointsStr}
                fill="none"
                stroke={s.color}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ filter: `drop-shadow(0 0 4px ${s.color}40)` }}
              />
            </g>
          );
        })}

        {/* Data points */}
        {series.map((s, si) =>
          data.map((d, i) => {
            const x = padding.left + i * xStep;
            const y = padding.top + chartH - ((d.values[si] - minVal) / range) * chartH;
            return (
              <circle
                key={`${si}-${i}`}
                cx={x}
                cy={y}
                r="3.5"
                fill={s.color}
                stroke="#0A0F1E"
                strokeWidth="2"
                className="transition-all hover:r-5"
              />
            );
          })
        )}
      </svg>
    </div>
  );
}
