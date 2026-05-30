'use client';

import { useState, useEffect } from 'react';
import { Signal, Wifi, Users, AlertTriangle, TrendingUp, TrendingDown, Shield, Activity, Lock, Loader2, Award, Crown, Medal } from 'lucide-react';
import { MetricCard } from './metric-card';
import { CircularGauge, Sparkline } from './mini-chart';
import { GuineaMapLeaflet } from './guinea-map-leaflet';
import { useAuthGuard } from '@/hooks/use-auth-guard';

interface KPIData { value: number; unit: string; trend: number; label: string }
interface OperatorData { id: string; name: string; code: string; color: string; score: number; trend: number; subscores: { couverture: number; qos: number; qoe: number; conformite: number; innovation: number; investissement: number }; historicalScores: number[] }
interface AlertData { id: string; type: string; operator: string; region: string; message: string; time: string }
interface RegionData { name: string; code: string; coverage: number; qos: number; population: number; whiteZones: number; color: string }
interface MapRegionData { code: string; nom: string; centreLat: number; centreLng: number; population: number; coverage: number; qos: number; color: string; whiteZones: number }
interface MapPointData { lat: number; lng: number; operator: string; operatorColor: string; rssi: number | null; scoreQoE: number | null }
interface MapOperatorData { id: string; name: string; code: string; color: string }

/* ─── Ranking accent colors ─── */
const RANKING_STYLES: { color: string; bg: string; icon: typeof Crown }[] = [
  { color: '#D4A843', bg: 'rgba(212,168,67,0.12)', icon: Crown },      // 1st — Gold
  { color: '#A8B4C0', bg: 'rgba(168,180,192,0.10)', icon: Award },     // 2nd — Silver
  { color: '#CD7F32', bg: 'rgba(205,127,50,0.10)', icon: Medal },      // 3rd — Bronze
  { color: '#64748B', bg: 'rgba(100,116,139,0.08)', icon: Shield },    // 4th+ — Default
];

export function DashboardDG() {
  const { isAuthorized, isLoading: authLoading, session } = useAuthGuard('DG');
  const [data, setData] = useState<{
    kpis: Record<string, KPIData>;
    operators: OperatorData[];
    alerts: AlertData[];
    regions: RegionData[];
    slaCompliance: { global: number; operators: Record<string, number> };
  } | null>(null);
  const [mapData, setMapData] = useState<{ regions: MapRegionData[]; measurementPoints: MapPointData[]; operators: MapOperatorData[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [dashRes, mapRes] = await Promise.all([
          fetch('/api/dashboard'),
          fetch('/api/map'),
        ]);
        if (dashRes.ok) {
          const d = await dashRes.json();
          setData(d);
        }
        if (mapRes.ok) {
          setMapData(await mapRes.json());
        }
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  /* ─── Auth Guard ─── */
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[#D4A843]" />
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Lock className="h-12 w-12 text-red-400" />
        <h3 className="text-lg font-semibold text-slate-50">Accès non autorisé</h3>
        <p className="text-slate-400 text-sm">Vous n'avez pas les permissions nécessaires pour accéder à cette section.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-[#D4A843]" />
        <div className="text-xs text-slate-400">Chargement du tableau de bord...</div>
      </div>
    );
  }

  /* ─── Derived Data ─── */
  const kpiData = data?.kpis || {
    couvertureNationale: { value: 0, unit: '%', trend: 0, label: 'Couverture Nationale' },
    scoreQosGlobal: { value: 0, unit: '/100', trend: 0, label: 'Score QoS Global' },
    zonesBlanches: { value: 0, unit: '', trend: 0, label: 'Zones Blanches' },
    populationCouverte: { value: 0, unit: 'M', trend: 0, label: 'Population Couverte' },
  };
  const operators = data?.operators || [];
  const alerts = data?.alerts || [];
  const regions = data?.regions || [];
  const slaCompliance = data?.slaCompliance || { global: 0, operators: {} };

  const userRole = (session?.user as Record<string, unknown>)?.role as string;
  const isRestricted = !['SUPER_ADMIN', 'DG', 'DGA'].includes(userRole);

  /* ─── KPI configuration ─── */
  const kpiConfigs = [
    { kpi: kpiData.couvertureNationale, icon: Signal, color: '#10B981', trendLabel: '%' },
    { kpi: kpiData.scoreQosGlobal, icon: Activity, color: '#3B82F6', trendLabel: '' },
    { kpi: kpiData.zonesBlanches, icon: Wifi, color: '#EF4444', trendLabel: '' },
    { kpi: kpiData.populationCouverte, icon: Users, color: '#D4A843', trendLabel: 'K' },
  ];

  return (
    <div className="space-y-8">
      {/* ═══════════════════════════════════════════
          PAGE HEADER — Institutional Pattern
          ═══════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 mb-2">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="h-1 w-8 rounded-full bg-gradient-to-r from-[#D4A843] to-transparent" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#D4A843]/70">
              Supervision
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-50 tracking-tight">
            Tableau de Bord Directeur
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            Vue stratégique de la supervision nationale des télécommunications
          </p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {isRestricted && (
            <div className="government-badge">
              <Shield className="h-3 w-3 text-[#D4A843]" />
              <span>Accès restreint</span>
            </div>
          )}
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/[0.08] border border-emerald-500/15">
            <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-emerald-400 font-semibold">Temps réel</span>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          KPI CARDS — with guinea-stripe-top
          ═══════════════════════════════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiConfigs.map((cfg, i) => (
          <div key={i} className="guinea-stripe-top rounded-xl overflow-hidden">
            <MetricCard
              value={cfg.kpi.value}
              suffix={cfg.kpi.unit}
              label={cfg.kpi.label}
              trend={cfg.kpi.trend}
              trendLabel={cfg.trendLabel}
              icon={cfg.icon}
              color={cfg.color}
            />
          </div>
        ))}
      </div>

      {/* ═══════════════════════════════════════════
          MAIN CONTENT GRID
          ═══════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ─── Operator Ranking ─── */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="section-title">Classement Opérateurs</h2>
          {operators.map((op, index) => {
            const rank = RANKING_STYLES[Math.min(index, RANKING_STYLES.length - 1)];
            const RankIcon = rank.icon;

            return (
              <div
                key={op.id}
                className="institutional-card relative overflow-hidden !p-4"
              >
                {/* Ranking left stripe */}
                <div
                  className="absolute top-0 left-0 bottom-0 w-1 rounded-l-xl"
                  style={{ backgroundColor: rank.color }}
                />

                {/* Rank badge */}
                <div className="absolute top-3 right-3">
                  <div
                    className="flex items-center justify-center h-6 w-6 rounded-full border"
                    style={{
                      backgroundColor: rank.bg,
                      borderColor: `${rank.color}40`,
                    }}
                  >
                    <RankIcon className="h-3 w-3" style={{ color: rank.color }} />
                  </div>
                </div>

                {/* Operator header */}
                <div className="flex items-center justify-between pr-8">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-10 w-10 rounded-lg flex items-center justify-center font-bold text-sm"
                      style={{ backgroundColor: `${op.color}20`, color: op.color }}
                    >
                      {op.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-100">{op.name}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        {op.trend > 0 ? (
                          <TrendingUp className="h-3 w-3 text-emerald-400" />
                        ) : (
                          <TrendingDown className="h-3 w-3 text-red-400" />
                        )}
                        <span className={`text-xs ${op.trend > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {op.trend > 0 ? '+' : ''}{op.trend}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Sparkline data={op.historicalScores} color={op.color} width={60} height={24} />
                    <div className="text-right">
                      <p className="text-2xl font-bold text-slate-50">{op.score}</p>
                      <p className="text-[10px] text-slate-500">/100</p>
                    </div>
                  </div>
                </div>

                {/* Subscore progress bars — improved */}
                <div className="mt-3 grid grid-cols-3 gap-x-3 gap-y-2">
                  {[
                    { label: 'Couv.', val: op.subscores.couverture },
                    { label: 'QoS', val: op.subscores.qos },
                    { label: 'QoE', val: op.subscores.qoe },
                    { label: 'Conf.', val: op.subscores.conformite },
                    { label: 'Innov.', val: op.subscores.innovation },
                    { label: 'Invest.', val: op.subscores.investissement },
                  ].map((sub) => (
                    <div key={sub.label} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] text-slate-500 uppercase tracking-wide">{sub.label}</span>
                        <span className="text-[9px] font-mono text-slate-400">{sub.val}</span>
                      </div>
                      <div className="h-1.5 w-full bg-white/[0.06] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${sub.val}%`,
                            backgroundColor: sub.val >= 80 ? '#10B981' : sub.val >= 60 ? op.color : sub.val >= 40 ? '#F59E0B' : '#EF4444',
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* ─── Right Column: Map + SLA/Coverage ─── */}
        <div className="lg:col-span-2 space-y-6">

          {/* National Coverage Map */}
          <div className="institutional-card guinea-stripe-top overflow-hidden !p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="section-title !mb-0 !pb-0">Couverture Nationale</h2>
              <div className="flex items-center gap-3 text-[10px]">
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" /> ≥80%</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-blue-500" /> 65-79%</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500" /> 50-64%</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500" /> &lt;50%</span>
              </div>
            </div>
            <GuineaMapLeaflet
              metric="coverage"
              regionData={mapData?.regions || []}
              measurementPoints={mapData?.measurementPoints || []}
              operators={mapData?.operators || []}
            />
          </div>

          {/* SLA Compliance & Regional Coverage */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

            {/* SLA Compliance */}
            <div className="institutional-card guinea-stripe-top overflow-hidden">
              <h3 className="section-title">Conformité SLA</h3>
              <div className="flex items-center justify-center">
                <CircularGauge value={slaCompliance.global} color="#D4A843" size={120} strokeWidth={8} label="/100" />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-center text-xs">
                {operators.map((op) => (
                  <div key={op.id} className="p-2 rounded-lg bg-white/[0.04] border border-white/[0.05] transition-colors hover:bg-white/[0.06]">
                    <p className="font-semibold" style={{ color: op.color }}>{slaCompliance.operators[op.code] || 0}%</p>
                    <p className="text-slate-500">{op.name.split(' ')[0]}</p>
                  </div>
                ))}
                <div className="p-2 rounded-lg bg-white/[0.04] border border-white/[0.05]">
                  <p className="text-slate-300 font-semibold">{slaCompliance.global}%</p>
                  <p className="text-slate-500">Moyenne</p>
                </div>
              </div>
            </div>

            {/* Regional Coverage */}
            <div className="institutional-card guinea-stripe-top overflow-hidden">
              <h3 className="section-title">Couverture par Région</h3>
              <div className="space-y-2.5 max-h-64 overflow-y-auto custom-scrollbar pr-1">
                {regions.map((r) => (
                  <div key={r.name} className="group">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-400 truncate group-hover:text-slate-300 transition-colors">{r.name}</span>
                      <span className="text-xs text-slate-300 font-mono font-medium w-10 text-right">{r.coverage}%</span>
                    </div>
                    <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700 relative overflow-hidden"
                        style={{ width: `${r.coverage}%`, backgroundColor: r.color }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          ALERTS SECTION
          ═══════════════════════════════════════════ */}
      <div className="institutional-card guinea-stripe-top overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title !mb-0 !pb-0 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            Alertes Récentes
          </h2>
          <span className="text-xs text-slate-500">{alerts.length} alertes actives</span>
        </div>
        <div className="space-y-2 max-h-56 overflow-y-auto custom-scrollbar">
          {alerts.map((alert) => {
            const severityConfig = {
              critical: {
                bg: 'bg-red-500/5',
                border: 'border-red-500/20',
                dot: 'bg-red-400 animate-pulse',
                icon: 'text-red-400',
                hoverBg: 'hover:bg-red-500/[0.08]',
              },
              warning: {
                bg: 'bg-amber-500/5',
                border: 'border-amber-500/20',
                dot: 'bg-amber-400',
                icon: 'text-amber-400',
                hoverBg: 'hover:bg-amber-500/[0.08]',
              },
              info: {
                bg: 'bg-blue-500/5',
                border: 'border-blue-500/20',
                dot: 'bg-blue-400',
                icon: 'text-blue-400',
                hoverBg: 'hover:bg-blue-500/[0.08]',
              },
            }[alert.type] || {
              bg: 'bg-white/5',
              border: 'border-white/10',
              dot: 'bg-slate-400',
              icon: 'text-slate-400',
              hoverBg: 'hover:bg-white/5',
            };

            return (
              <div
                key={alert.id}
                className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${severityConfig.bg} ${severityConfig.border} ${severityConfig.hoverBg}`}
              >
                <div className={`mt-0.5 h-2.5 w-2.5 rounded-full flex-shrink-0 ${severityConfig.dot}`} style={{ boxShadow: alert.type === 'critical' ? '0 0 0 2px rgba(239,68,68,0.3)' : alert.type === 'warning' ? '0 0 0 2px rgba(245,158,11,0.3)' : '0 0 0 2px rgba(59,130,246,0.3)' }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-slate-200">{alert.operator}</span>
                    <span className="text-[10px] text-slate-500">•</span>
                    <span className="text-xs text-slate-400">{alert.region}</span>
                    <span className="text-[10px] text-slate-500">•</span>
                    <span className="text-[10px] text-slate-500">{alert.time}</span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">{alert.message}</p>
                </div>
                <Shield className={`h-4 w-4 flex-shrink-0 ${severityConfig.icon}`} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
