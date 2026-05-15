'use client';

import { useState } from 'react';
import { Clock, Download, Zap, Phone, Radio, Filter } from 'lucide-react';
import { MetricCard } from './metric-card';
import { LineChart, HBarChart } from './mini-chart';
import { qosMetrics, qosTrendData, benchmarkData, operators, regions } from '@/lib/mock-data';

export function DashboardQoS() {
  const [selectedOperator, setSelectedOperator] = useState<string>('all');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('6m');

  const trendData = qosTrendData.months.map((month, i) => ({
    label: month,
    values: [qosTrendData.orange[i], qosTrendData.mtn[i], qosTrendData.celcom[i]],
  }));

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-50">Monitoring QoS</h1>
          <p className="text-sm text-slate-400 mt-1">Supervision technique de la qualité de service en temps réel</p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-emerald-400 font-medium">Live</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="relative overflow-hidden rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 p-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="h-4 w-4 text-[#D4A843] mr-1" />
          
          {/* Operator Filter */}
          <div className="flex items-center gap-1">
            <span className="text-xs text-slate-500 mr-1">Opérateur:</span>
            {['all', 'orange', 'mtn', 'celcom'].map((op) => (
              <button
                key={op}
                onClick={() => setSelectedOperator(op)}
                className={`px-3 py-1 text-xs rounded-md border transition-all ${
                  selectedOperator === op
                    ? 'bg-[#D4A843]/20 border-[#D4A843]/40 text-[#D4A843]'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                }`}
              >
                {op === 'all' ? 'Tous' : op.charAt(0).toUpperCase() + op.slice(1)}
              </button>
            ))}
          </div>

          <div className="h-6 w-px bg-white/10 mx-2" />

          {/* Region Filter */}
          <div className="flex items-center gap-1">
            <span className="text-xs text-slate-500 mr-1">Région:</span>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="px-2 py-1 text-xs rounded-md bg-white/5 border border-white/10 text-slate-300 focus:outline-none focus:border-[#D4A843]/40"
            >
              <option value="all">Toutes</option>
              {regions.map((r) => (
                <option key={r.name} value={r.name}>{r.name}</option>
              ))}
            </select>
          </div>

          <div className="h-6 w-px bg-white/10 mx-2" />

          {/* Period Filter */}
          <div className="flex items-center gap-1">
            <span className="text-xs text-slate-500 mr-1">Période:</span>
            {['1m', '3m', '6m', '1y'].map((p) => (
              <button
                key={p}
                onClick={() => setSelectedPeriod(p)}
                className={`px-3 py-1 text-xs rounded-md border transition-all ${
                  selectedPeriod === p
                    ? 'bg-[#D4A843]/20 border-[#D4A843]/40 text-[#D4A843]'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          value={qosMetrics.latency.value}
          suffix={qosMetrics.latency.unit}
          label={qosMetrics.latency.label}
          trend={qosMetrics.latency.trend}
          trendLabel="ms"
          icon={Clock}
        />
        <MetricCard
          value={qosMetrics.debit.value}
          suffix={qosMetrics.debit.unit}
          label={qosMetrics.debit.label}
          trend={qosMetrics.debit.trend}
          trendLabel="Mbps"
          icon={Download}
        />
        <MetricCard
          value={qosMetrics.tauxAppel.value}
          suffix={qosMetrics.tauxAppel.unit}
          label={qosMetrics.tauxAppel.label}
          trend={qosMetrics.tauxAppel.trend}
          trendLabel="%"
          icon={Phone}
        />
        <MetricCard
          value={qosMetrics.jitter.value}
          suffix={qosMetrics.jitter.unit}
          label={qosMetrics.jitter.label}
          trend={qosMetrics.jitter.trend}
          trendLabel="ms"
          icon={Radio}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* QoS Trends Line Chart */}
        <div className="relative overflow-hidden rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 p-5">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#D4A843] to-transparent opacity-60" />
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Tendance QoS</h2>
            <div className="flex items-center gap-3 text-[10px]">
              {operators.map((op) => (
                <span key={op.id} className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: op.color }} />
                  {op.name.split(' ')[0]}
                </span>
              ))}
            </div>
          </div>
          <div className="w-full overflow-x-auto">
            <LineChart
              data={trendData}
              series={operators.map((op) => ({ name: op.name, color: op.color }))}
              width={Math.min(500, 450)}
              height={220}
            />
          </div>
        </div>

        {/* Benchmark Comparison */}
        <div className="relative overflow-hidden rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 p-5">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#3B82F6] to-transparent opacity-60" />
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">Benchmark Opérateurs</h2>
          <div className="space-y-4">
            {benchmarkData.map((item, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-slate-400">{item.metric}</span>
                  <span className="text-[10px] text-slate-500">Seuil: {item.threshold}</span>
                </div>
                <div className="flex items-center gap-1 h-4">
                  {[
                    { val: item.orange, color: '#FF7900' },
                    { val: item.mtn, color: '#FFCC00' },
                    { val: item.celcom, color: '#00B4D8' },
                  ].map((bar, bi) => {
                    const maxVal = Math.max(item.orange, item.mtn, item.celcom, item.threshold);
                    return (
                      <div key={bi} className="flex-1 flex items-center gap-1">
                        <div className="flex-1 h-3 bg-white/5 rounded-full overflow-hidden relative">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${(bar.val / maxVal) * 100}%`,
                              backgroundColor: bar.color,
                              opacity: 0.8,
                            }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono w-10 text-right">{bar.val}</span>
                      </div>
                    );
                  })}
                </div>
                {/* Threshold line */}
                <div className="mt-0.5 h-px bg-[#D4A843]/40" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Regional Heatmap */}
      <div className="relative overflow-hidden rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 p-5">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#10B981] to-transparent opacity-60" />
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">Heatmap QoS Régional</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {regions.map((region) => {
            const scoreColor =
              region.qos >= 80 ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300' :
              region.qos >= 60 ? 'bg-blue-500/20 border-blue-500/30 text-blue-300' :
              region.qos >= 50 ? 'bg-amber-500/20 border-amber-500/30 text-amber-300' :
              'bg-red-500/20 border-red-500/30 text-red-300';

            return (
              <div
                key={region.name}
                className={`rounded-lg border p-4 text-center transition-all hover:scale-[1.02] cursor-pointer ${scoreColor}`}
              >
                <p className="text-xs font-medium opacity-80 mb-1">{region.name}</p>
                <p className="text-2xl font-bold">{region.qos}</p>
                <p className="text-[10px] opacity-60">/100</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Operator Detail Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {operators.map((op) => (
          <div
            key={op.id}
            className="relative overflow-hidden rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 p-5 transition-all hover:bg-white/[0.08]"
          >
            <div className="absolute top-0 left-0 h-full w-1" style={{ backgroundColor: op.color }} />
            <div className="flex items-center gap-2 mb-4">
              <div
                className="h-8 w-8 rounded-lg flex items-center justify-center font-bold text-xs"
                style={{ backgroundColor: `${op.color}20`, color: op.color }}
              >
                {op.name.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-100">{op.name}</p>
                <p className="text-[10px] text-slate-500">Score Global: {op.score}/100</p>
              </div>
            </div>
            <div className="space-y-2">
              {[
                { label: 'Latence', value: op.id === 'orange' ? '38ms' : op.id === 'mtn' ? '45ms' : '55ms', good: op.id !== 'celcom' },
                { label: 'Débit', value: op.id === 'orange' ? '22Mbps' : op.id === 'mtn' ? '18Mbps' : '12Mbps', good: op.id !== 'celcom' },
                { label: 'Taux Appel', value: op.id === 'orange' ? '96%' : op.id === 'mtn' ? '93%' : '89%', good: op.id !== 'celcom' },
                { label: 'Jitter', value: op.id === 'orange' ? '6ms' : op.id === 'mtn' ? '9ms' : '14ms', good: op.id !== 'celcom' },
                { label: 'Disponibilité', value: op.id === 'orange' ? '99.2%' : op.id === 'mtn' ? '98.5%' : '97.1%', good: true },
              ].map((metric) => (
                <div key={metric.label} className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">{metric.label}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-slate-200 font-mono">{metric.value}</span>
                    <span className={`h-1.5 w-1.5 rounded-full ${metric.good ? 'bg-emerald-400' : 'bg-red-400'}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
