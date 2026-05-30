'use client';

import { useState, useEffect } from 'react';
import { Shield, Lock, Key, Eye, Server, CheckCircle2, AlertTriangle, FileKey, Fingerprint, Database, Globe, XCircle, Loader2 } from 'lucide-react';
import { CircularGauge } from './mini-chart';
import { useAuthGuard } from '@/hooks/use-auth-guard';

interface AuditLogEntry { id: string; user: string; action: string; resource: string; details: string | null; ipAddress: string | null; time: string }

interface SecurityStats {
  overallScore: number;
  complianceScore: number;
  activeThreats: number;
  unresolvedCritical: number;
  unresolvedHigh: number;
  twoFactorEnabled: boolean;
  encryptionStatus: string;
  dataResidency: string;
}

export function DashboardCyber() {
  const { isAuthorized, isLoading: authLoading, session } = useAuthGuard('SUPER_ADMIN');
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [securityStats, setSecurityStats] = useState<SecurityStats>({
    overallScore: 0,
    complianceScore: 0,
    activeThreats: 0,
    unresolvedCritical: 0,
    unresolvedHigh: 0,
    twoFactorEnabled: false,
    encryptionStatus: 'Chiffrement AES-256 actif',
    dataResidency: 'Guinée - Conformité SOA',
  });
  const [failedLogins, setFailedLogins] = useState(0);
  const [loading, setLoading] = useState(true);

  const userRole = (session?.user as Record<string, unknown>)?.role as string;
  const isAdmin = isAuthorized;

  useEffect(() => {
    async function fetchData() {
      try {
        if (isAdmin) {
          const [logsRes, statsRes] = await Promise.all([
            fetch('/api/audit-logs'),
            fetch('/api/admin/stats'),
          ]);
          if (logsRes.ok) {
            const data = await logsRes.json();
            setAuditLogs((data.logs || []).map((l: AuditLogEntry & { time: string | Date }) => ({
              ...l,
              time: typeof l.time === 'string' ? l.time : new Date(l.time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            })));
          }
          if (statsRes.ok) {
            const data = await statsRes.json();
            setSecurityStats(data.security);
            setFailedLogins(data.activity?.failedLoginCount || 0);
          }
        }
      } catch (err) {
        console.error('Cyber fetch error:', err);
      } finally {
        setLoading(false);
      }
    }
    if (session) fetchData();
  }, [session, isAdmin]);

  // Determine security status label
  const securityLabel = securityStats.overallScore >= 90 ? 'Excellent'
    : securityStats.overallScore >= 75 ? 'Bon'
    : securityStats.overallScore >= 60 ? 'Acceptable'
    : securityStats.overallScore >= 40 ? 'Insuffisant'
    : 'Critique';

  const securityColor = securityStats.overallScore >= 90 ? 'text-emerald-400'
    : securityStats.overallScore >= 75 ? 'text-[#D4A843]'
    : securityStats.overallScore >= 60 ? 'text-blue-400'
    : securityStats.overallScore >= 40 ? 'text-amber-400'
    : 'text-red-400';

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Lock className="h-12 w-12 text-red-400" />
        <h3 className="text-lg font-semibold text-foreground">Accès non autorisé</h3>
        <p className="text-muted-foreground text-sm">Vous n'avez pas les permissions nécessaires pour accéder à cette section.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ─── Page Header — Institutional Pattern ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="h-1 w-8 rounded-full bg-gradient-to-r from-primary to-transparent" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-primary/70">Administration</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">Cybersécurité</h1>
          <p className="text-sm text-muted-foreground mt-2">Centre de sécurité et conformité réglementaire</p>
        </div>
        <div className="flex items-center gap-2">
          {securityStats.activeThreats > 0 ? (
            <div className="government-badge border-amber-500/25 bg-amber-500/[0.08] text-amber-400"><AlertTriangle className="h-3 w-3" /><span className="text-xs font-medium">{securityStats.activeThreats} alerte{securityStats.activeThreats > 1 ? 's' : ''}</span></div>
          ) : (
            <div className="government-badge border-emerald-500/25 bg-emerald-500/[0.08] text-emerald-400"><CheckCircle2 className="h-3 w-3" /><span className="text-xs font-medium">Sécurisé</span></div>
          )}
        </div>
      </div>

      {/* ─── Security Score + RBAC + Encryption + Compliance ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Security Score Gauge */}
        <div className="guinea-stripe-top institutional-card flex flex-col items-center justify-center !p-6">
          <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">Score de Sécurité</h3>
          <CircularGauge value={securityStats.overallScore} color="#D4A843" size={130} strokeWidth={10} label="/100" />
          <p className={`text-xs mt-2 font-medium ${securityColor}`}>{securityLabel}</p>
        </div>

        {/* RBAC Section */}
        <div className="guinea-stripe-top institutional-card">
          <div className="flex items-center gap-2 mb-3"><Key className="h-4 w-4 text-[#3B82F6]" /><h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">Contrôle d&apos;Accès RBAC</h3></div>
          <div className="space-y-2">
            {[
              { role: 'Super Admin', count: securityStats.unresolvedCritical > 0 ? 1 : 0, level: 'Accès complet' },
              { role: 'DG / DGA', count: 2, level: 'Vue stratégique' },
              { role: 'Technique', count: 3, level: 'Gestion technique' },
              { role: 'Analyste', count: 4, level: 'Lecture + Export' },
            ].map((item) => (
              <div key={item.role} className="flex items-center justify-between p-2 rounded-lg bg-muted border border-border"><div><p className="text-xs font-medium text-foreground">{item.role}</p><p className="text-[10px] text-muted-foreground">{item.level}</p></div><span className="text-xs text-muted-foreground font-mono">{item.count}</span></div>
            ))}
          </div>
        </div>

        {/* Encryption Section */}
        <div className="guinea-stripe-top institutional-card">
          <div className="flex items-center gap-2 mb-3"><Lock className="h-4 w-4 text-[#10B981]" /><h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">Chiffrement</h3></div>
          <div className="space-y-3">
            {[
              { label: 'Données en transit', status: 'TLS 1.3', ok: true, icon: Globe },
              { label: 'Données au repos', status: 'AES-256', ok: true, icon: Database },
              { label: 'Authentification', status: securityStats.twoFactorEnabled ? '2FA activé' : '2FA non activé', ok: securityStats.twoFactorEnabled, icon: Fingerprint },
              { label: 'Certificats SSL', status: 'Valide', ok: true, icon: FileKey },
              { label: 'Résidence données', status: 'Guinée', ok: true, icon: Server },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2"><item.icon className="h-3.5 w-3.5 text-muted-foreground" /><span className="text-xs text-muted-foreground">{item.label}</span></div>
                <div className="flex items-center gap-1.5"><span className="text-xs text-foreground">{item.status}</span>{item.ok ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : <XCircle className="h-3.5 w-3.5 text-amber-400" />}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Compliance Section — green stripe accent */}
        <div className="institutional-card relative overflow-hidden">
          {/* Green stripe accent instead of tricolor for compliance */}
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#009460]" style={{ zIndex: 1 }} />
          <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3 flex items-center gap-2"><Shield className="h-4 w-4 text-[#F59E0B]" />Conformité</h3>
          <div className="flex items-center justify-center mb-3"><CircularGauge value={securityStats.complianceScore} color="#F59E0B" size={80} strokeWidth={6} label="/100" /></div>
          <div className="space-y-2">
            {[{ label: 'SOA Guinée', status: securityStats.complianceScore >= 70 ? 'Conforme' : 'Non conforme', ok: securityStats.complianceScore >= 70 }, { label: 'ISO 27001', status: 'En cours', ok: false }, { label: 'RGPD', status: securityStats.complianceScore >= 60 ? 'Conforme' : 'En cours', ok: securityStats.complianceScore >= 60 }, { label: 'UIT X.805', status: securityStats.complianceScore >= 50 ? 'Conforme' : 'En cours', ok: securityStats.complianceScore >= 50 }].map((item) => (
              <div key={item.label} className="flex items-center justify-between text-xs"><span className="text-muted-foreground">{item.label}</span><span className={item.ok ? 'text-emerald-400' : 'text-amber-400'}>{item.status}</span></div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Security Alerts + Audit Log ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Security Alerts */}
        <div className="guinea-stripe-top institutional-card">
          <h2 className="section-title mb-0 pb-0 text-sm">ALERTES DE SÉCURITÉ</h2>
          <div className="space-y-3 mt-4">
            {securityStats.unresolvedCritical > 0 && (
              <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/20">
                <div className="flex items-start gap-2"><AlertTriangle className="h-4 w-4 text-red-400 mt-0.5" /><div><p className="text-xs font-medium text-red-300">{securityStats.unresolvedCritical} alerte(s) critique(s) non résolue(s)</p><p className="text-[10px] text-muted-foreground mt-0.5">Action immédiate requise par l&apos;équipe technique</p></div></div>
              </div>
            )}
            {securityStats.unresolvedHigh > 0 && (
              <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                <div className="flex items-start gap-2"><AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5" /><div><p className="text-xs font-medium text-amber-300">{securityStats.unresolvedHigh} alerte(s) haute(s) non résolue(s)</p><p className="text-[10px] text-muted-foreground mt-0.5">Surveillance continue recommandée</p></div></div>
              </div>
            )}
            {failedLogins > 0 && (
              <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                <div className="flex items-start gap-2"><Eye className="h-4 w-4 text-amber-400 mt-0.5" /><div><p className="text-xs font-medium text-amber-300">{failedLogins} tentative(s) de connexion échouée(s) cette semaine</p><p className="text-[10px] text-muted-foreground mt-0.5">Vérifier les accès non autorisés</p></div></div>
              </div>
            )}
            {securityStats.activeThreats === 0 && failedLogins === 0 && (
              <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                <div className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5" /><div><p className="text-xs font-medium text-emerald-300">Aucune menace active détectée</p><p className="text-[10px] text-muted-foreground mt-0.5">Tous les systèmes fonctionnent normalement</p></div></div>
              </div>
            )}
          </div>
        </div>

        {/* Audit Log */}
        <div className="guinea-stripe-top institutional-card">
          <h2 className="section-title mb-0 pb-0 text-sm">JOURNAL D&apos;AUDIT</h2>
          {loading ? (
            <div className="text-xs text-muted-foreground animate-pulse mt-4">Chargement...</div>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar pr-1 mt-4">
              {auditLogs.map((entry) => (
                <div key={entry.id} className="flex items-start gap-3 p-2.5 rounded-lg bg-muted border border-border">
                  <div className="mt-0.5 h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap"><span className="text-xs font-medium text-foreground">{entry.user}</span><span className="text-[10px] text-muted-foreground">→</span><span className={`text-xs font-medium ${
                      entry.action === 'LOGIN' ? 'text-emerald-400' :
                      entry.action === 'LOGIN_FAILED' ? 'text-red-400' :
                      entry.action === 'CREATE' ? 'text-blue-400' :
                      entry.action === 'UPDATE' ? 'text-amber-400' :
                      entry.action === 'DELETE' ? 'text-red-400' :
                      'text-muted-foreground'
                    }`}>{entry.action}</span></div>
                    <div className="flex items-center gap-2 mt-0.5"><span className="text-[10px] text-muted-foreground">{entry.resource}</span><span className="text-[10px] text-muted-foreground">•</span><span className="text-[10px] text-muted-foreground">{entry.time}</span>{entry.ipAddress && <><span className="text-[10px] text-muted-foreground">•</span><span className="text-[10px] text-muted-foreground font-mono">{entry.ipAddress}</span></>}</div>
                  </div>
                </div>
              ))}
              {auditLogs.length === 0 && (
                <div className="p-4 text-center text-xs text-muted-foreground">Aucune entrée d&apos;audit disponible</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ─── Bottom Status Bar ─── */}
      <div className="guinea-stripe-top institutional-card !p-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-6 text-xs">
            <div className="flex items-center gap-2"><Lock className="h-3.5 w-3.5 text-emerald-400" /><span className="text-muted-foreground">Chiffrement:</span><span className="text-emerald-400 font-medium">{securityStats.encryptionStatus}</span></div>
            <div className="flex items-center gap-2"><Key className="h-3.5 w-3.5 text-amber-400" /><span className="text-muted-foreground">2FA:</span><span className={securityStats.twoFactorEnabled ? 'text-emerald-400' : 'text-amber-400'}>{securityStats.twoFactorEnabled ? 'Activé' : 'Non activé'}</span></div>
            <div className="flex items-center gap-2"><Server className="h-3.5 w-3.5 text-emerald-400" /><span className="text-muted-foreground">Résidence:</span><span className="text-emerald-400 font-medium">{securityStats.dataResidency}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
