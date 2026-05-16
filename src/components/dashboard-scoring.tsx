'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Award, BarChart3, Lightbulb, ChevronRight } from 'lucide-react';
import { CircularGauge, RadarChart, Sparkline } from './mini-chart';

interface OperatorScoreData {
  id: string; name: string; code: string; color: string; score: number; trend: number;
  subscores: { couverture: number; qos: number; qoe: number; conformite: number; innovation: number; investissement: number };
  historicalScores: number[];
  recommendations: { periode: string; text: string }[];
}

const recommendations = [
  { priority: 'high', text: 'Celcom doit améliorer la couverture en zone rurale - objectif +15% en 6 mois', operator: 'Celcom' },
  { priority: 'high', text: 'MTN : réduire la latence dans la région de Boké sous le seuil de 50ms', operator: 'MTN' },
  { priority: 'medium', text: "Renforcer l'investissement en infrastructure 4G pour tous les opérateurs", operator: 'Multi' },
  { priority: 'low', text: 'Envisager des partenariats pour le partage de pylônes en zones blanches', operator: 'Multi' },
];

export function DashboardScoring() {
  const [data, setData] = useState<{ operators: OperatorScoreData[]; radarData: { label: string; values: number[] }[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/scoring');
        if (res.ok) setData(await res.json());
      } catch (err) {
        console.error('Scoring fetch error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-xs text-slate-500 animate-pulse">Chargement scoring...</div></div>;

  const operators = data?.operators || [];
  const radarData = data?.radarData || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-slate-50">Scoring Opérateurs</h1><p className="text-sm text-slate-400 mt-1">Évaluation multi-critères et classement des opérateurs de télécommunications</p></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {operators.map((op) => (
          <div key={op.id} className="relative overflow-hidden rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 p-6 transition-all duration-300 hover:bg-white/[0.08] hover:border-white/20">
            <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: op.color }} />
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="relative overflow-hidden rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 p-5">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#D4A843] to-transparent opacity-60" />
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2"><Award className="h-4 w-4 text-[#D4A843]" />Comparaison Radar</h2>
          <div className="flex justify-center"><RadarChart data={radarData} series={operators.map((op) => ({ name: op.name, color: op.color }))} size={240} /></div>
          <div className="flex justify-center gap-4 mt-3">
            {operators.map((op) => (<span key={op.id} className="flex items-center gap-1.5 text-[10px] text-slate-400"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: op.color }} />{op.name.split(' ')[0]}</span>))}
          </div>
        </div>

        <div className="relative overflow-hidden rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 p-5">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#3B82F6] to-transparent opacity-60" />
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2"><BarChart3 className="h-4 w-4 text-[#3B82F6]" />Évolution Historique</h2>
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

        <div className="relative overflow-hidden rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 p-5">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#10B981] to-transparent opacity-60" />
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2"><Lightbulb className="h-4 w-4 text-[#D4A843]" />Recommandations IA</h2>
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

      <div className="relative overflow-hidden rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 p-5">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#D4A843] to-transparent opacity-60" />
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">Tableau Comparatif Détaillé</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 px-3 text-slate-400 font-medium">Opérateur</th>
                <th className="text-center py-3 px-2 text-slate-400 font-medium">Rang</th>
                <th className="text-center py-3 px-2 text-slate-400 font-medium">Score</th>
                <th className="text-center py-3 px-2 text-slate-400 font-medium">Couverture</th>
                <th className="text-center py-3 px-2 text-slate-400 font-medium">QoS</th>
                <th className="text-center py-3 px-2 text-slate-400 font-medium">QoE</th>
                <th className="text-center py-3 px-2 text-slate-400 font-medium">Conformité</th>
                <th className="text-center py-3 px-2 text-slate-400 font-medium">Innovation</th>
                <th className="text-center py-3 px-2 text-slate-400 font-medium">Investissement</th>
                <th className="text-center py-3 px-2 text-slate-400 font-medium">Tendance</th>
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
