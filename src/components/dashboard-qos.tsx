'use client';

import { useState, useEffect } from 'react';
import { Clock, Download, Zap, Phone, Radio, Filter, Lock, Loader2 } from 'lucide-react';
import { MetricCard } from './metric-card';
import { LineChart, HBarChart } from './mini-chart';
import { useAuthGuard } from '@/hooks/use-auth-guard';

interface QoSMetricData { value: number; unit: string; label: string; trend: number }
interface BenchmarkItem { metric: string; orange: number; mtn: number; celcom: number; threshold: number }
interface OperatorMetric { id: string; name: string; code: string; color: string; score: number; latence: number; debit: number; tauxAppel: number; jitter: number; disponibilite: number }
interface RegionHeatmapItem { name: string; code: string; qos: number }

const operatorColors: Record<string, string> = { ORANGE: '#FF7900', MTN: '#FFCC00', CELCOM: '#00B4D8', INTERCEL: '#8B5CF6' };
const defaultOperators = [
  { id: 'orange', name: 'Orange Guinée', code: 'ORANGE', color: '#FF7900' },
  { id: 'mtn', name: 'MTN Guinée', code: 'MTN', color: '#FFCC00' },
  { id: 'celcom', name: 'Celcom Guinée', code: 'CELCOM', color: '#00B4D8' },
  { id: 'intercel', name: 'Intercel Guinée', code: 'INTERCEL', color: '#8B5CF6' },
];

export function DashboardQoS() {
  const { isAuthorized, isLoading: authLoading } = useAuthGuard('ANALYSTE_QOS');
  const [selectedOperator, setSelectedOperator] = useState<string>('all');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('6m');
  const [data, setData] = useState<{
    metrics: Record<string, QoSMetricData>;
    trendData: { months: string[]; orange: number[]; mtn: number[]; celcom: number[] };
    benchmark: BenchmarkItem[];
    regionalHeatmap: RegionHeatmapItem[];
    perOperator: OperatorMetric[];
  } | null>(null);
  const [regions, setRegions] = useState<{ name: string; code: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/qos?operateur=${selectedOperator}&region=${selectedRegion}&periode=${selectedPeriod}`);
        if (res.ok) setData(await res.json());
        const mapRes = await fetch('/api/map');
        if (mapRes.ok) {
          const md = await mapRes.json();
          setRegions(md.regions?.map((r: { nom: string; code: string }) => ({ name: r.nom, code: r.code })) || []);
        }
      } catch (err) {
        console.error('QoS fetch error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [selectedOperator, selectedRegion, selectedPeriod]);

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
    return <div className="flex items-center justify-center h-64"><div className="text-xs text-slate-500 animate-pulse">Chargement QoS...</div></div>;
  }

  const metrics = data?.metrics || {
    latency: { value: 42, unit: 'ms', label: 'Latence Moyenne', trend: -3 },
    debit: { value: 18.5, unit: 'Mbps', label: 'Débit Moyen', trend: 1.2 },
    tauxAppel: { value: 94.2, unit: '%', label: 'Taux Appel Réussi', trend: 0.5 },
    jitter: { value: 8, unit: 'ms', label: 'Jitter', trend: -1 },
  };

  const trendData = data?.trendData || { months: ['Oct', 'Nov', 'Déc', 'Jan', 'Fév', 'Mar'], orange: [75, 76, 74, 77, 76, 78], mtn: [72, 73, 71, 74, 73, 74], celcom: [60, 62, 61, 63, 64, 65] };
  const benchmark = data?.benchmark || [];
  const regionalHeatmap = data?.regionalHeatmap || [];
  const perOperator = data?.perOperator || [];

  const trendChartData = trendData.months.map((month, i) => {
    const allValues: number[] = [];
    for (const op of defaultOperators) {
      const opData = (trendData as Record<string, unknown>)[op.code.toLowerCase()];
      if (Array.isArray(opData) && typeof opData[i] === 'number') {
        allValues.push(opData[i] as number);
      }
    }
    return { label: month, values: allValues };
  });

  const ops = defaultOperators;

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title text-2xl">Monitoring QoS</h1>
          <p className="text-sm text-slate-400 -mt-1">Supervision technique de la qualité de service en temps réel</p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-emerald-400 font-medium">Live</span>
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <div className="institutional-card guinea-stripe-top p-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="h-4 w-4 text-[#D4A843] mr-1" />
          <div className="flex items-center gap-1">
            <span className="text-xs text-slate-500 mr-1">Opérateur:</span>
            {['all', 'orange', 'mtn', 'celcom', 'intercel'].map((op) => (
              <button key={op} onClick={() => setSelectedOperator(op)} className={`px-3 py-1 text-xs rounded-md border transition-all ${selectedOperator === op ? 'bg-[#D4A843]/20 border-[#D4A843]/40 text-[#D4A843]' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}>
                {op === 'all' ? 'Tous' : op.charAt(0).toUpperCase() + op.slice(1)}
              </button>
            ))}
          </div>
          <div className="h-6 w-px bg-white/10 mx-2" />
          <div className="flex items-center gap-1">
            <span className="text-xs text-slate-500 mr-1">Région:</span>
            <select value={selectedRegion} onChange={(e) => setSelectedRegion(e.target.value)} className="px-2 py-1 text-xs rounded-md bg-white/5 border border-white/10 text-slate-300 focus:outline-none focus:border-[#D4A843]/40">
              <option value="all">Toutes</option>
              {regions.map((r) => (<option key={r.code} value={r.code}>{r.name}</option>))}
            </select>
          </div>
          <div className="h-6 w-px bg-white/10 mx-2" />
          <div className="flex items-center gap-1">
            <span className="text-xs text-slate-500 mr-1">Période:</span>
            {['1m', '3m', '6m', '1y'].map((p) => (
              <button key={p} onClick={() => setSelectedPeriod(p)} className={`px-3 py-1 text-xs rounded-md border transition-all ${selectedPeriod === p ? 'bg-[#D4A843]/20 border-[#D4A843]/40 text-[#D4A843]' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}>
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Metric Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard value={metrics.latency.value} suffix={metrics.latency.unit} label={metrics.latency.label} trend={metrics.latency.trend} trendLabel="ms" icon={Clock} />
        <MetricCard value={metrics.debit.value} suffix={metrics.debit.unit} label={metrics.debit.label} trend={metrics.debit.trend} trendLabel="Mbps" icon={Download} />
        <MetricCard value={metrics.tauxAppel.value} suffix={metrics.tauxAppel.unit} label={metrics.tauxAppel.label} trend={metrics.tauxAppel.trend} trendLabel="%" icon={Phone} />
        <MetricCard value={metrics.jitter.value} suffix={metrics.jitter.unit} label={metrics.jitter.label} trend={metrics.jitter.trend} trendLabel="ms" icon={Radio} />
      </div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="institutional-card guinea-stripe-top">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-semibold text-[#D4A843] uppercase tracking-widest flex items-center gap-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#CE1126]" />
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#FCD116]" />
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#009460]" />
              Tendance QoS
            </h2>
            <div className="flex items-center gap-3 text-[10px]">
              {ops.map((op) => (<span key={op.id} className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: op.color }} />{op.name.split(' ')[0]}</span>))}
            </div>
          </div>
          <div className="w-full overflow-x-auto">
            <LineChart data={trendChartData} series={ops.map((op) => ({ name: op.name, color: op.color }))} width={Math.min(500, 450)} height={220} />
          </div>
        </div>

        <div className="institutional-card guinea-stripe-top">
          <h2 className="text-xs font-semibold text-[#D4A843] uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#CE1126]" />
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#FCD116]" />
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#009460]" />
            Benchmark Opérateurs
          </h2>
          <div className="space-y-4">
            {benchmark.map((item, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-slate-400">{item.metric}</span>
                  <span className="text-[10px] text-slate-500">Seuil: {item.threshold}</span>
                </div>
                <div className="flex items-center gap-1 h-4">
                  {[{ val: item.orange, color: '#FF7900' }, { val: item.mtn, color: '#FFCC00' }, { val: item.celcom, color: '#00B4D8' }, { val: ((item as unknown) as Record<string, number>).intercel || 0, color: '#8B5CF6' }].map((bar, bi) => {
                    const maxVal = Math.max(item.orange, item.mtn, item.celcom, ((item as unknown) as Record<string, number>).intercel || 0, item.threshold);
                    return (<div key={bi} className="flex-1 flex items-center gap-1"><div className="flex-1 h-3 bg-white/5 rounded-full overflow-hidden relative"><div className="h-full rounded-full" style={{ width: `${(bar.val / maxVal) * 100}%`, backgroundColor: bar.color, opacity: 0.8 }} /></div><span className="text-[10px] text-slate-400 font-mono w-10 text-right">{bar.val}</span></div>);
                  })}
                </div>
                <div className="mt-0.5 h-px bg-[#D4A843]/40" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Heatmap ── */}
      <div className="institutional-card guinea-stripe-top">
        <h2 className="text-xs font-semibold text-[#D4A843] uppercase tracking-widest mb-4 flex items-center gap-2">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#CE1126]" />
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#FCD116]" />
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#009460]" />
          Heatmap QoS Régional
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {regionalHeatmap.map((region) => {
            const scoreColor = region.qos >= 80 ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300' : region.qos >= 60 ? 'bg-blue-500/20 border-blue-500/30 text-blue-300' : region.qos >= 50 ? 'bg-amber-500/20 border-amber-500/30 text-amber-300' : 'bg-red-500/20 border-red-500/30 text-red-300';
            return (<div key={region.code} className={`rounded-lg border p-4 text-center transition-all hover:scale-[1.02] cursor-pointer ${scoreColor}`}><p className="text-xs font-medium opacity-80 mb-1">{region.name}</p><p className="text-2xl font-bold">{region.qos}</p><p className="text-[10px] opacity-60">/100</p></div>);
          })}
        </div>
      </div>

      {/* ── Per-Operator Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {perOperator.map((op) => (
          <div key={op.id} className="institutional-card guinea-stripe-left transition-all duration-300 hover:bg-white/[0.06]">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 rounded-lg flex items-center justify-center font-bold text-xs" style={{ backgroundColor: `${operatorColors[op.code] || op.color}20`, color: operatorColors[op.code] || op.color }}>{op.name.charAt(0)}</div>
              <div><p className="text-sm font-semibold text-slate-100">{op.name}</p><p className="text-[10px] text-slate-500">Score Global: {op.score}/100</p></div>
            </div>
            <div className="space-y-2">
              {[
                { label: 'Latence', value: `${op.latence}ms`, good: op.latence < 50 },
                { label: 'Débit', value: `${op.debit}Mbps`, good: op.debit > 15 },
                { label: 'Taux Appel', value: `${op.tauxAppel}%`, good: op.tauxAppel > 90 },
                { label: 'Jitter', value: `${op.jitter}ms`, good: op.jitter < 10 },
                { label: 'Disponibilité', value: `${op.disponibilite}%`, good: true },
              ].map((metric) => (
                <div key={metric.label} className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">{metric.label}</span>
                  <div className="flex items-center gap-1.5"><span className="text-xs text-slate-200 font-mono">{metric.value}</span><span className={`h-1.5 w-1.5 rounded-full ${metric.good ? 'bg-emerald-400' : 'bg-red-400'}`} /></div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
