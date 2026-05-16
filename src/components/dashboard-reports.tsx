'use client';

import { useState, useEffect } from 'react';
import { FileText, Download, Calendar, Clock, FileSpreadsheet, Globe, Shield, BarChart3, Award, CheckCircle2, Loader2 } from 'lucide-react';

interface ReportData { id: string; titre: string; type: string; date: string; format: string; size: string; statut: string; isPublic: boolean }

export function DashboardReports() {
  const [reports, setReports] = useState<ReportData[]>([]);
  const [generating, setGenerating] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/reports');
        if (res.ok) {
          const data = await res.json();
          setReports(data.reports || []);
        }
      } catch (err) {
        console.error('Reports fetch error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleGenerate = (id: string) => {
    setGenerating(id);
    setTimeout(() => setGenerating(null), 2000);
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-xs text-slate-500 animate-pulse">Chargement rapports...</div></div>;

  const reportTemplates = [
    { name: 'Rapport QoS Trimestriel', type: 'Réglementaire', icon: 'FileText' },
    { name: 'Benchmark Opérateurs', type: 'Comparatif', icon: 'BarChart3' },
    { name: 'Score Card Mensuel', type: 'Opérateur', icon: 'Award' },
    { name: 'Rapport Public Annuel', type: 'Public', icon: 'Globe' },
    { name: 'Export Données Brutes', type: 'Excel', icon: 'FileSpreadsheet' },
    { name: 'Rapport Cybersécurité', type: 'Sécurité', icon: 'Shield' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-slate-50">Rapports</h1><p className="text-sm text-slate-400 mt-1">Génération, planification et gestion des rapports</p></div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {reportTemplates.map((template) => {
          const icons: Record<string, React.ReactNode> = { FileText: <FileText className="h-5 w-5 text-[#D4A843]" />, BarChart3: <BarChart3 className="h-5 w-5 text-[#3B82F6]" />, Award: <Award className="h-5 w-5 text-[#10B981]" />, Globe: <Globe className="h-5 w-5 text-[#8B5CF6]" />, FileSpreadsheet: <FileSpreadsheet className="h-5 w-5 text-[#F59E0B]" />, Shield: <Shield className="h-5 w-5 text-[#EF4444]" /> };
          return (
            <div key={template.name} className="relative overflow-hidden rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 p-4 text-center transition-all hover:bg-white/[0.08] hover:border-white/20 cursor-pointer group">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#D4A843] to-transparent opacity-0 group-hover:opacity-60 transition-opacity" />
              <div className="p-2 rounded-lg bg-white/5 inline-flex mb-2">{icons[template.icon] || <FileText className="h-5 w-5 text-[#D4A843]" />}</div>
              <p className="text-xs font-medium text-slate-200">{template.name}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">{template.type}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 relative overflow-hidden rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 p-5">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#D4A843] to-transparent opacity-60" />
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Rapports Récents</h2>
            <span className="text-xs text-slate-500">{reports.length} rapports</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="border-b border-white/10"><th className="text-left py-2.5 px-2 text-slate-400 font-medium">Titre</th><th className="text-left py-2.5 px-2 text-slate-400 font-medium">Type</th><th className="text-left py-2.5 px-2 text-slate-400 font-medium">Date</th><th className="text-left py-2.5 px-2 text-slate-400 font-medium">Format</th><th className="text-left py-2.5 px-2 text-slate-400 font-medium">Taille</th><th className="text-left py-2.5 px-2 text-slate-400 font-medium">Statut</th><th className="text-left py-2.5 px-2 text-slate-400 font-medium"></th></tr></thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={report.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-2.5 px-2"><div className="flex items-center gap-2"><FileText className="h-3.5 w-3.5 text-slate-500" /><span className="text-slate-200 font-medium">{report.titre}</span></div></td>
                    <td className="py-2.5 px-2"><span className="text-slate-400">{report.type}</span></td>
                    <td className="py-2.5 px-2 text-slate-400 font-mono">{report.date}</td>
                    <td className="py-2.5 px-2"><span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${report.format === 'PDF' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>{report.format}</span></td>
                    <td className="py-2.5 px-2 text-slate-400 font-mono">{report.size}</td>
                    <td className="py-2.5 px-2"><span className={`inline-flex items-center gap-1 text-[10px] font-medium ${report.statut === 'ready' ? 'text-emerald-400' : 'text-blue-400'}`}>{report.statut === 'generating' && <Loader2 className="h-3 w-3 animate-spin" />}{report.statut === 'ready' ? 'Prêt' : 'Génération'}</span></td>
                    <td className="py-2.5 px-2">{report.statut === 'ready' && (<button className="p-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-slate-400 hover:text-[#D4A843]"><Download className="h-3.5 w-3.5" /></button>)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4">
          <div className="relative overflow-hidden rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 p-5">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#D4A843]" />
            <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2"><FileText className="h-4 w-4 text-[#D4A843]" />Génération Rapide</h3>
            <div className="space-y-2">
              {[{ name: 'Rapport QoS Trimestriel', id: 'qos-tri' }, { name: 'Score Card Mensuel', id: 'score-monthly' }, { name: 'Benchmark Opérateurs', id: 'benchmark' }, { name: 'Export Données Brutes', id: 'raw-export' }].map((item) => (
                <button key={item.id} onClick={() => handleGenerate(item.id)} disabled={generating !== null} className="w-full flex items-center justify-between p-2.5 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all text-left disabled:opacity-50">
                  <span className="text-xs text-slate-300">{item.name}</span>
                  {generating === item.id ? <Loader2 className="h-3.5 w-3.5 text-[#D4A843] animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5 text-slate-600" />}
                </button>
              ))}
            </div>
          </div>

          <div className="relative overflow-hidden rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 p-5">
            <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2"><Calendar className="h-4 w-4 text-[#3B82F6]" />Planification</h3>
            <div className="space-y-3 text-xs">
              {[{ label: 'Rapport QoS Trimestriel', schedule: 'Tous les trimestres', next: '30 Juin 2026' }, { label: 'Score Card Mensuel', schedule: '1er de chaque mois', next: '1er Mai 2026' }, { label: 'Rapport Public Annuel', schedule: 'Annuel', next: '31 Déc 2026' }].map((item) => (
                <div key={item.label} className="p-2.5 rounded-lg bg-white/5 border border-white/5">
                  <p className="text-slate-200 font-medium">{item.label}</p>
                  <div className="flex items-center gap-1 mt-1"><Clock className="h-3 w-3 text-slate-500" /><span className="text-slate-500">{item.schedule}</span></div>
                  <p className="text-[10px] text-[#D4A843] mt-1">Prochain: {item.next}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
