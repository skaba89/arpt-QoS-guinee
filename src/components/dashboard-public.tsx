'use client';

import { useState, useEffect } from 'react';
import { Globe, Signal, Activity, Users, Wifi, FileText, AlertCircle, ChevronDown, ChevronUp, Send } from 'lucide-react';
import { GuineaMapLeaflet } from './guinea-map-leaflet';

interface MapRegionData { code: string; nom: string; centreLat: number; centreLng: number; population: number; coverage: number; qos: number; color: string; whiteZones: number }
interface MapPointData { lat: number; lng: number; operator: string; operatorColor: string; rssi: number | null; scoreQoE: number | null }
interface MapOperatorData { id: string; name: string; code: string; color: string }
interface OperatorScore { id: string; name: string; code: string; color: string; score: number; subscores: { couverture: number; qos: number; qoe: number; conformite: number } }
interface ReportData { id: string; titre: string; type: string; date: string; format: string; isPublic: boolean }

const faqData = [
  { q: 'Comment la qualité du réseau est-elle mesurée ?', a: "La QoS est mesurée via des tests automatisés (drive tests, walk tests) et des données collectées en temps réel auprès des opérateurs, conformément aux standards de l'UIT." },
  { q: "Qu'est-ce qu'une zone blanche ?", a: "Une zone blanche est une zone géographique sans couverture mobile ou internet d'aucun opérateur. L'ARPT travaille à réduire ces zones." },
  { q: 'Comment signaler un problème de réseau ?', a: "Vous pouvez utiliser le formulaire \"Signaler un problème\" sur ce portail, ou contacter l'ARPT par téléphone au +224 xxx xxxx." },
  { q: 'À quelle fréquence les données sont-elles mises à jour ?', a: 'Les indicateurs de QoS sont mis à jour en temps réel. Les rapports détaillés sont publiés trimestriellement.' },
  { q: 'Quels sont les seuils réglementaires ?', a: "Les seuils sont définis par les spécifications techniques de l'ARPT : latence <50ms, débit >15Mbps, taux d'appel réussi >90%." },
];

export function DashboardPublic() {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [problemForm, setProblemForm] = useState({ name: '', phone: '', operator: '', region: '', description: '' });
  const [mapData, setMapData] = useState<{ regions: MapRegionData[]; measurementPoints: MapPointData[]; operators: MapOperatorData[] } | null>(null);
  const [operators, setOperators] = useState<OperatorScore[]>([]);
  const [reports, setReports] = useState<ReportData[]>([]);
  const [kpis, setKpis] = useState({ coverage: 67, qos: 72, pop: 8.2, zones: 234 });

  useEffect(() => {
    async function fetchData() {
      try {
        const [dashRes, mapRes, scoreRes, reportRes] = await Promise.all([
          fetch('/api/dashboard'),
          fetch('/api/map'),
          fetch('/api/scoring'),
          fetch('/api/reports'),
        ]);
        if (dashRes.ok) {
          const d = await dashRes.json();
          setKpis({
            coverage: d.kpis?.couvertureNationale?.value || 67,
            qos: d.kpis?.scoreQosGlobal?.value || 72,
            pop: d.kpis?.populationCouverte?.value || 8.2,
            zones: d.kpis?.zonesBlanches?.value || 234,
          });
        }
        if (mapRes.ok) setMapData(await mapRes.json());
        if (scoreRes.ok) {
          const sd = await scoreRes.json();
          setOperators(sd.operators?.map((op: OperatorScore & { subscores: { couverture: number; qos: number; qoe: number; conformite: number } }) => ({
            id: op.id, name: op.name, code: op.code, color: op.color, score: op.score,
            subscores: { couverture: op.subscores?.couverture || 0, qos: op.subscores?.qos || 0, qoe: op.subscores?.qoe || 0, conformite: op.subscores?.conformite || 0 },
          })) || []);
        }
        if (reportRes.ok) {
          const rd = await reportRes.json();
          setReports(rd.reports?.filter((r: ReportData) => r.isPublic) || []);
        }
      } catch (err) {
        console.error('Public fetch error:', err);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0A0F1E] via-[#111827] to-[#0A0F1E] border border-white/10 p-8 md:p-12">
        <div className="absolute top-0 right-0 h-64 w-64 rounded-full bg-[#D4A843]/5 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-48 w-48 rounded-full bg-[#3B82F6]/5 blur-3xl" />
        <div className="relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D4A843]/10 border border-[#D4A843]/20 text-[#D4A843] text-xs font-medium mb-4"><Globe className="h-3.5 w-3.5" />Portail de Transparence</div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-50 mb-3">Observatoire National des Télécommunications</h1>
          <p className="text-lg text-[#D4A843] font-medium mb-2">République de Guinée</p>
          <p className="text-sm text-slate-400 max-w-2xl mx-auto">Données transparentes sur la qualité de service, la couverture réseau et les performances des opérateurs de télécommunications en Guinée</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Couverture Nationale', value: `${kpis.coverage}%`, icon: Signal, color: '#10B981' },
          { label: 'Score Qualité Global', value: `${kpis.qos}/100`, icon: Activity, color: '#3B82F6' },
          { label: 'Population Couverte', value: `${kpis.pop}M`, icon: Users, color: '#D4A843' },
          { label: 'Zones Blanches', value: `${kpis.zones}`, icon: Wifi, color: '#EF4444' },
        ].map((kpi) => (
          <div key={kpi.label} className="relative overflow-hidden rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 p-5 text-center">
            <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ backgroundColor: kpi.color }} />
            <kpi.icon className="h-6 w-6 mx-auto mb-2" style={{ color: kpi.color }} />
            <p className="text-2xl font-bold text-slate-50">{kpi.value}</p>
            <p className="text-xs text-slate-400 mt-1">{kpi.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="relative overflow-hidden rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 p-5">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#D4A843] to-transparent opacity-60" />
          <h2 className="text-sm font-semibold text-slate-300 mb-4">Couverture par Région</h2>
          <GuineaMapLeaflet metric="coverage" regionData={mapData?.regions || []} measurementPoints={mapData?.measurementPoints || []} operators={mapData?.operators || []} />
        </div>

        <div className="relative overflow-hidden rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 p-5">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#3B82F6] to-transparent opacity-60" />
          <h2 className="text-sm font-semibold text-slate-300 mb-4">Comparaison Opérateurs</h2>
          <div className="space-y-4">
            {operators.map((op) => (
              <div key={op.id} className="p-4 rounded-lg bg-white/5 border border-white/5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full" style={{ backgroundColor: op.color }} /><span className="text-sm font-semibold text-slate-200">{op.name}</span></div>
                  <span className="text-lg font-bold text-slate-50">{op.score}/100</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-2"><div className="h-full rounded-full transition-all duration-700" style={{ width: `${op.score}%`, backgroundColor: op.color }} /></div>
                <div className="grid grid-cols-4 gap-2 text-center">
                  {[{ label: 'Couv.', val: op.subscores.couverture }, { label: 'QoS', val: op.subscores.qos }, { label: 'QoE', val: op.subscores.qoe }, { label: 'Conf.', val: op.subscores.conformite }].map((sub) => (
                    <div key={sub.label}><p className="text-xs font-semibold text-slate-300">{sub.val}</p><p className="text-[9px] text-slate-500">{sub.label}</p></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 p-5">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#D4A843] to-transparent opacity-60" />
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">Derniers Rapports Publics</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {reports.slice(0, 3).map((report) => (
            <div key={report.id} className="p-4 rounded-lg bg-white/5 border border-white/5 hover:bg-white/[0.08] transition-all cursor-pointer group">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20"><FileText className="h-4 w-4 text-red-400" /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-200 group-hover:text-[#D4A843] transition-colors truncate">{report.titre}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{report.type} • {report.date}</p>
                  <p className="text-[10px] text-slate-500">{report.format}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="relative overflow-hidden rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 p-5">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#10B981] to-transparent opacity-60" />
          <h2 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2"><AlertCircle className="h-4 w-4 text-emerald-400" />Signaler un Problème</h2>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-[10px] text-slate-500 mb-1 block">Nom complet</label><input type="text" value={problemForm.name} onChange={(e) => setProblemForm({ ...problemForm, name: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-200 focus:outline-none focus:border-[#D4A843]/40" placeholder="Votre nom" /></div>
              <div><label className="text-[10px] text-slate-500 mb-1 block">Téléphone</label><input type="text" value={problemForm.phone} onChange={(e) => setProblemForm({ ...problemForm, phone: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-200 focus:outline-none focus:border-[#D4A843]/40" placeholder="+224 xxx xxxx" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-[10px] text-slate-500 mb-1 block">Opérateur</label><select value={problemForm.operator} onChange={(e) => setProblemForm({ ...problemForm, operator: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-200 focus:outline-none focus:border-[#D4A843]/40"><option value="">Sélectionner</option>{operators.map((op) => (<option key={op.id} value={op.id}>{op.name}</option>))}</select></div>
              <div><label className="text-[10px] text-slate-500 mb-1 block">Région</label><select value={problemForm.region} onChange={(e) => setProblemForm({ ...problemForm, region: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-200 focus:outline-none focus:border-[#D4A843]/40"><option value="">Sélectionner</option>{(mapData?.regions || []).map((r) => (<option key={r.code} value={r.code}>{r.nom}</option>))}</select></div>
            </div>
            <div><label className="text-[10px] text-slate-500 mb-1 block">Description du problème</label><textarea value={problemForm.description} onChange={(e) => setProblemForm({ ...problemForm, description: e.target.value })} rows={3} className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-200 focus:outline-none focus:border-[#D4A843]/40 resize-none" placeholder="Décrivez le problème rencontré..." /></div>
            <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-[#D4A843] to-[#10B981] text-sm font-semibold text-[#0A0F1E] hover:opacity-90 transition-opacity"><Send className="h-4 w-4" />Envoyer le Signalement</button>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 p-5">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#3B82F6] to-transparent opacity-60" />
          <h2 className="text-sm font-semibold text-slate-300 mb-4">Questions Fréquentes</h2>
          <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar pr-1">
            {faqData.map((faq, i) => (
              <div key={i} className="rounded-lg bg-white/5 border border-white/5 overflow-hidden">
                <button onClick={() => setExpandedFaq(expandedFaq === i ? null : i)} className="w-full flex items-center justify-between p-3 text-left hover:bg-white/5 transition-colors">
                  <span className="text-xs font-medium text-slate-200 pr-2">{faq.q}</span>
                  {expandedFaq === i ? <ChevronUp className="h-3.5 w-3.5 text-slate-500 flex-shrink-0" /> : <ChevronDown className="h-3.5 w-3.5 text-slate-500 flex-shrink-0" />}
                </button>
                {expandedFaq === i && (<div className="px-3 pb-3"><p className="text-xs text-slate-400 leading-relaxed">{faq.a}</p></div>)}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="text-center py-6 border-t border-white/5">
        <p className="text-xs text-slate-500">ARPT Guinée — Autorité de Régulation des Postes et Télécommunications</p>
        <p className="text-[10px] text-slate-600 mt-1">Données mises à jour en temps réel • Conformément aux spécifications techniques ARPT</p>
      </div>
    </div>
  );
}
