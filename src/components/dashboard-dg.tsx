'use client';

import { Signal, Globe, Wifi, Users, AlertTriangle, TrendingUp, TrendingDown, Shield, Activity } from 'lucide-react';
import { MetricCard } from './metric-card';
import { CircularGauge, Sparkline } from './mini-chart';
import { GuineaMap } from './guinea-map';
import { operators, alerts, kpiData, regions } from '@/lib/mock-data';

export function DashboardDG() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-50">Tableau de Bord Directeur</h1>
          <p className="text-sm text-slate-400 mt-1">Vue stratégique de la supervision nationale des télécommunications</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-emerald-400 font-medium">Temps réel</span>
          </div>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          value={kpiData.couvertureNationale.value}
          suffix={kpiData.couvertureNationale.unit}
          label={kpiData.couvertureNationale.label}
          trend={kpiData.couvertureNationale.trend}
          trendLabel="%"
          icon={Signal}
        />
        <MetricCard
          value={kpiData.scoreQosGlobal.value}
          suffix={kpiData.scoreQosGlobal.unit}
          label={kpiData.scoreQosGlobal.label}
          trend={kpiData.scoreQosGlobal.trend}
          trendLabel=""
          icon={Activity}
        />
        <MetricCard
          value={kpiData.zonesBlanches.value}
          label={kpiData.zonesBlanches.label}
          trend={kpiData.zonesBlanches.trend}
          trendLabel=""
          icon={Wifi}
        />
        <MetricCard
          value={kpiData.populationCouverte.value}
          suffix={kpiData.populationCouverte.unit}
          label={kpiData.populationCouverte.label}
          trend={kpiData.populationCouverte.trend}
          trendLabel="K"
          icon={Users}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Operator Ranking Cards */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Classement Opérateurs</h2>
          {operators.map((op) => (
            <div
              key={op.id}
              className="relative overflow-hidden rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 p-4 transition-all duration-300 hover:bg-white/[0.08] hover:border-white/20"
            >
              <div className="flex items-center justify-between">
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

              {/* Sub-scores bar */}
              <div className="mt-3 grid grid-cols-4 gap-1">
                {[
                  { label: 'Couv.', val: op.subscores.couverture },
                  { label: 'QoS', val: op.subscores.qos },
                  { label: 'QoE', val: op.subscores.qoe },
                  { label: 'Conf.', val: op.subscores.conformite },
                ].map((sub) => (
                  <div key={sub.label} className="text-center">
                    <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${sub.val}%`,
                          backgroundColor: op.color,
                        }}
                      />
                    </div>
                    <p className="text-[9px] text-slate-500 mt-1">{sub.label}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Map + SLA */}
        <div className="lg:col-span-2 space-y-4">
          {/* Coverage Map */}
          <div className="relative overflow-hidden rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 p-4">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#D4A843] to-transparent opacity-60" />
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Couverture Nationale</h2>
              <div className="flex items-center gap-3 text-[10px]">
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" /> ≥80%</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-blue-500" /> 65-79%</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500" /> 50-64%</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500" /> &lt;50%</span>
              </div>
            </div>
            <GuineaMap metric="coverage" />
          </div>

          {/* SLA Compliance + Regional Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* SLA Gauge */}
            <div className="relative overflow-hidden rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 p-5">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#D4A843] to-transparent opacity-60" />
              <h3 className="text-sm font-semibold text-slate-300 mb-4">Conformité SLA</h3>
              <div className="flex items-center justify-center">
                <CircularGauge value={84} color="#D4A843" size={120} strokeWidth={8} label="/100" />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-center text-xs">
                <div className="p-2 rounded-lg bg-emerald-500/10">
                  <p className="text-emerald-400 font-semibold">92%</p>
                  <p className="text-slate-500">Orange</p>
                </div>
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <p className="text-amber-400 font-semibold">78%</p>
                  <p className="text-slate-500">MTN</p>
                </div>
                <div className="p-2 rounded-lg bg-red-500/10">
                  <p className="text-red-400 font-semibold">64%</p>
                  <p className="text-slate-500">Celcom</p>
                </div>
                <div className="p-2 rounded-lg bg-white/5">
                  <p className="text-slate-300 font-semibold">84%</p>
                  <p className="text-slate-500">Moyenne</p>
                </div>
              </div>
            </div>

            {/* Regional Summary */}
            <div className="relative overflow-hidden rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 p-5">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#3B82F6] to-transparent opacity-60" />
              <h3 className="text-sm font-semibold text-slate-300 mb-3">Couverture par Région</h3>
              <div className="space-y-2 max-h-52 overflow-y-auto custom-scrollbar pr-1">
                {regions.map((r) => (
                  <div key={r.name} className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 w-24 truncate">{r.name}</span>
                    <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${r.coverage}%`,
                          backgroundColor: r.color,
                        }}
                      />
                    </div>
                    <span className="text-xs text-slate-300 font-mono w-10 text-right">{r.coverage}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Alert Feed */}
      <div className="relative overflow-hidden rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 p-5">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#EF4444] to-transparent opacity-60" />
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            Alertes Récentes
          </h2>
          <span className="text-xs text-slate-500">{alerts.length} alertes actives</span>
        </div>
        <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`flex items-start gap-3 p-3 rounded-lg border transition-colors hover:bg-white/5 ${
                alert.type === 'critical'
                  ? 'bg-red-500/5 border-red-500/20'
                  : alert.type === 'warning'
                    ? 'bg-amber-500/5 border-amber-500/20'
                    : 'bg-blue-500/5 border-blue-500/20'
              }`}
            >
              <div
                className={`mt-0.5 h-2 w-2 rounded-full flex-shrink-0 ${
                  alert.type === 'critical'
                    ? 'bg-red-400 animate-pulse'
                    : alert.type === 'warning'
                      ? 'bg-amber-400'
                      : 'bg-blue-400'
                }`}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-200">{alert.operator}</span>
                  <span className="text-[10px] text-slate-500">•</span>
                  <span className="text-xs text-slate-400">{alert.region}</span>
                  <span className="text-[10px] text-slate-500">•</span>
                  <span className="text-[10px] text-slate-500">{alert.time}</span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">{alert.message}</p>
              </div>
              <Shield className={`h-4 w-4 flex-shrink-0 ${
                alert.type === 'critical' ? 'text-red-400' : alert.type === 'warning' ? 'text-amber-400' : 'text-blue-400'
              }`} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
