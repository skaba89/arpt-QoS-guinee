'use client';

import { useState, useEffect } from 'react';
import { FileText, Download, Calendar, Clock, FileSpreadsheet, Globe, Shield, BarChart3, Award, CheckCircle2, Loader2, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthGuard } from '@/hooks/use-auth-guard';

interface ReportData { id: string; titre: string; type: string; date: string; format: string; size: string; statut: string; isPublic: boolean }

export function DashboardReports() {
  const { isAuthorized, isLoading: authLoading } = useAuthGuard('ANALYSTE_QOS');
  const [reports, setReports] = useState<ReportData[]>([]);
  const [generating, setGenerating] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/reports');
        if (res.ok) {
          const data = await res.json();
          setReports(data.data || []);
        }
      } catch (err) {
        console.error('Reports fetch error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleGenerate = async (id: string, name: string) => {
    setGenerating(id);
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titre: name,
          type: 'INTERNE',
          format: 'PDF',
          isPublic: false,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        toast.success(`Rapport "${name}" généré avec succès`);
        // Add the new report to the list
        const newReport: ReportData = {
          id: data.report?.id || id,
          titre: name,
          type: data.report?.type || 'INTERNE',
          date: new Date().toISOString().split('T')[0],
          format: data.report?.format || 'PDF',
          size: '—',
          statut: 'ready',
          isPublic: false,
        };
        setReports((prev) => [newReport, ...prev]);
      } else {
        toast.error('Erreur lors de la génération du rapport');
      }
    } catch {
      toast.error('Erreur de connexion au serveur');
    } finally {
      setGenerating(null);
    }
  };

  const handleTemplateGenerate = (templateName: string, templateType: string) => {
    const id = `template-${templateName.replace(/\s+/g, '-').toLowerCase()}`;
    handleGenerate(id, templateName);
  };

  const handleDownload = async (report: ReportData) => {
    // Fetch real data from the dashboard API for the CSV export
    try {
      const dashRes = await fetch('/api/dashboard');
      if (!dashRes.ok) {
        toast.error('Erreur lors du chargement des données');
        return;
      }
      const data = await dashRes.json();

      // Build CSV with real data
      const lines: string[] = [
        `Rapport: ${report.titre}`,
        `Type: ${report.type}`,
        `Date: ${report.date}`,
        `Format: ${report.format}`,
        `Généré par: ONIT-PNG — Observatoire National Intelligent des Télécommunications`,
        `République de Guinée — ARPT`,
        '',
        '=== INDICATEURS CLÉS ===',
        '',
        `Couverture Nationale;${data.kpis?.couvertureNationale?.value ?? '-'};%`,
        `Score QoS Global;${data.kpis?.scoreQosGlobal?.value ?? '-'};/100`,
        `Zones Blanches;${data.kpis?.zonesBlanches?.value ?? '-'}`,
        `Population Couverte;${data.kpis?.populationCouverte?.value ?? '-'};M`,
        `Conformité SLA;${data.slaCompliance?.global ?? '-'};%`,
        '',
        '=== SCORES OPÉRATEURS ===',
        '',
        'Opérateur;Score Global;Couverture;QoS;QoE;Conformité;Tendance',
        ...(data.operators || []).map((op: { name: string; score: number; subscores: { couverture: number; qos: number; qoe: number; conformite: number }; trend: number }) =>
          `${op.name};${op.score};${op.subscores?.couverture ?? '-'};${op.subscores?.qos ?? '-'};${op.subscores?.qoe ?? '-'};${op.subscores?.conformite ?? '-'};${op.trend > 0 ? '+' : ''}${op.trend}`
        ),
        '',
        '=== DONNÉES RÉGIONALES ===',
        '',
        'Région;Couverture (%);Score QoS;Population;Zones Blanches',
        ...(data.regions || []).map((r: { name: string; coverage: number; qos: number; population: number; whiteZones: number }) =>
          `${r.name};${r.coverage};${r.qos};${r.population};${r.whiteZones}`
        ),
        '',
        '=== CONFORMITÉ SLA PAR OPÉRATEUR ===',
        '',
        ...Object.entries(data.slaCompliance?.operators || {}).map(([code, score]) =>
          `${code};${score}%`
        ),
      ];

      const content = lines.join('\n');
      const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${report.titre.replace(/\s+/g, '_')}_${report.date}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`Téléchargement de "${report.titre}" lancé`);
    } catch {
      toast.error('Erreur lors de la génération du téléchargement');
    }
  };

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
      {/* ── Page Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title text-2xl">Rapports</h1>
          <p className="text-sm text-slate-400 -mt-1">Génération, planification et gestion des rapports</p>
        </div>
      </div>

      {/* ── Template Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {reportTemplates.map((template) => {
          const icons: Record<string, React.ReactNode> = { FileText: <FileText className="h-5 w-5 text-[#D4A843]" />, BarChart3: <BarChart3 className="h-5 w-5 text-[#D4A843]" />, Award: <Award className="h-5 w-5 text-[#D4A843]" />, Globe: <Globe className="h-5 w-5 text-[#D4A843]" />, FileSpreadsheet: <FileSpreadsheet className="h-5 w-5 text-[#D4A843]" />, Shield: <Shield className="h-5 w-5 text-[#D4A843]" /> };
          const templateId = `template-${template.name.replace(/\s+/g, '-').toLowerCase()}`;
          const isGenerating = generating === templateId;
          return (
            <div
              key={template.name}
              onClick={() => !generating && handleTemplateGenerate(template.name, template.type)}
              className="institutional-card guinea-stripe-top text-center cursor-pointer group p-4"
            >
              <div className="p-2 rounded-lg bg-white/5 inline-flex mb-2">
                {isGenerating ? <Loader2 className="h-5 w-5 text-[#D4A843] animate-spin" /> : (icons[template.icon] || <FileText className="h-5 w-5 text-[#D4A843]" />)}
              </div>
              <p className="text-xs font-medium text-slate-200">{template.name}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">{template.type}</p>
            </div>
          );
        })}
      </div>

      {/* ── Reports Table + Sidebar ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 institutional-card guinea-stripe-top">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-semibold text-[#D4A843] uppercase tracking-widest flex items-center gap-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#CE1126]" />
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#FCD116]" />
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#009460]" />
              Rapports Récents
            </h2>
            <span className="text-xs text-slate-500">{reports.length} rapports</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-2.5 px-2 text-[#D4A843]/80 font-semibold">Titre</th>
                  <th className="text-left py-2.5 px-2 text-[#D4A843]/80 font-semibold">Type</th>
                  <th className="text-left py-2.5 px-2 text-[#D4A843]/80 font-semibold">Date</th>
                  <th className="text-left py-2.5 px-2 text-[#D4A843]/80 font-semibold">Format</th>
                  <th className="text-left py-2.5 px-2 text-[#D4A843]/80 font-semibold">Taille</th>
                  <th className="text-left py-2.5 px-2 text-[#D4A843]/80 font-semibold">Statut</th>
                  <th className="text-left py-2.5 px-2 text-[#D4A843]/80 font-semibold"></th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={report.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-2.5 px-2"><div className="flex items-center gap-2"><FileText className="h-3.5 w-3.5 text-slate-500" /><span className="text-slate-200 font-medium">{report.titre}</span></div></td>
                    <td className="py-2.5 px-2"><span className="text-slate-400">{report.type}</span></td>
                    <td className="py-2.5 px-2 text-slate-400 font-mono">{report.date}</td>
                    <td className="py-2.5 px-2"><span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${report.format === 'PDF' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>{report.format}</span></td>
                    <td className="py-2.5 px-2 text-slate-400 font-mono">{report.size}</td>
                    <td className="py-2.5 px-2"><span className={`inline-flex items-center gap-1 text-[10px] font-medium ${report.statut === 'ready' ? 'text-emerald-400' : 'text-blue-400'}`}>{report.statut === 'generating' && <Loader2 className="h-3 w-3 animate-spin" />}{report.statut === 'ready' ? 'Prêt' : 'Génération'}</span></td>
                    <td className="py-2.5 px-2">{report.statut === 'ready' && (
                      <button
                        onClick={() => handleDownload(report)}
                        className="p-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-slate-400 hover:text-[#D4A843]"
                        title="Télécharger"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </button>
                    )}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4">
          {/* ── Quick Generation ── */}
          <div className="institutional-card guinea-stripe-top p-5">
            <h3 className="text-xs font-semibold text-[#D4A843] uppercase tracking-widest mb-3 flex items-center gap-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#CE1126]" />
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#FCD116]" />
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#009460]" />
              <FileText className="h-4 w-4 text-[#D4A843]" />Génération Rapide
            </h3>
            <div className="space-y-2">
              {[{ name: 'Rapport QoS Trimestriel', id: 'qos-tri' }, { name: 'Score Card Mensuel', id: 'score-monthly' }, { name: 'Benchmark Opérateurs', id: 'benchmark' }, { name: 'Export Données Brutes', id: 'raw-export' }].map((item) => (
                <button key={item.id} onClick={() => handleGenerate(item.id, item.name)} disabled={generating !== null} className="w-full flex items-center justify-between p-2.5 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all text-left disabled:opacity-50">
                  <span className="text-xs text-slate-300">{item.name}</span>
                  {generating === item.id ? <Loader2 className="h-3.5 w-3.5 text-[#D4A843] animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5 text-slate-600" />}
                </button>
              ))}
            </div>
          </div>

          {/* ── Scheduling ── */}
          <div className="institutional-card guinea-stripe-top p-5">
            <h3 className="text-xs font-semibold text-[#D4A843] uppercase tracking-widest mb-3 flex items-center gap-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#CE1126]" />
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#FCD116]" />
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#009460]" />
              <Calendar className="h-4 w-4 text-[#D4A843]" />Planification
            </h3>
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
