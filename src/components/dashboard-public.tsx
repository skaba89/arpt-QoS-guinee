'use client';

import { useState, useEffect } from 'react';
import { Globe, Signal, Activity, Users, Wifi, FileText, AlertCircle, ChevronDown, ChevronUp, Send, Loader2, Download, LogIn, MapPin, Phone, Mail, ExternalLink, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { GuineaMapLeaflet } from './guinea-map-leaflet';
import { cntRegions as cntRegionDefs } from '@/lib/guinea-geojson-cnt';
import { toast } from 'sonner';

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
  const [submitting, setSubmitting] = useState(false);
  const [mapData, setMapData] = useState<{ regions: MapRegionData[]; measurementPoints: MapPointData[]; operators: MapOperatorData[] } | null>(null);
  const [operators, setOperators] = useState<OperatorScore[]>([]);
  const [reports, setReports] = useState<ReportData[]>([]);
  const [kpis, setKpis] = useState({ coverage: 0, qos: 0, pop: 0, zones: 0 });

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
            coverage: d.kpis?.couvertureNationale?.value ?? 0,
            qos: d.kpis?.scoreQosGlobal?.value ?? 0,
            pop: d.kpis?.populationCouverte?.value ?? 0,
            zones: d.kpis?.zonesBlanches?.value ?? 0,
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
          setReports(rd.data?.filter((r: ReportData) => r.isPublic) || []);
        }
      } catch (err) {
        console.error('Public fetch error:', err);
      }
    }
    fetchData();
  }, []);

  const handleSubmitProblem = async () => {
    if (!problemForm.name || !problemForm.description) {
      toast.error('Veuillez remplir votre nom et la description du problème');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'SIGNALEMENT_PUBLIC',
          severity: 'MOYENNE',
          message: `Signalement de ${problemForm.name}: ${problemForm.description}`,
          details: JSON.stringify({
            name: problemForm.name,
            phone: problemForm.phone,
            operatorCode: problemForm.operator,
            regionCode: problemForm.region,
          }),
          operatorCode: problemForm.operator || undefined,
          regionCode: problemForm.region || undefined,
        }),
      });
      if (res.ok) {
        toast.success('Votre signalement a été envoyé avec succès. Merci pour votre contribution!');
        setProblemForm({ name: '', phone: '', operator: '', region: '', description: '' });
      } else {
        const data = await res.json();
        toast.error(data.error || 'Erreur lors de l\'envoi du signalement');
      }
    } catch {
      toast.error('Erreur de connexion au serveur. Réessayez.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-10 pb-0">
      {/* ═══════════════════════════════════════════════
          HERO BANNER — Dramatic Institutional Header
          ═══════════════════════════════════════════════ */}
      <div className="relative overflow-hidden rounded-2xl border border-border">
        {/* Guinea tricolor stripe at top */}
        <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl overflow-hidden z-10" style={{ background: 'linear-gradient(to right, #E32119 0%, #E32119 33.333%, #FFD100 33.333%, #FFD100 66.666%, #00853F 66.666%, #00853F 100%)' }} />

        {/* Decorative blurs — more dramatic */}
        <div className="absolute top-0 right-0 h-80 w-80 rounded-full bg-primary/[0.04] blur-3xl" />
        <div className="absolute bottom-0 left-0 h-60 w-60 rounded-full bg-[#00853F]/[0.04] blur-3xl" />
        <div className="absolute top-1/2 left-1/4 h-48 w-48 rounded-full bg-[#E32119]/[0.02] blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-40 w-40 rounded-full bg-[#FFD100]/[0.03] blur-3xl" />

        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 40px, rgba(255,255,255,1) 40px, rgba(255,255,255,1) 41px)' }} />

        <div className="relative z-10 text-center px-8 pt-14 pb-12 md:pt-20 md:pb-16">
          {/* ARPT Crest */}
          <div className="mx-auto mb-7">
            <div className="official-seal mx-auto">
              <Image
                src="/arpt-crest.png"
                alt="Blason officiel de l'ARPT Guinée"
                width={48}
                height={48}
                className="h-12 w-12 object-contain"
              />
            </div>
          </div>

          {/* "RÉPUBLIQUE DE GUINÉE" — small uppercase gold */}
          <p className="text-[11px] font-semibold tracking-[0.25em] uppercase text-primary/70 mb-4">
            République de Guinée
          </p>

          {/* Main title — larger, bolder */}
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-3 tracking-tight leading-[1.1]">
            Observatoire National
            <span className="block mt-1">des Télécommunications</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-primary/80 font-medium mb-5">
            Autorité de Régulation des Postes et Télécommunications
          </p>

          {/* Three Guinea flag color dots */}
          <div className="flex items-center justify-center gap-2.5 mb-6">
            <span className="h-2 w-2 rounded-full bg-[#E32119]" />
            <span className="h-2 w-2 rounded-full bg-[#FFD100]" />
            <span className="h-2 w-2 rounded-full bg-[#00853F]" />
          </div>

          {/* Government badge */}
          <div className="flex justify-center mb-6">
            <span className="government-badge text-[10px]">
              Portail de Transparence — Données Publiques
            </span>
          </div>

          {/* Description */}
          <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-8">
            Ce portail garantit la transparence et l&apos;accès public aux données sur la qualité de service,
            la couverture réseau et les performances des opérateurs de télécommunications en République de Guinée,
            conformément aux engagements de l&apos;ARPT envers les citoyens.
          </p>

          {/* Connexion Agent button */}
          <button
            onClick={() => toast.info('Veuillez vous connecter via le menu')}
            className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl border border-primary/25 bg-primary/8 text-primary text-sm font-semibold hover:bg-primary/15 hover:border-primary/40 transition-all duration-400 shadow-lg shadow-primary/5"
          >
            <LogIn className="h-4 w-4" />
            Connexion Agent
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════
          KPI CARDS — Key Performance Indicators
          ═══════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: 'Couverture Nationale', value: `${kpis.coverage}%`, icon: Signal, color: '#00853F', accent: 'bg-[#00853F]/8 border-[#00853F]/15' },
          { label: 'Score Qualité Global', value: `${kpis.qos}/100`, icon: Activity, color: '#D4A843', accent: 'bg-primary/8 border-primary/15' },
          { label: 'Population Couverte', value: `${kpis.pop}M`, icon: Users, color: '#D4A843', accent: 'bg-primary/8 border-primary/15' },
          { label: 'Zones Blanches', value: `${kpis.zones}`, icon: Wifi, color: '#E32119', accent: 'bg-[#E32119]/8 border-[#E32119]/15' },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="institutional-card guinea-stripe-top text-center hover:-translate-y-1 transition-all duration-400"
          >
            <div className={`inline-flex p-3.5 rounded-xl ${kpi.accent} mb-4`}>
              <kpi.icon className="h-7 w-7" style={{ color: kpi.color }} />
            </div>
            <p className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">{kpi.value}</p>
            <p className="text-[11px] text-muted-foreground mt-2.5 font-medium uppercase tracking-[0.06em]">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════
          MAP & OPERATORS SECTION
          ═══════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Map */}
        <div className="institutional-card guinea-stripe-top">
          <h2 className="section-title flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            Couverture par Région
          </h2>
          <GuineaMapLeaflet metric="coverage" regionData={mapData?.regions || []} measurementPoints={mapData?.measurementPoints || []} operators={mapData?.operators || []} useCNTDecoupage={true} />
        </div>

        {/* Operator Comparison */}
        <div className="institutional-card guinea-stripe-top">
          <h2 className="section-title flex items-center gap-2">
            <Globe className="h-4 w-4 text-primary" />
            Comparaison Opérateurs
          </h2>
          <div className="space-y-4 max-h-[480px] overflow-y-auto custom-scrollbar pr-1">
            {operators.length === 0 && (
              <div className="text-center py-10 text-muted-foreground text-sm">
                Chargement des données opérateurs…
              </div>
            )}
            {operators.map((op) => (
              <div
                key={op.id}
                className="p-5 rounded-xl bg-muted/50 border border-border hover:bg-muted transition-all duration-400"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span
                      className="h-4 w-4 rounded-full ring-2 ring-white/10"
                      style={{ backgroundColor: op.color }}
                    />
                    <span className="text-sm font-semibold text-foreground">{op.name}</span>
                  </div>
                  <span className="text-2xl font-bold text-foreground">{op.score}<span className="text-sm font-normal text-muted-foreground">/100</span></span>
                </div>
                <div className="h-2.5 bg-accent rounded-full overflow-hidden mb-4">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${op.score}%`, backgroundColor: op.color }}
                  />
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: 'Couv.', val: op.subscores.couverture, color: '#00853F' },
                    { label: 'QoS', val: op.subscores.qos, color: '#D4A843' },
                    { label: 'QoE', val: op.subscores.qoe, color: '#3B82F6' },
                    { label: 'Conf.', val: op.subscores.conformite, color: '#E32119' },
                  ].map((sub) => (
                    <div key={sub.label} className="text-center">
                      <div className="relative h-1.5 bg-accent rounded-full overflow-hidden mb-2">
                        <div
                          className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                          style={{ width: `${sub.val}%`, backgroundColor: sub.color }}
                        />
                      </div>
                      <p className="text-xs font-semibold text-foreground">{sub.val}</p>
                      <p className="text-[9px] text-muted-foreground uppercase tracking-[0.08em]">{sub.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════
          REPORTS SECTION
          ═══════════════════════════════════════════════ */}
      <div className="institutional-card guinea-stripe-top">
        <h2 className="section-title flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          Derniers Rapports Publics
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {reports.length === 0 && (
            <div className="col-span-full text-center py-8 text-muted-foreground text-sm">
              Aucun rapport public disponible pour le moment.
            </div>
          )}
          {reports.slice(0, 6).map((report) => (
            <div
              key={report.id}
              className="p-5 rounded-xl bg-muted/50 border border-border hover:bg-muted hover:border-primary/15 transition-all duration-400 cursor-pointer group"
            >
              <div className="flex items-start gap-3">
                <div className="p-3 rounded-xl bg-[#E32119]/8 border border-[#E32119]/15 flex-shrink-0">
                  <FileText className="h-4 w-4 text-[#E32119]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">
                    {report.titre}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {report.type} &bull; {report.date}
                  </p>
                  <div className="flex items-center gap-2 mt-2.5">
                    <span className="government-badge text-[9px] py-0 px-1.5">
                      Rapport Public
                    </span>
                    <span className="text-[10px] text-muted-foreground">{report.format}</span>
                  </div>
                </div>
                <Download className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 mt-1" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════
          PROBLEM REPORTING FORM & FAQ
          ═══════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Problem Reporting Form */}
        <div className="institutional-card guinea-stripe-top">
          <h2 className="section-title flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-primary" />
            Signaler un Problème
          </h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] text-muted-foreground font-semibold mb-2 block uppercase tracking-[0.06em]">Nom complet *</label>
                <input
                  type="text"
                  value={problemForm.name}
                  onChange={(e) => setProblemForm({ ...problemForm, name: e.target.value })}
                  className="institutional-input"
                  placeholder="Votre nom"
                />
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground font-semibold mb-2 block uppercase tracking-[0.06em]">Téléphone</label>
                <input
                  type="text"
                  value={problemForm.phone}
                  onChange={(e) => setProblemForm({ ...problemForm, phone: e.target.value })}
                  className="institutional-input"
                  placeholder="+224 xxx xxxx"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] text-muted-foreground font-semibold mb-2 block uppercase tracking-[0.06em]">Opérateur</label>
                <select
                  value={problemForm.operator}
                  onChange={(e) => setProblemForm({ ...problemForm, operator: e.target.value })}
                  className="institutional-input"
                >
                  <option value="">Sélectionner</option>
                  {operators.map((op) => (
                    <option key={op.id} value={op.code}>{op.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground font-semibold mb-2 block uppercase tracking-[0.06em]">Région (CNT)</label>
                <select
                  value={problemForm.region}
                  onChange={(e) => setProblemForm({ ...problemForm, region: e.target.value })}
                  className="institutional-input"
                >
                  <option value="">Sélectionner</option>
                  {cntRegionDefs.map((r) => (
                    <option key={r.code} value={r.code}>{r.nom}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground font-semibold mb-2 block uppercase tracking-[0.06em]">Description du problème *</label>
              <textarea
                value={problemForm.description}
                onChange={(e) => setProblemForm({ ...problemForm, description: e.target.value })}
                rows={3}
                className="institutional-input resize-none"
                placeholder="Décrivez le problème rencontré…"
              />
            </div>
            <button
              onClick={handleSubmitProblem}
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2.5 px-4 py-3.5 rounded-xl bg-gradient-to-r from-primary to-[#B8922E] text-sm font-semibold text-[#080C1A] hover:from-[#E0B84E] hover:to-primary transition-all duration-400 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/8 hover:shadow-primary/15"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Envoi en cours…
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Envoyer le Signalement
                </>
              )}
            </button>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="institutional-card guinea-stripe-top">
          <h2 className="section-title">Questions Fréquentes</h2>
          <div className="space-y-2.5 max-h-[520px] overflow-y-auto custom-scrollbar pr-1">
            {faqData.map((faq, i) => (
              <div
                key={i}
                className={`rounded-xl border transition-all duration-400 ${
                  expandedFaq === i
                    ? 'bg-muted border-primary/15'
                    : 'bg-muted/50 border-border hover:bg-muted hover:border-border'
                }`}
              >
                <button
                  onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-4 text-left"
                >
                  <span className="text-sm font-medium text-foreground pr-4">{faq.q}</span>
                  <span className={`flex-shrink-0 p-1 rounded-md transition-colors duration-300 ${
                    expandedFaq === i ? 'bg-primary/15 text-primary' : 'text-muted-foreground'
                  }`}>
                    {expandedFaq === i ? (
                      <ChevronUp className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5" />
                    )}
                  </span>
                </button>
                {expandedFaq === i && (
                  <div className="px-4 pb-4">
                    <div className="pl-0 border-l-2 border-primary/25 ml-0">
                      <p className="text-sm text-muted-foreground leading-relaxed pl-4">{faq.a}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════
          INSTITUTIONAL FOOTER
          ═══════════════════════════════════════════════ */}
      <footer className="institutional-footer rounded-2xl overflow-hidden">
        <div className="px-8 py-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {/* Left: ARPT crest + identity */}
            <div className="flex flex-col items-start gap-4">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-full border border-primary/35 bg-primary/8 flex items-center justify-center flex-shrink-0">
                  <Image
                    src="/arpt-crest.png"
                    alt="Blason ARPT"
                    width={24}
                    height={24}
                    className="h-6 w-6 object-contain"
                  />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">ARPT Guinée</p>
                  <p className="text-[10px] text-muted-foreground">Autorité de Régulation des Postes et Télécommunications</p>
                </div>
              </div>
              <div className="flex flex-col gap-2 mt-1">
                <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3 text-primary/50" />
                  Conakry, République de Guinée
                </div>
                <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                  <Phone className="h-3 w-3 text-primary/50" />
                  +224 xxx xxxx
                </div>
                <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                  <Mail className="h-3 w-3 text-primary/50" />
                  contact@arpt.gn
                </div>
              </div>
            </div>

            {/* Center: Navigation links */}
            <div className="flex flex-col items-start md:items-center gap-3">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.12em]">Navigation</p>
              <div className="flex flex-col gap-2.5">
                {[
                  { label: 'Accueil', href: '#' },
                  { label: 'Qualité de Service', href: '#' },
                  { label: 'Opérateurs', href: '#' },
                  { label: 'Contact', href: '#' },
                ].map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors group"
                  >
                    <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    {link.label}
                  </a>
                ))}
              </div>
            </div>

            {/* Right: Republic + motto */}
            <div className="flex flex-col items-start md:items-end gap-3">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#E32119]" />
                <span className="h-1.5 w-1.5 rounded-full bg-[#FFD100]" />
                <span className="h-1.5 w-1.5 rounded-full bg-[#00853F]" />
              </div>
              <p className="text-sm font-semibold text-foreground">République de Guinée</p>
              <p className="text-xs text-primary/70 italic tracking-wide">
                Travail — Justice — Solidarité
              </p>
              <div className="mt-2 px-4 py-2 rounded-lg bg-muted/50 border border-border">
                <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
                  Données mises à jour en temps réel<br />
                  Conformément aux spécifications techniques ARPT
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-border px-8 py-4">
          <p className="text-[11px] text-muted-foreground text-center">
            &copy; 2026 ARPT — Tous droits réservés
          </p>
        </div>

        {/* Guinea tricolor bottom line */}
        <div className="h-[3px]" style={{ background: 'linear-gradient(to right, #E32119 0%, #E32119 33.333%, #FFD100 33.333%, #FFD100 66.666%, #00853F 66.666%, #00853F 100%)' }} />
      </footer>
    </div>
  );
}
