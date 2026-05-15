'use client';

import React, { useState } from 'react';
import { regions } from '@/lib/mock-data';

interface GuineaMapProps {
  onRegionClick?: (region: string) => void;
  selectedRegion?: string | null;
  metric?: 'coverage' | 'qos';
}

// Simplified SVG paths for Guinea's 8 administrative regions
const regionPaths: { name: string; path: string }[] = [
  {
    name: 'Conakry',
    path: 'M 95 155 L 105 148 L 112 155 L 108 165 L 97 162 Z',
  },
  {
    name: 'Kindia',
    path: 'M 85 130 L 110 120 L 120 140 L 115 155 L 95 155 L 80 145 Z',
  },
  {
    name: 'Boké',
    path: 'M 40 60 L 90 55 L 95 80 L 100 105 L 85 120 L 60 115 L 35 95 L 30 75 Z',
  },
  {
    name: 'Labé',
    path: 'M 100 55 L 140 50 L 155 65 L 150 90 L 130 100 L 110 105 L 95 80 Z',
  },
  {
    name: 'Mamou',
    path: 'M 110 105 L 130 100 L 145 110 L 150 130 L 130 140 L 120 140 L 110 120 Z',
  },
  {
    name: 'Faranah',
    path: 'M 130 100 L 170 85 L 200 90 L 210 110 L 195 130 L 170 135 L 150 130 L 145 110 Z',
  },
  {
    name: 'Kankan',
    path: 'M 155 50 L 200 40 L 230 55 L 235 80 L 220 100 L 200 110 L 170 105 L 155 85 L 155 65 Z',
  },
  {
    name: "N'Zérékoré",
    path: 'M 170 135 L 200 120 L 235 115 L 250 135 L 245 160 L 225 175 L 195 178 L 170 165 L 160 150 Z',
  },
];

function getColorForValue(value: number, metric: 'coverage' | 'qos' = 'coverage'): string {
  if (metric === 'coverage') {
    if (value >= 80) return '#10B981';
    if (value >= 65) return '#3B82F6';
    if (value >= 50) return '#F59E0B';
    return '#EF4444';
  }
  if (value >= 80) return '#10B981';
  if (value >= 65) return '#3B82F6';
  if (value >= 50) return '#F59E0B';
  return '#EF4444';
}

export function GuineaMap({ onRegionClick, selectedRegion, metric = 'coverage' }: GuineaMapProps) {
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);

  const getRegionData = (name: string) => regions.find((r) => r.name === name);

  return (
    <div className="relative">
      <svg viewBox="20 30 250 165" className="w-full h-auto" style={{ maxHeight: '400px' }}>
        {/* Background grid */}
        <defs>
          <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
          </pattern>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <rect x="0" y="0" width="300" height="220" fill="url(#grid)" />

        {/* Country outline shadow */}
        <g opacity="0.15" transform="translate(2,2)">
          {regionPaths.map((r) => (
            <path key={r.name} d={r.path} fill="#000" stroke="none" />
          ))}
        </g>

        {/* Regions */}
        {regionPaths.map((region) => {
          const data = getRegionData(region.name);
          const metricValue = data ? (metric === 'coverage' ? data.coverage : data.qos) : 50;
          const fillColor = getColorForValue(metricValue, metric);
          const isHovered = hoveredRegion === region.name;
          const isSelected = selectedRegion === region.name;

          return (
            <g key={region.name}>
              <path
                d={region.path}
                fill={fillColor}
                fillOpacity={isHovered ? 0.7 : isSelected ? 0.65 : 0.4}
                stroke={isSelected ? '#D4A843' : isHovered ? '#F1F5F9' : 'rgba(255,255,255,0.2)'}
                strokeWidth={isSelected ? 2 : isHovered ? 1.5 : 1}
                className="cursor-pointer transition-all duration-200"
                onMouseEnter={() => setHoveredRegion(region.name)}
                onMouseLeave={() => setHoveredRegion(null)}
                onClick={() => onRegionClick?.(region.name)}
                filter={isHovered ? 'url(#glow)' : undefined}
              />
              {/* Region label */}
              {data && (
                <text
                  x={
                    region.name === 'Conakry'
                      ? 103
                      : region.name === 'Boké'
                        ? 65
                        : region.name === 'Labé'
                          ? 125
                          : region.name === 'Mamou'
                            ? 128
                            : region.name === 'Kindia'
                              ? 98
                              : region.name === 'Faranah'
                                ? 180
                                : region.name === 'Kankan'
                                  ? 195
                                  : 210
                  }
                  y={
                    region.name === 'Conakry'
                      ? 160
                      : region.name === 'Boké'
                        ? 88
                        : region.name === 'Labé'
                          ? 73
                          : region.name === 'Mamou'
                            ? 122
                            : region.name === 'Kindia'
                              ? 140
                              : region.name === 'Faranah'
                                ? 112
                                : region.name === 'Kankan'
                                  ? 75
                                  : 150
                  }
                  textAnchor="middle"
                  className="text-[5px] fill-slate-200 pointer-events-none font-medium"
                >
                  {region.name}
                </text>
              )}
            </g>
          );
        })}

        {/* Ocean label */}
        <text x="80" y="180" className="text-[5px] fill-slate-600 italic" textAnchor="middle">
          Atlantique
        </text>
      </svg>

      {/* Tooltip */}
      {hoveredRegion && (
        <div className="absolute top-2 right-2 bg-[#1E293B]/95 backdrop-blur-sm border border-white/10 rounded-lg p-3 shadow-xl pointer-events-none min-w-[160px]">
          {(() => {
            const data = getRegionData(hoveredRegion);
            if (!data) return null;
            return (
              <div>
                <p className="text-sm font-semibold text-[#D4A843] mb-1">{data.name}</p>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Couverture</span>
                    <span className="text-slate-200 font-mono">{data.coverage}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Score QoS</span>
                    <span className="text-slate-200 font-mono">{data.qos}/100</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Population</span>
                    <span className="text-slate-200 font-mono">{(data.population / 1000000).toFixed(1)}M</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Zones Blanches</span>
                    <span className="text-slate-200 font-mono">{data.whiteZones}</span>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
