'use client';

import { useState, useEffect } from 'react';
import { ClipboardCheck, MapPin, CheckCircle2, XCircle, Clock, Car } from 'lucide-react';

interface CampaignData {
  id: string; name: string; type: string; operator: string; operatorCode: string; operatorColor: string; region: string; date: string; statut: string; responsable: string;
}

const statusLabels: Record<string, string> = { TERMINEE: 'Terminée', EN_COURS: 'En cours', PLANIFIEE: 'Planifiée', ANNULEE: 'Annulée' };
const statusStyles: Record<string, string> = { TERMINEE: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', EN_COURS: 'bg-blue-500/10 text-blue-400 border-blue-500/20', PLANIFIEE: 'bg-amber-500/10 text-amber-400 border-amber-500/20' };

const auditResults = [
  { id: '1', metric: 'Latence', operator: 'Orange', value: '38ms', threshold: '<50ms', status: 'pass' as const },
  { id: '2', metric: 'Latence', operator: 'MTN', value: '45ms', threshold: '<50ms', status: 'pass' as const },
  { id: '3', metric: 'Latence', operator: 'Celcom', value: '55ms', threshold: '<50ms', status: 'fail' as const },
  { id: '4', metric: 'Débit', operator: 'Orange', value: '22Mbps', threshold: '>15Mbps', status: 'pass' as const },
  { id: '5', metric: 'Débit', operator: 'MTN', value: '18Mbps', threshold: '>15Mbps', status: 'pass' as const },
  { id: '6', metric: 'Débit', operator: 'Celcom', value: '12Mbps', threshold: '>15Mbps', status: 'fail' as const },
  { id: '7', metric: 'Taux Appel', operator: 'Orange', value: '96%', threshold: '>90%', status: 'pass' as const },
  { id: '8', metric: 'Taux Appel', operator: 'MTN', value: '93%', threshold: '>90%', status: 'pass' as const },
  { id: '9', metric: 'Taux Appel', operator: 'Celcom', value: '89%', threshold: '>90%', status: 'fail' as const },
];

export function DashboardAudit() {
  const [campaigns, setCampaigns] = useState<CampaignData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/campaigns');
        if (res.ok) {
          const data = await res.json();
          setCampaigns(data.campaigns || []);
        }
      } catch (err) {
        console.error('Campaigns fetch error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const activeCampaigns = campaigns.filter((c) => c.statut === 'EN_COURS').length;
  const completedCampaigns = campaigns.filter((c) => c.statut === 'TERMINEE').length;
  const plannedCampaigns = campaigns.filter((c) => c.statut === 'PLANIFIEE').length;

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-xs text-slate-500 animate-pulse">Chargement des campagnes...</div></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-slate-50">Audit Terrain</h1><p className="text-sm text-slate-400 mt-1">Gestion des campagnes d&apos;audit et tests terrain</p></div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="relative overflow-hidden rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 p-5"><div className="absolute top-0 left-0 right-0 h-[2px] bg-[#3B82F6]" /><div className="flex items-center gap-3"><div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20"><Clock className="h-5 w-5 text-blue-400" /></div><div><p className="text-3xl font-bold text-slate-50">{activeCampaigns}</p><p className="text-xs text-slate-400">En cours</p></div></div></div>
        <div className="relative overflow-hidden rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 p-5"><div className="absolute top-0 left-0 right-0 h-[2px] bg-[#10B981]" /><div className="flex items-center gap-3"><div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20"><CheckCircle2 className="h-5 w-5 text-emerald-400" /></div><div><p className="text-3xl font-bold text-slate-50">{completedCampaigns}</p><p className="text-xs text-slate-400">Complétées</p></div></div></div>
        <div className="relative overflow-hidden rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 p-5"><div className="absolute top-0 left-0 right-0 h-[2px] bg-[#F59E0B]" /><div className="flex items-center gap-3"><div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20"><ClipboardCheck className="h-5 w-5 text-amber-400" /></div><div><p className="text-3xl font-bold text-slate-50">{plannedCampaigns}</p><p className="text-xs text-slate-400">Planifiées</p></div></div></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 relative overflow-hidden rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 p-5">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#D4A843] to-transparent opacity-60" />
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">Liste des Campagnes</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="border-b border-white/10"><th className="text-left py-2.5 px-2 text-slate-400 font-medium">Campagne</th><th className="text-left py-2.5 px-2 text-slate-400 font-medium">Type</th><th className="text-left py-2.5 px-2 text-slate-400 font-medium">Opérateur</th><th className="text-left py-2.5 px-2 text-slate-400 font-medium">Région</th><th className="text-left py-2.5 px-2 text-slate-400 font-medium">Date</th><th className="text-left py-2.5 px-2 text-slate-400 font-medium">Statut</th></tr></thead>
              <tbody>
                {campaigns.map((campaign) => (
                  <tr key={campaign.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-2.5 px-2 text-slate-200 font-medium">{campaign.name}</td>
                    <td className="py-2.5 px-2 text-slate-400">{campaign.type}</td>
                    <td className="py-2.5 px-2"><span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: campaign.operatorColor }} /><span className="text-slate-300">{campaign.operator}</span></span></td>
                    <td className="py-2.5 px-2 text-slate-400">{campaign.region}</td>
                    <td className="py-2.5 px-2 text-slate-400 font-mono">{campaign.date}</td>
                    <td className="py-2.5 px-2"><span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${statusStyles[campaign.statut] || 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>{statusLabels[campaign.statut] || campaign.statut}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-2 relative overflow-hidden rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 p-5">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#3B82F6] to-transparent opacity-60" />
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2"><Car className="h-4 w-4 text-[#3B82F6]" />Drive Test - Conakry</h2>
          <div className="relative h-64 rounded-lg bg-[#0A0F1E] border border-white/5 overflow-hidden flex items-center justify-center">
            <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 300 250">
              <path d="M 40 200 L 80 180 L 120 160 L 150 120 L 180 100 L 200 80 L 240 60 L 260 80" fill="none" stroke="#3B82F6" strokeWidth="2" strokeDasharray="6 3" opacity="0.6" />
              <path d="M 60 220 L 100 190 L 140 170 L 160 140 L 190 110 L 220 90" fill="none" stroke="#FF7900" strokeWidth="2" strokeDasharray="6 3" opacity="0.6" />
              {[{ x: 80, y: 180, color: '#3B82F6' }, { x: 150, y: 120, color: '#3B82F6' }, { x: 240, y: 60, color: '#3B82F6' }, { x: 100, y: 190, color: '#FF7900' }, { x: 190, y: 110, color: '#FF7900' }].map((pt, i) => (<circle key={i} cx={pt.x} cy={pt.y} r="4" fill={pt.color} opacity="0.8" />))}
              <circle cx="40" cy="200" r="6" fill="#10B981" stroke="#0A0F1E" strokeWidth="2" />
              <circle cx="260" cy="80" r="6" fill="#EF4444" stroke="#0A0F1E" strokeWidth="2" />
            </svg>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs text-slate-400"><MapPin className="h-3 w-3" /><span>Conakry - Kaloum • 42 points de mesure</span></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="relative overflow-hidden rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 p-5">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#10B981] to-transparent opacity-60" />
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">Derniers Résultats de Test</h2>
          <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar pr-1">
            {auditResults.map((result) => (
              <div key={result.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                <div className="flex items-center gap-3">
                  {result.status === 'pass' ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <XCircle className="h-4 w-4 text-red-400" />}
                  <div><p className="text-xs font-medium text-slate-200">{result.metric} - {result.operator}</p><p className="text-[10px] text-slate-500">Seuil: {result.threshold}</p></div>
                </div>
                <div className="text-right"><p className={`text-xs font-mono ${result.status === 'pass' ? 'text-emerald-400' : 'text-red-400'}`}>{result.value}</p><p className={`text-[10px] font-medium ${result.status === 'pass' ? 'text-emerald-400' : 'text-red-400'}`}>{result.status === 'pass' ? 'CONFORME' : 'NON CONFORME'}</p></div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative overflow-hidden rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 p-5">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#D4A843] to-transparent opacity-60" />
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">Résumé Benchmark - Dernier Audit</h2>
          <div className="space-y-4">
            {['Latence', 'Débit', 'Taux Appel', 'Jitter', 'Disponibilité'].map((metric) => {
              const opData = [{ name: 'Orange', value: metric === 'Latence' ? 38 : metric === 'Débit' ? 22 : metric === 'Taux Appel' ? 96 : metric === 'Jitter' ? 6 : 99.2, color: '#FF7900' }, { name: 'MTN', value: metric === 'Latence' ? 45 : metric === 'Débit' ? 18 : metric === 'Taux Appel' ? 93 : metric === 'Jitter' ? 9 : 98.5, color: '#FFCC00' }, { name: 'Celcom', value: metric === 'Latence' ? 55 : metric === 'Débit' ? 12 : metric === 'Taux Appel' ? 89 : metric === 'Jitter' ? 14 : 97.1, color: '#00B4D8' }];
              const maxVal = Math.max(...opData.map((d) => d.value));
              return (<div key={metric}><p className="text-xs text-slate-400 mb-2">{metric}</p><div className="space-y-1">{opData.map((d) => (<div key={d.name} className="flex items-center gap-2"><span className="text-[10px] text-slate-500 w-12">{d.name}</span><div className="flex-1 h-2.5 bg-white/5 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${(d.value / maxVal) * 100}%`, backgroundColor: d.color, opacity: 0.8 }} /></div><span className="text-[10px] text-slate-300 font-mono w-12 text-right">{d.value}{metric === 'Taux Appel' || metric === 'Disponibilité' ? '%' : metric === 'Débit' ? 'Mb' : 'ms'}</span></div>))}</div></div>);
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
