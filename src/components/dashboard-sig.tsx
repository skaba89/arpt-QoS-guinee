'use client';

import { useState } from 'react';
import { Layers, Eye, Wifi, MapPin, Route, Filter } from 'lucide-react';
import { GuineaMap } from './guinea-map';
import { regions, operators } from '@/lib/mock-data';

export function DashboardSIG() {
  const [selectedOperator, setSelectedOperator] = useState<string>('all');
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [layers, setLayers] = useState({
    coverage: true,
    qosHeatmap: false,
    whiteZones: true,
    roads: false,
  });

  const toggleLayer = (key: keyof typeof layers) => {
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const regionData = selectedRegion ? regions.find((r) => r.name === selectedRegion) : null;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-50">Cartographie SIG</h1>
          <p className="text-sm text-slate-400 mt-1">Système d&apos;Information Géographique - Visualisation spatiale des données télécom</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Map Area */}
        <div className="lg:col-span-3 space-y-4">
          {/* Operator Filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="h-4 w-4 text-[#D4A843] mr-1" />
            <span className="text-xs text-slate-500">Opérateur:</span>
            {[
              { id: 'all', name: 'Tous', color: '#D4A843' },
              ...operators.map((op) => ({ id: op.id, name: op.name.split(' ')[0], color: op.color })),
            ].map((op) => (
              <button
                key={op.id}
                onClick={() => setSelectedOperator(op.id)}
                className={`px-3 py-1.5 text-xs rounded-md border transition-all flex items-center gap-1.5 ${
                  selectedOperator === op.id
                    ? 'border-opacity-60 text-white'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                }`}
                style={selectedOperator === op.id ? { backgroundColor: `${op.color}20`, borderColor: `${op.color}40` } : {}}
              >
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: op.color }} />
                {op.name}
              </button>
            ))}
          </div>

          {/* Interactive Map */}
          <div className="relative overflow-hidden rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 p-5">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#D4A843] to-transparent opacity-60" />
            
            {/* Map stats overlay */}
            <div className="absolute top-4 left-4 z-10 flex items-center gap-2 text-[10px]">
              <div className="px-2 py-1 rounded bg-[#0A0F1E]/80 backdrop-blur-sm border border-white/10 flex items-center gap-1">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-slate-300">Données en direct</span>
              </div>
              <div className="px-2 py-1 rounded bg-[#0A0F1E]/80 backdrop-blur-sm border border-white/10 text-slate-400">
                8 régions • 234 zones blanches
              </div>
            </div>

            {/* Zoom controls */}
            <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-1">
              <button className="h-8 w-8 rounded-lg bg-[#0A0F1E]/80 backdrop-blur-sm border border-white/10 text-slate-300 hover:bg-white/10 flex items-center justify-center text-lg font-bold">
                +
              </button>
              <button className="h-8 w-8 rounded-lg bg-[#0A0F1E]/80 backdrop-blur-sm border border-white/10 text-slate-300 hover:bg-white/10 flex items-center justify-center text-lg font-bold">
                −
              </button>
            </div>

            <GuineaMap
              metric={layers.qosHeatmap ? 'qos' : 'coverage'}
              onRegionClick={setSelectedRegion}
              selectedRegion={selectedRegion}
            />
          </div>

          {/* Regional Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {regions.map((region) => {
              const isSelected = selectedRegion === region.name;
              return (
                <button
                  key={region.name}
                  onClick={() => setSelectedRegion(isSelected ? null : region.name)}
                  className={`rounded-lg border p-3 text-left transition-all ${
                    isSelected
                      ? 'bg-[#D4A843]/10 border-[#D4A843]/30'
                      : 'bg-white/5 border-white/10 hover:bg-white/[0.08]'
                  }`}
                >
                  <p className="text-xs font-semibold text-slate-200">{region.name}</p>
                  <div className="mt-2 flex items-end justify-between">
                    <div>
                      <p className="text-lg font-bold text-slate-50">{region.coverage}%</p>
                      <p className="text-[10px] text-slate-500">Couverture</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-300">{region.qos}/100</p>
                      <p className="text-[10px] text-slate-500">QoS</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sidebar Controls */}
        <div className="space-y-4">
          {/* Layer Controls */}
          <div className="relative overflow-hidden rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 p-4">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#D4A843] to-transparent opacity-60" />
            <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
              <Layers className="h-4 w-4 text-[#D4A843]" />
              Couches
            </h3>
            <div className="space-y-2">
              {[
                { key: 'coverage' as const, label: 'Couverture Mobile', icon: Wifi, color: '#10B981' },
                { key: 'qosHeatmap' as const, label: 'Heatmap QoS', icon: Eye, color: '#3B82F6' },
                { key: 'whiteZones' as const, label: 'Zones Blanches', icon: MapPin, color: '#EF4444' },
                { key: 'roads' as const, label: 'Axes Routiers', icon: Route, color: '#F59E0B' },
              ].map((layer) => (
                <button
                  key={layer.key}
                  onClick={() => toggleLayer(layer.key)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all text-left ${
                    layers[layer.key]
                      ? 'bg-white/10 border-white/20'
                      : 'bg-transparent border-white/5 opacity-50'
                  }`}
                >
                  <layer.icon className="h-4 w-4" style={{ color: layer.color }} />
                  <span className="text-xs text-slate-300 flex-1">{layer.label}</span>
                  <div className={`h-4 w-7 rounded-full relative transition-colors ${layers[layer.key] ? 'bg-[#D4A843]/40' : 'bg-white/10'}`}>
                    <div className={`absolute top-0.5 h-3 w-3 rounded-full transition-all ${layers[layer.key] ? 'right-0.5 bg-[#D4A843]' : 'left-0.5 bg-slate-500'}`} />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="relative overflow-hidden rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 p-4">
            <h3 className="text-sm font-semibold text-slate-300 mb-3">Légende</h3>
            <div className="space-y-2">
              {[
                { label: 'Excellente (≥80%)', color: '#10B981' },
                { label: 'Bonne (65-79%)', color: '#3B82F6' },
                { label: 'Moyenne (50-64%)', color: '#F59E0B' },
                { label: 'Faible (<50%)', color: '#EF4444' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: item.color }} />
                  <span className="text-xs text-slate-400">{item.label}</span>
                </div>
              ))}
              <div className="pt-2 border-t border-white/10">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-sm border-2 border-dashed border-red-400/60 bg-transparent" />
                  <span className="text-xs text-slate-400">Zone Blanche</span>
                </div>
              </div>
            </div>
          </div>

          {/* Region Detail Panel */}
          {regionData && (
            <div className="relative overflow-hidden rounded-xl bg-white/5 backdrop-blur-xl border border-[#D4A843]/30 p-4">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#D4A843]" />
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-[#D4A843]">{regionData.name}</h3>
                <button
                  onClick={() => setSelectedRegion(null)}
                  className="text-xs text-slate-500 hover:text-slate-300"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-400">Couverture</span>
                    <span className="text-slate-200 font-mono">{regionData.coverage}%</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${regionData.coverage}%`, backgroundColor: regionData.color }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-400">Score QoS</span>
                    <span className="text-slate-200 font-mono">{regionData.qos}/100</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${regionData.qos}%`, backgroundColor: '#3B82F6' }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10">
                  <div className="p-2 rounded bg-white/5 text-center">
                    <p className="text-sm font-bold text-slate-200">{(regionData.population / 1000000).toFixed(1)}M</p>
                    <p className="text-[10px] text-slate-500">Population</p>
                  </div>
                  <div className="p-2 rounded bg-white/5 text-center">
                    <p className="text-sm font-bold text-slate-200">{regionData.whiteZones}</p>
                    <p className="text-[10px] text-slate-500">Z. Blanches</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quick Stats */}
          <div className="relative overflow-hidden rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 p-4">
            <h3 className="text-sm font-semibold text-slate-300 mb-3">Statistiques Rapides</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Régions supervisées</span>
                <span className="text-slate-200 font-mono">8/8</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Sites monitorés</span>
                <span className="text-slate-200 font-mono">1,247</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Dernière mise à jour</span>
                <span className="text-slate-200 font-mono">Il y a 5 min</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Source données</span>
                <span className="text-slate-200 font-mono">Temps réel</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
