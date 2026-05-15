'use client';

import { ClipboardCheck, MapPin, CheckCircle2, XCircle, Clock, Car } from 'lucide-react';
import { campaigns, auditResults, operators } from '@/lib/mock-data';

export function DashboardAudit() {
  const activeCampaigns = campaigns.filter((c) => c.status === 'in_progress').length;
  const completedCampaigns = campaigns.filter((c) => c.status === 'completed').length;
  const plannedCampaigns = campaigns.filter((c) => c.status === 'planned').length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-50">Audit Terrain</h1>
          <p className="text-sm text-slate-400 mt-1">Gestion des campagnes d&apos;audit et tests terrain</p>
        </div>
      </div>

      {/* Campaign Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="relative overflow-hidden rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 p-5">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#3B82F6]" />
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <Clock className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-3xl font-bold text-slate-50">{activeCampaigns}</p>
              <p className="text-xs text-slate-400">En cours</p>
            </div>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 p-5">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#10B981]" />
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-3xl font-bold text-slate-50">{completedCampaigns}</p>
              <p className="text-xs text-slate-400">Complétées</p>
            </div>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 p-5">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#F59E0B]" />
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <ClipboardCheck className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="text-3xl font-bold text-slate-50">{plannedCampaigns}</p>
              <p className="text-xs text-slate-400">Planifiées</p>
            </div>
          </div>
        </div>
      </div>

      {/* Campaign List + Drive Test Map */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Campaign List */}
        <div className="lg:col-span-3 relative overflow-hidden rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 p-5">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#D4A843] to-transparent opacity-60" />
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">Liste des Campagnes</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-2.5 px-2 text-slate-400 font-medium">Campagne</th>
                  <th className="text-left py-2.5 px-2 text-slate-400 font-medium">Type</th>
                  <th className="text-left py-2.5 px-2 text-slate-400 font-medium">Opérateur</th>
                  <th className="text-left py-2.5 px-2 text-slate-400 font-medium">Région</th>
                  <th className="text-left py-2.5 px-2 text-slate-400 font-medium">Date</th>
                  <th className="text-left py-2.5 px-2 text-slate-400 font-medium">Statut</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((campaign) => (
                  <tr key={campaign.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-2.5 px-2 text-slate-200 font-medium">{campaign.name}</td>
                    <td className="py-2.5 px-2 text-slate-400">{campaign.type}</td>
                    <td className="py-2.5 px-2">
                      <span className="flex items-center gap-1">
                        {campaign.operator === 'Orange' && <span className="h-2 w-2 rounded-full bg-[#FF7900]" />}
                        {campaign.operator === 'MTN' && <span className="h-2 w-2 rounded-full bg-[#FFCC00]" />}
                        {campaign.operator === 'Celcom' && <span className="h-2 w-2 rounded-full bg-[#00B4D8]" />}
                        {campaign.operator === 'Multi' && <span className="h-2 w-2 rounded-full bg-[#D4A843]" />}
                        <span className="text-slate-300">{campaign.operator}</span>
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-slate-400">{campaign.region}</td>
                    <td className="py-2.5 px-2 text-slate-400 font-mono">{campaign.date}</td>
                    <td className="py-2.5 px-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        campaign.status === 'completed'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : campaign.status === 'in_progress'
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {campaign.status === 'completed' ? 'Terminée' : campaign.status === 'in_progress' ? 'En cours' : 'Planifiée'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Drive Test Map Placeholder */}
        <div className="lg:col-span-2 relative overflow-hidden rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 p-5">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#3B82F6] to-transparent opacity-60" />
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Car className="h-4 w-4 text-[#3B82F6]" />
            Drive Test - Conakry
          </h2>
          <div className="relative h-64 rounded-lg bg-[#0A0F1E] border border-white/5 overflow-hidden flex items-center justify-center">
            {/* Grid background */}
            <div className="absolute inset-0" style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }} />
            {/* Simulated route */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 300 250">
              <path
                d="M 40 200 L 80 180 L 120 160 L 150 120 L 180 100 L 200 80 L 240 60 L 260 80"
                fill="none"
                stroke="#3B82F6"
                strokeWidth="2"
                strokeDasharray="6 3"
                opacity="0.6"
              />
              <path
                d="M 60 220 L 100 190 L 140 170 L 160 140 L 190 110 L 220 90"
                fill="none"
                stroke="#FF7900"
                strokeWidth="2"
                strokeDasharray="6 3"
                opacity="0.6"
              />
              {/* Waypoints */}
              {[
                { x: 80, y: 180, color: '#3B82F6' },
                { x: 150, y: 120, color: '#3B82F6' },
                { x: 240, y: 60, color: '#3B82F6' },
                { x: 100, y: 190, color: '#FF7900' },
                { x: 190, y: 110, color: '#FF7900' },
              ].map((pt, i) => (
                <circle key={i} cx={pt.x} cy={pt.y} r="4" fill={pt.color} opacity="0.8" />
              ))}
              {/* Start/End markers */}
              <circle cx="40" cy="200" r="6" fill="#10B981" stroke="#0A0F1E" strokeWidth="2" />
              <circle cx="260" cy="80" r="6" fill="#EF4444" stroke="#0A0F1E" strokeWidth="2" />
            </svg>
            <div className="absolute bottom-2 left-2 flex items-center gap-3 text-[9px]">
              <span className="flex items-center gap-1 text-blue-400"><span className="h-1 w-4 bg-blue-400 rounded" /> Route Orange</span>
              <span className="flex items-center gap-1 text-[#FF7900]"><span className="h-1 w-4 bg-[#FF7900] rounded" /> Route MTN</span>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
            <MapPin className="h-3 w-3" />
            <span>Conakry - Kaloum • 42 points de mesure</span>
          </div>
        </div>
      </div>

      {/* Test Results + Benchmark */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Test Results */}
        <div className="relative overflow-hidden rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 p-5">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#10B981] to-transparent opacity-60" />
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">Derniers Résultats de Test</h2>
          <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar pr-1">
            {auditResults.map((result) => (
              <div
                key={result.id}
                className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5"
              >
                <div className="flex items-center gap-3">
                  {result.status === 'pass' ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-400" />
                  )}
                  <div>
                    <p className="text-xs font-medium text-slate-200">
                      {result.metric} - {result.operator}
                    </p>
                    <p className="text-[10px] text-slate-500">Seuil: {result.threshold}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-xs font-mono ${result.status === 'pass' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {result.value}
                  </p>
                  <p className={`text-[10px] font-medium ${result.status === 'pass' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {result.status === 'pass' ? 'CONFORME' : 'NON CONFORME'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Benchmark Summary */}
        <div className="relative overflow-hidden rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 p-5">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#D4A843] to-transparent opacity-60" />
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">Résumé Benchmark - Dernier Audit</h2>
          <div className="space-y-4">
            {['Latence', 'Débit', 'Taux Appel', 'Jitter', 'Disponibilité'].map((metric) => {
              const opData = operators.map((op) => {
                const val = metric === 'Latence' ? (op.id === 'orange' ? 38 : op.id === 'mtn' ? 45 : 55)
                  : metric === 'Débit' ? (op.id === 'orange' ? 22 : op.id === 'mtn' ? 18 : 12)
                  : metric === 'Taux Appel' ? (op.id === 'orange' ? 96 : op.id === 'mtn' ? 93 : 89)
                  : metric === 'Jitter' ? (op.id === 'orange' ? 6 : op.id === 'mtn' ? 9 : 14)
                  : (op.id === 'orange' ? 99.2 : op.id === 'mtn' ? 98.5 : 97.1);
                return { name: op.name, value: val, color: op.color };
              });

              const maxVal = Math.max(...opData.map((d) => d.value));

              return (
                <div key={metric}>
                  <p className="text-xs text-slate-400 mb-2">{metric}</p>
                  <div className="space-y-1">
                    {opData.map((d) => (
                      <div key={d.name} className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500 w-12">{d.name.split(' ')[0]}</span>
                        <div className="flex-1 h-2.5 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${(d.value / maxVal) * 100}%`,
                              backgroundColor: d.color,
                              opacity: 0.8,
                            }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-300 font-mono w-12 text-right">{d.value}{metric === 'Taux Appel' || metric === 'Disponibilité' ? '%' : metric === 'Débit' ? 'Mb' : 'ms'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
