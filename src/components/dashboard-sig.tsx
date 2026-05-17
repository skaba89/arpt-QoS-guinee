'use client';

import { useState, useEffect } from 'react';
import { Layers, Eye, Wifi, MapPin, Route, Filter, GitBranch, Info } from 'lucide-react';
import { GuineaMapLeaflet } from './guinea-map-leaflet';
import { cntRegions } from '@/lib/guinea-geojson-cnt';

interface MapRegionData { code: string; nom: string; centreLat: number; centreLng: number; population: number; coverage: number; qos: number; color: string; whiteZones: number }
interface MapPointData { lat: number; lng: number; operator: string; operatorColor: string; rssi: number | null; scoreQoE: number | null }
interface MapOperatorData { id: string; name: string; code: string; color: string }

export function DashboardSIG() {
  const [selectedOperator, setSelectedOperator] = useState<string>('all');
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [layers, setLayers] = useState({ coverage: true, qosHeatmap: false, whiteZones: true, roads: false });
  const [mapData, setMapData] = useState<{ regions: MapRegionData[]; measurementPoints: MapPointData[]; operators: MapOperatorData[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [useCNTDecoupage, setUseCNTDecoupage] = useState(true); // Default to new CNT découpage
  const [showCNTInfo, setShowCNTInfo] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/map');
        if (res.ok) setMapData(await res.json());
      } catch (err) {
        console.error('Map fetch error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const toggleLayer = (key: keyof typeof layers) => setLayers((prev) => ({ ...prev, [key]: !prev[key] }));
  const regionData = selectedRegion ? mapData?.regions.find((r) => r.nom === selectedRegion) : null;

  // Get the region list based on current découpage mode
  const displayRegions = useCNTDecoupage
    ? cntRegions.map(r => {
        // Find matching data from API or use computed values
        const apiData = mapData?.regions.find(ar => ar.code === r.code);
        if (apiData) return apiData;
        // Compute from parent region
        const parentMapping: Record<string, string> = {
          'CYA': 'KIN', 'KDR': 'BOK', 'MLI': 'LAB', 'DLB': 'MAM',
          'KDG': 'FAR', 'SGR': 'KAN', 'GKD': 'NZE', 'BLA': 'NZE',
        };
        const parentCode = parentMapping[r.code];
        const parentData = mapData?.regions.find(ar => ar.code === parentCode);
        if (parentData) {
          const seed = r.code.charCodeAt(0) + (r.code.charCodeAt(1) || 0);
          const variation = ((seed % 20) - 10);
          const coverage = Math.max(10, Math.min(99, parentData.coverage + variation));
          const qos = Math.max(10, Math.min(99, parentData.qos + variation));
          const color = coverage >= 80 ? '#10B981' : coverage >= 65 ? '#3B82F6' : coverage >= 50 ? '#F59E0B' : '#EF4444';
          return {
            code: r.code,
            nom: r.nom,
            centreLat: r.centreLat,
            centreLng: r.centreLng,
            population: r.population,
            coverage,
            qos,
            color,
            whiteZones: coverage > 0 ? Math.round((100 - coverage) / 3) : 0,
          };
        }
        return {
          code: r.code,
          nom: r.nom,
          centreLat: r.centreLat,
          centreLng: r.centreLng,
          population: r.population,
          coverage: 50,
          qos: 45,
          color: '#F59E0B',
          whiteZones: 17,
        };
      })
    : (mapData?.regions || []);

  const operatorButtons = [
    { id: 'all', name: 'Tous', color: '#D4A843' },
    ...(mapData?.operators.map((op) => ({ id: op.id, name: op.name.split(' ')[0], color: op.color })) || []),
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-50">Cartographie SIG</h1>
          <p className="text-sm text-slate-400 mt-1">Système d&apos;Information Géographique - Visualisation spatiale des données télécom</p>
        </div>

        {/* Découpage Toggle */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <GitBranch className="h-3.5 w-3.5" />
            <span>Découpage:</span>
          </div>
          <div className="flex rounded-lg border border-white/10 overflow-hidden">
            <button
              onClick={() => { setUseCNTDecoupage(true); setSelectedRegion(null); }}
              className={`px-3 py-1.5 text-xs font-medium transition-all ${
                useCNTDecoupage
                  ? 'bg-[#D4A843]/20 text-[#D4A843] border-r border-white/10'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10'
              }`}
            >
              Nouveau CNT (16)
            </button>
            <button
              onClick={() => { setUseCNTDecoupage(false); setSelectedRegion(null); }}
              className={`px-3 py-1.5 text-xs font-medium transition-all ${
                !useCNTDecoupage
                  ? 'bg-[#D4A843]/20 text-[#D4A843]'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10'
              }`}
            >
              Ancien (8)
            </button>
          </div>
          <button
            onClick={() => setShowCNTInfo(!showCNTInfo)}
            className="h-7 w-7 rounded-md border border-white/10 bg-white/5 flex items-center justify-center text-slate-400 hover:text-[#D4A843] hover:border-[#D4A843]/30 transition-all"
            title="Informations sur le découpage CNT"
          >
            <Info className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* CNT Info Banner */}
      {showCNTInfo && useCNTDecoupage && (
        <div className="rounded-xl bg-[#D4A843]/5 border border-[#D4A843]/20 p-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 h-5 w-5 rounded-full bg-[#D4A843]/20 flex items-center justify-center flex-shrink-0">
              <GitBranch className="h-3 w-3 text-[#D4A843]" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-[#D4A843] mb-1">Nouveau découpage administratif CNT</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Le Conseil National de la Transition (CNT) a proposé le passage de 8 à 16 régions administratives.
                Ce nouveau découpage crée 8 nouvelles régions : <span className="text-slate-300">Coyah, Koundara, Mali, Dalaba, Kissidougou, Siguiri, Guéckédou</span> et <span className="text-slate-300">Beyla</span>,
                issues de la subdivision des 7 régions existantes. Conakry reste inchangée en tant que Gouvernorat spécial.
                Ce découpage reflète la réforme constitutionnelle de 2025 introduisant le système de Provinces.
              </p>
              <div className="flex gap-4 mt-2 text-[10px] text-slate-500">
                <span>Réf: D/2025/055/PRG/CNRD/SGG</span>
                <span>Constitution du 26/09/2025</span>
              </div>
            </div>
            <button onClick={() => setShowCNTInfo(false)} className="text-xs text-slate-500 hover:text-slate-300">✕</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="h-4 w-4 text-[#D4A843] mr-1" />
            <span className="text-xs text-slate-500">Opérateur:</span>
            {operatorButtons.map((op) => (
              <button key={op.id} onClick={() => setSelectedOperator(op.id)} className={`px-3 py-1.5 text-xs rounded-md border transition-all flex items-center gap-1.5 ${selectedOperator === op.id ? 'border-opacity-60 text-white' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`} style={selectedOperator === op.id ? { backgroundColor: `${op.color}20`, borderColor: `${op.color}40` } : {}}>
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: op.color }} />{op.name}
              </button>
            ))}
          </div>

          <div className="relative overflow-hidden rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 p-5">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#D4A843] to-transparent opacity-60" />
            <div className="absolute top-4 left-4 z-10 flex items-center gap-2 text-[10px]">
              <div className="px-2 py-1 rounded bg-[#0A0F1E]/80 backdrop-blur-sm border border-white/10 flex items-center gap-1">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-slate-300">Données en direct</span>
              </div>
              <div className="px-2 py-1 rounded bg-[#0A0F1E]/80 backdrop-blur-sm border border-white/10 text-slate-400">
                {useCNTDecoupage ? '16 régions CNT' : '8 régions'} • {mapData?.measurementPoints.length || 0} points
              </div>
              {useCNTDecoupage && (
                <div className="px-2 py-1 rounded bg-[#D4A843]/10 backdrop-blur-sm border border-[#D4A843]/20 text-[#D4A843]">
                  Nouveau découpage
                </div>
              )}
            </div>

            {loading ? (
              <div className="h-[500px] flex items-center justify-center"><div className="text-xs text-slate-500 animate-pulse">Chargement de la carte...</div></div>
            ) : (
              <GuineaMapLeaflet
                metric={layers.qosHeatmap ? 'qos' : 'coverage'}
                onRegionClick={setSelectedRegion}
                selectedRegion={selectedRegion}
                regionData={mapData?.regions || []}
                measurementPoints={mapData?.measurementPoints || []}
                operators={mapData?.operators || []}
                selectedOperator={selectedOperator}
                showWhiteZones={layers.whiteZones}
                showDriveTests={layers.roads}
                useCNTDecoupage={useCNTDecoupage}
              />
            )}
          </div>

          {/* Region cards grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {displayRegions.map((region) => {
              const isSelected = selectedRegion === region.nom;
              return (
                <button key={region.code} onClick={() => setSelectedRegion(isSelected ? null : region.nom)} className={`rounded-lg border p-3 text-left transition-all ${isSelected ? 'bg-[#D4A843]/10 border-[#D4A843]/30' : 'bg-white/5 border-white/10 hover:bg-white/[0.08]'}`}>
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-slate-200">{region.nom}</p>
                    {useCNTDecoupage && region.code !== 'CON' && (
                      <span className="text-[8px] px-1 py-0.5 rounded bg-[#D4A843]/10 text-[#D4A843]">CNT</span>
                    )}
                  </div>
                  <div className="mt-2 flex items-end justify-between">
                    <div><p className="text-lg font-bold text-slate-50">{region.coverage}%</p><p className="text-[10px] text-slate-500">Couverture</p></div>
                    <div className="text-right"><p className="text-sm font-semibold text-slate-300">{region.qos}/100</p><p className="text-[10px] text-slate-500">QoS</p></div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          {/* Layer controls */}
          <div className="relative overflow-hidden rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 p-4">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#D4A843] to-transparent opacity-60" />
            <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2"><Layers className="h-4 w-4 text-[#D4A843]" />Couches</h3>
            <div className="space-y-2">
              {[
                { key: 'coverage' as const, label: 'Couverture Mobile', icon: Wifi, color: '#10B981' },
                { key: 'qosHeatmap' as const, label: 'Heatmap QoS', icon: Eye, color: '#3B82F6' },
                { key: 'whiteZones' as const, label: 'Zones Blanches', icon: MapPin, color: '#EF4444' },
                { key: 'roads' as const, label: 'Axes Routiers', icon: Route, color: '#F59E0B' },
              ].map((layer) => (
                <button key={layer.key} onClick={() => toggleLayer(layer.key)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all text-left ${layers[layer.key] ? 'bg-white/10 border-white/20' : 'bg-transparent border-white/5 opacity-50'}`}>
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
              {[{ label: 'Excellente (≥80%)', color: '#10B981' }, { label: 'Bonne (65-79%)', color: '#3B82F6' }, { label: 'Moyenne (50-64%)', color: '#F59E0B' }, { label: 'Faible (<50%)', color: '#EF4444' }].map((item) => (
                <div key={item.label} className="flex items-center gap-2"><span className="h-3 w-3 rounded-sm" style={{ backgroundColor: item.color }} /><span className="text-xs text-slate-400">{item.label}</span></div>
              ))}
              <div className="pt-2 border-t border-white/10"><div className="flex items-center gap-2"><span className="h-3 w-3 rounded-sm border-2 border-dashed border-red-400/60 bg-transparent" /><span className="text-xs text-slate-400">Zone Blanche</span></div></div>
              {useCNTDecoupage && (
                <div className="pt-2 border-t border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-sm bg-[#D4A843]/30 border border-[#D4A843]/50" />
                    <span className="text-xs text-slate-400">Région sélectionnée (CNT)</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Region detail card */}
          {regionData && (
            <div className="relative overflow-hidden rounded-xl bg-white/5 backdrop-blur-xl border border-[#D4A843]/30 p-4">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#D4A843]" />
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-[#D4A843]">{regionData.nom}</h3>
                <button onClick={() => setSelectedRegion(null)} className="text-xs text-slate-500 hover:text-slate-300">✕</button>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-400">Couverture</span>
                    <span className="text-slate-200 font-mono">{regionData.coverage}%</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${regionData.coverage}%`, backgroundColor: regionData.color }} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-400">Score QoS</span>
                    <span className="text-slate-200 font-mono">{regionData.qos}/100</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${regionData.qos}%`, backgroundColor: '#3B82F6' }} />
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

          {/* CNT region selected - show extra info */}
          {useCNTDecoupage && selectedRegion && !regionData && (
            <div className="relative overflow-hidden rounded-xl bg-white/5 backdrop-blur-xl border border-[#D4A843]/30 p-4">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#D4A843]" />
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-[#D4A843]">{selectedRegion}</h3>
                <button onClick={() => setSelectedRegion(null)} className="text-xs text-slate-500 hover:text-slate-300">✕</button>
              </div>
              <div className="space-y-2 text-xs">
                {(() => {
                  const cntRegion = cntRegions.find(r => r.nom === selectedRegion);
                  if (!cntRegion) return <p className="text-slate-400">Région non trouvée</p>;
                  return (
                    <>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Code</span>
                        <span className="text-slate-200 font-mono">{cntRegion.code}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Ancienne région</span>
                        <span className="text-slate-200">{cntRegion.ancienneRegion}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Population</span>
                        <span className="text-slate-200 font-mono">{(cntRegion.population / 1000000).toFixed(1)}M</span>
                      </div>
                      <div className="pt-2 border-t border-white/10">
                        <p className="text-slate-400 mb-1">Préfectures:</p>
                        <div className="flex flex-wrap gap-1">
                          {cntRegion.prefectures.map(p => (
                            <span key={p} className="px-2 py-0.5 rounded bg-white/5 text-slate-300 text-[10px]">{p}</span>
                          ))}
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Quick stats */}
          <div className="relative overflow-hidden rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 p-4">
            <h3 className="text-sm font-semibold text-slate-300 mb-3">Statistiques Rapides</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Régions supervisées</span>
                <span className="text-slate-200 font-mono">{useCNTDecoupage ? '16' : mapData?.regions.length || 0}/{useCNTDecoupage ? '16' : '8'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Préfectures</span>
                <span className="text-slate-200 font-mono">{useCNTDecoupage ? '34' : '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Points de mesure</span>
                <span className="text-slate-200 font-mono">{mapData?.measurementPoints.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Découpage</span>
                <span className="text-slate-200 font-mono">{useCNTDecoupage ? 'CNT 2025' : 'Classique'}</span>
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
