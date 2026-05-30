'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Award, BarChart3, Lightbulb, ChevronRight, Lock, Loader2 } from 'lucide-react';
import { CircularGauge, RadarChart, Sparkline } from './mini-chart';
import { useAuthGuard } from '@/hooks/use-auth-guard';

interface OperatorScoreData {
  id: string; name: string; code: string; color: string; score: number; trend: number;
  subscores: { couverture: number; qos: number; qoe: number; conformite: number; innovation: number; investissement: number };
  historicalScores: number[];
  recommendations: { periode: string; text: string }[];
}

const recommendations = [
  { priority: 'high', text: 'Intercel : couverture critique < 40% — plan d\'urgence requis par l\'ARPT', operator: 'Intercel' },
  { priority: 'high', text: 'Celcom doit améliorer la couverture en zone rurale - objectif +15% en 6 mois', operator: 'Celcom' },
  { priority: 'high', text: 'MTN : réduire la latence dans la région de Boké sous le seuil de 50ms', operator: 'MTN' },
  { priority: 'medium', text: "Renforcer l'investissement en infrastructure 4G pour tous les opérateurs", operator: 'Multi' },
  { priority: 'low', text: 'Envisager des partenariats pour le partage de pylônes en zones blanches', operator: 'Multi' },
];

export function DashboardScoring() {
  const { isAuthorized, isLoading: authLoading } = useAuthGuard('ANALYSTE_QOS');
  const [data, setData] = useState<{ operators: OperatorScoreData[]; radarData: { label: string; values: number[] }[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('latest');
  const [periodScores, setPeriodScores] = useState<Record<string, { operateur: string; operateurCode: string; periode: string; scoreGlobal: number; scoreCouverture: number; scoreQoS: number; scoreQoE: number; scoreConformite: number }[]> | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/scoring');
        if (res.ok) setData(await res.json());
        // Also fetch all scores for multi-period comparison
        const scoresRes = await fetch('/api/scores');
        if (scoresRes.ok) {
          const scoresData = await scoresRes.json();
          const grouped: Record<string, typeof scoresData.scores> = {};
          for (const s of scoresData.scores || []) {
            if (!grouped[s.periode]) grouped[s.periode] = [];
            grouped[s.periode].push(s);
          }
          setPeriodScores(grouped);
        }
      } catch (err) {
        console.error('Scoring fetch error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

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

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-xs text-slate-500 animate-pulse">Chargement scoring...</div></div>;

  const operators = data?.operators || [];
  const radarData = data?.radarData || [];

  // Get available periods for comparison
  const availablePeriods = periodScores ? Object.keys(periodScores).sort().reverse() : [];
  const comparisonPeriods = selectedPeriod === 'latest'
    ? availablePeriods.slice(0, 2)
    : [selectedPeriod, availablePeriods.find(p => p < selectedPeriod) || availablePeriods[availablePeriods.indexOf(selectedPeriod) + 1]].filter(Boolean);

  return (
    <div className="space-y-6">
      {/* ── Page Header — Institutional Pattern ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="h-1 w-8 rounded-full bg-gradient-to-r from-[#D4A843] to-transparent" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#D4A843]/70">Analyse</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-50 tracking-tight">Scoring Opérateurs</h1>
          <p className="text-sm text-slate-400 mt-2">Évaluation multi-critères et classement des opérateurs de télécommunications</p>
        </div>
        {/* Multi-period selector */}
        {availablePeriods.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Période :</span>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-lg bg-white/[0.04] border border-white/[0.08] text-slate-300 focus:outline-none focus:border-[#D4A843]/40"
            >
              <option value="latest">Dernière période</option>
              {availablePeriods.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* ── Operator Score Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {operators.map((op) => (
          <div key={op.id} className="institutional-card guinea-stripe-top transition-all duration-300 hover:bg-white/[0.06]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl flex items-center justify-center font-bold text-lg" style={{ backgroundColor: `${op.color}20`, color: op.color }}>{op.name.charAt(0)}</div>
                <div><p className="text-base font-semibold text-slate-100">{op.name}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    {op.trend > 0 ? <TrendingUp className="h-3.5 w-3.5 text-emerald-400" /> : <TrendingDown className="h-3.5 w-3.5 text-red-400" />}
                    <span className={`text-xs font-medium ${op.trend > 0 ? 'text-emerald-400' : 'text-red-400'}`}>{op.trend > 0 ? '+' : ''}{op.trend} pts</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-center mb-4"><CircularGauge value={op.score} color={op.color} size={110} strokeWidth={8} label="/100" /></div>
            <div className="grid grid-cols-2 gap-2">
              {[{ label: 'Couverture', val: op.subscores.couverture }, { label: 'QoS', val: op.subscores.qos }, { label: 'QoE', val: op.subscores.qoe }, { label: 'Conformité', val: op.subscores.conformite }].map((sub) => (
                <div key={sub.label} className="p-2 rounded-lg bg-white/5 border border-white/5">
                  <div className="flex items-center justify-between mb-1"><span className="text-[10px] text-slate-500">{sub.label}</span><span className="text-xs font-semibold text-slate-200">{sub.val}</span></div>
                  <div className="h-1 bg-white/10 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${sub.val}%`, backgroundColor: op.color }} /></div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ── Radar / Historical / Recommendations ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="institutional-card guinea-stripe-top">
          <h2 className="text-xs font-semibold text-[#D4A843] uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#CE1126]" />
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#FCD116]" />
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#009460]" />
            <Award className="h-4 w-4 text-[#D4A843]" />Comparaison Radar
          </h2>
          <div className="flex justify-center"><RadarChart data={radarData} series={operators.map((op) => ({ name: op.name, color: op.color }))} size={240} /></div>
          <div className="flex justify-center gap-4 mt-3">
            {operators.map((op) => (<span key={op.id} className="flex items-center gap-1.5 text-[10px] text-slate-400"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: op.color }} />{op.name.split(' ')[0]}</span>))}
          </div>
        </div>

        <div className="institutional-card guinea-stripe-top">
          <h2 className="text-xs font-semibold text-[#D4A843] uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#CE1126]" />
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#FCD116]" />
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#009460]" />
            <BarChart3 className="h-4 w-4 text-[#D4A843]" />Évolution Historique
          </h2>
          <div className="space-y-4">
            {operators.map((op) => (
              <div key={op.id} className="p-3 rounded-lg bg-white/5 border border-white/5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: op.color }} /><span className="text-xs font-medium text-slate-200">{op.name}</span></div>
                  <span className="text-xs font-mono text-slate-400">{op.historicalScores[0]} → {op.historicalScores[op.historicalScores.length - 1]}</span>
                </div>
                <Sparkline data={op.historicalScores} color={op.color} width={200} height={36} strokeWidth={2} />
              </div>
            ))}
          </div>
        </div>

        <div className="institutional-card guinea-stripe-top">
          <h2 className="text-xs font-semibold text-[#D4A843] uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#CE1126]" />
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#FCD116]" />
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#009460]" />
            <Lightbulb className="h-4 w-4 text-[#D4A843]" />Recommandations IA
          </h2>
          <div className="space-y-3">
            {recommendations.map((rec, i) => (
              <div key={i} className={`p-3 rounded-lg border ${rec.priority === 'high' ? 'bg-red-500/5 border-red-500/20' : rec.priority === 'medium' ? 'bg-amber-500/5 border-amber-500/20' : 'bg-blue-500/5 border-blue-500/20'}`}>
                <div className="flex items-start gap-2">
                  <ChevronRight className={`h-4 w-4 mt-0.5 flex-shrink-0 ${rec.priority === 'high' ? 'text-red-400' : rec.priority === 'medium' ? 'text-amber-400' : 'text-blue-400'}`} />
                  <div>
                    <p className="text-xs text-slate-200 leading-relaxed">{rec.text}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[9px] font-semibold uppercase ${rec.priority === 'high' ? 'text-red-400' : rec.priority === 'medium' ? 'text-amber-400' : 'text-blue-400'}`}>{rec.priority === 'high' ? 'Haute' : rec.priority === 'medium' ? 'Moyenne' : 'Basse'}</span>
                      <span className="text-[9px] text-slate-500">•</span>
                      <span className="text-[9px] text-slate-500">{rec.operator}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Multi-Period Comparison ── */}
      {periodScores && comparisonPeriods.length >= 2 && (
        <div className="institutional-card guinea-stripe-top">
          <h2 className="text-xs font-semibold text-[#D4A843] uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#CE1126]" />
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#FCD116]" />
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#009460]" />
            <BarChart3 className="h-4 w-4 text-[#D4A843]" />
            Comparaison Multi-Périodes
            <span className="text-[10px] text-slate-500 font-normal normal-case">
              {comparisonPeriods[0]} vs {comparisonPeriods[1]}
            </span>
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-2 px-3 text-[#D4A843]/80 font-semibold">Opérateur</th>
                  <th className="text-center py-2 px-2 text-[#D4A843]/80 font-semibold">{comparisonPeriods[0]}</th>
                  <th className="text-center py-2 px-2 text-[#D4A843]/80 font-semibold">{comparisonPeriods[1]}</th>
                  <th className="text-center py-2 px-2 text-[#D4A843]/80 font-semibold">Variation</th>
                  <th className="text-center py-2 px-2 text-[#D4A843]/80 font-semibold">Couv.</th>
                  <th className="text-center py-2 px-2 text-[#D4A843]/80 font-semibold">QoS</th>
                  <th className="text-center py-2 px-2 text-[#D4A843]/80 font-semibold">QoE</th>
                  <th className="text-center py-2 px-2 text-[#D4A843]/80 font-semibold">Conf.</th>
                </tr>
              </thead>
              <tbody>
                {operators.map((op) => {
                  const currentPeriodData = (periodScores[comparisonPeriods[0]] || []).find((s: { operateurCode: string }) => s.operateurCode === op.code.toUpperCase());
                  const prevPeriodData = (periodScores[comparisonPeriods[1]] || []).find((s: { operateurCode: string }) => s.operateurCode === op.code.toUpperCase());
                  const currentScore = currentPeriodData?.scoreGlobal || 0;
                  const prevScore = prevPeriodData?.scoreGlobal || 0;
                  const diff = currentScore - prevScore;
                  return (
                    <tr key={op.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-2">
                          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: op.color }} />
                          <span className="font-medium text-slate-200">{op.name}</span>
                        </div>
                      </td>
                      <td className="text-center py-2 px-2 font-bold text-slate-200">{currentScore}</td>
                      <td className="text-center py-2 px-2 text-slate-400">{prevScore}</td>
                      <td className="text-center py-2 px-2">
                        <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${diff > 0 ? 'text-emerald-400' : diff < 0 ? 'text-red-400' : 'text-slate-500'}`}>
                          {diff > 0 ? '+' : ''}{diff}
                          {diff > 0 ? <TrendingUp className="h-3 w-3" /> : diff < 0 ? <TrendingDown className="h-3 w-3" /> : null}
                        </span>
                      </td>
                      <td className="text-center py-2 px-2 text-slate-300">{currentPeriodData?.scoreCouverture || '-'}</td>
                      <td className="text-center py-2 px-2 text-slate-300">{currentPeriodData?.scoreQoS || '-'}</td>
                      <td className="text-center py-2 px-2 text-slate-300">{currentPeriodData?.scoreQoE || '-'}</td>
                      <td className="text-center py-2 px-2 text-slate-300">{currentPeriodData?.scoreConformite || '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Detailed Comparison Table ── */}
      <div className="institutional-card guinea-stripe-top">
        <h2 className="text-xs font-semibold text-[#D4A843] uppercase tracking-widest mb-4 flex items-center gap-2">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#CE1126]" />
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#FCD116]" />
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#009460]" />
          Tableau Comparatif Détaillé
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 px-3 text-[#D4A843]/80 font-semibold">Opérateur</th>
                <th className="text-center py-3 px-2 text-[#D4A843]/80 font-semibold">Rang</th>
                <th className="text-center py-3 px-2 text-[#D4A843]/80 font-semibold">Score</th>
                <th className="text-center py-3 px-2 text-[#D4A843]/80 font-semibold">Couverture</th>
                <th className="text-center py-3 px-2 text-[#D4A843]/80 font-semibold">QoS</th>
                <th className="text-center py-3 px-2 text-[#D4A843]/80 font-semibold">QoE</th>
                <th className="text-center py-3 px-2 text-[#D4A843]/80 font-semibold">Conformité</th>
                <th className="text-center py-3 px-2 text-[#D4A843]/80 font-semibold">Innovation</th>
                <th className="text-center py-3 px-2 text-[#D4A843]/80 font-semibold">Investissement</th>
                <th className="text-center py-3 px-2 text-[#D4A843]/80 font-semibold">Tendance</th>
              </tr>
            </thead>
            <tbody>
              {[...operators].sort((a, b) => b.score - a.score).map((op, idx) => (
                <tr key={op.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="py-3 px-3"><div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full" style={{ backgroundColor: op.color }} /><span className="font-medium text-slate-200">{op.name}</span></div></td>
                  <td className="text-center py-3 px-2"><span className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-[10px] font-bold ${idx === 0 ? 'bg-[#D4A843]/20 text-[#D4A843]' : 'bg-white/10 text-slate-400'}`}>{idx + 1}</span></td>
                  <td className="text-center py-3 px-2 font-bold text-slate-200">{op.score}/100</td>
                  <td className="text-center py-3 px-2 text-slate-300">{op.subscores.couverture}</td>
                  <td className="text-center py-3 px-2 text-slate-300">{op.subscores.qos}</td>
                  <td className="text-center py-3 px-2 text-slate-300">{op.subscores.qoe}</td>
                  <td className="text-center py-3 px-2 text-slate-300">{op.subscores.conformite}</td>
                  <td className="text-center py-3 px-2 text-slate-300">{op.subscores.innovation}</td>
                  <td className="text-center py-3 px-2 text-slate-300">{op.subscores.investissement}</td>
                  <td className="text-center py-3 px-2"><span className={`flex items-center justify-center gap-0.5 ${op.trend > 0 ? 'text-emerald-400' : 'text-red-400'}`}>{op.trend > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}{op.trend > 0 ? '+' : ''}{op.trend}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
