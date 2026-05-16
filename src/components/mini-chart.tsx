'use client';

import React from 'react';

// Sparkline - tiny line chart
interface SparklineProps {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
  strokeWidth?: number;
}

export function Sparkline({
  data,
  color = '#D4A843',
  width = 80,
  height = 32,
  strokeWidth = 2,
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

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={areaPoints}
        fill={`url(#grad-${color.replace('#', '')})`}
      />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Horizontal bar chart
interface HBarChartProps {
  data: { label: string; value: number; color: string }[];
  maxValue?: number;
  height?: number;
}

export function HBarChart({ data, maxValue, height = 24 }: HBarChartProps) {
  const max = maxValue || Math.max(...data.map((d) => d.value));

  return (
    <div className="space-y-2">
      {data.map((item, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="text-xs text-slate-400 w-24 text-right truncate">
            {item.label}
          </span>
          <div className="flex-1 h-5 bg-white/5 rounded-full overflow-hidden relative">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${(item.value / max) * 100}%`,
                backgroundColor: item.color,
              }}
            />
          </div>
          <span className="text-xs text-slate-300 w-12 font-mono">{item.value}</span>
        </div>
      ))}
    </div>
  );
}

// Circular progress gauge
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

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      {showValue && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold text-slate-50">{value}</span>
          {label && <span className="text-[10px] text-slate-400">{label}</span>}
        </div>
      )}
    </div>
  );
}

// Radar chart
interface RadarChartProps {
  data: {
    label: string;
    values: number[]; // one per series
  }[];
  series: { name: string; color: string }[];
  size?: number;
}

export function RadarChart({ data, series, size = 200 }: RadarChartProps) {
  const center = size / 2;
  const maxRadius = size / 2 - 30;
  const levels = 4;
  const angleStep = (2 * Math.PI) / data.length;

  const getPoint = (value: number, index: number) => {
    const angle = angleStep * index - Math.PI / 2;
    const r = (value / 100) * maxRadius;
    return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
  };

  return (
    <svg width={size} height={size} className="overflow-visible">
      {/* Grid */}
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
            stroke="rgba(255,255,255,0.08)"
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
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="1"
          />
        );
      })}

      {/* Data series */}
      {series.map((s, si) => {
        const points = data.map((d, di) => getPoint(d.values[si], di)).join(' ');
        return (
          <polygon
            key={si}
            points={points}
            fill={`${s.color}20`}
            stroke={s.color}
            strokeWidth="2"
          />
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
            className="text-[10px] fill-slate-400"
          >
            {d.label}
          </text>
        );
      })}
    </svg>
  );
}

// Line chart for QoS trends
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
  const padding = { top: 20, right: 20, bottom: 30, left: 40 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const allValues = data.flatMap((d) => d.values);
  const minVal = Math.min(...allValues) - 5;
  const maxVal = Math.max(...allValues) + 5;
  const range = maxVal - minVal || 1;

  const xStep = chartW / (data.length - 1);

  return (
    <svg width={width} height={height} className="overflow-visible">
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
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="1"
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

      {/* Lines */}
      {series.map((s, si) => {
        const points = data
          .map((d, i) => {
            const x = padding.left + i * xStep;
            const y = padding.top + chartH - ((d.values[si] - minVal) / range) * chartH;
            return `${x},${y}`;
          })
          .join(' ');

        return (
          <polyline
            key={si}
            points={points}
            fill="none"
            stroke={s.color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
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
              r="3"
              fill={s.color}
              stroke="#0A0F1E"
              strokeWidth="2"
            />
          );
        })
      )}
    </svg>
  );
}
