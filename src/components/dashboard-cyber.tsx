'use client';

import { Shield, Lock, Key, Eye, Server, CheckCircle2, AlertTriangle, FileKey, Fingerprint, Database, Globe } from 'lucide-react';
import { CircularGauge } from './mini-chart';
import { securityData, auditLog } from '@/lib/mock-data';

export function DashboardCyber() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-50">Cybersécurité</h1>
          <p className="text-sm text-slate-400 mt-1">Centre de sécurité et conformité réglementaire</p>
        </div>
        <div className="flex items-center gap-2">
          {securityData.activeThreats > 0 ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-xs text-amber-400 font-medium">{securityData.activeThreats} alerte</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-xs text-emerald-400 font-medium">Sécurisé</span>
            </div>
          )}
        </div>
      </div>

      {/* Security Score + Key Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Security Score */}
        <div className="relative overflow-hidden rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 p-5 flex flex-col items-center justify-center">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#D4A843]" />
          <h3 className="text-sm font-semibold text-slate-300 mb-3">Score de Sécurité</h3>
          <CircularGauge value={securityData.overallScore} color="#D4A843" size={130} strokeWidth={10} label="/100" />
          <p className="text-xs text-emerald-400 mt-2 font-medium">Excellent</p>
        </div>

        {/* RBAC Status */}
        <div className="relative overflow-hidden rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 p-5">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#3B82F6]" />
          <div className="flex items-center gap-2 mb-3">
            <Key className="h-4 w-4 text-[#3B82F6]" />
            <h3 className="text-sm font-semibold text-slate-300">Contrôle d&apos;Accès RBAC</h3>
          </div>
          <div className="space-y-2">
            {[
              { role: 'DG ARPT', count: 1, level: 'Accès complet' },
              { role: 'Analyste QoS', count: 4, level: 'Lecture + Export' },
              { role: 'Inspecteur', count: 6, level: 'Audit + Rapports' },
              { role: 'Administrateur', count: 2, level: 'Gestion système' },
            ].map((item) => (
              <div key={item.role} className="flex items-center justify-between p-2 rounded bg-white/5">
                <div>
                  <p className="text-xs font-medium text-slate-200">{item.role}</p>
                  <p className="text-[10px] text-slate-500">{item.level}</p>
                </div>
                <span className="text-xs text-slate-400 font-mono">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Encryption & Compliance */}
        <div className="relative overflow-hidden rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 p-5">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#10B981]" />
          <div className="flex items-center gap-2 mb-3">
            <Lock className="h-4 w-4 text-[#10B981]" />
            <h3 className="text-sm font-semibold text-slate-300">Chiffrement</h3>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Données en transit', status: 'TLS 1.3', ok: true, icon: Globe },
              { label: 'Données au repos', status: 'AES-256', ok: true, icon: Database },
              { label: 'Authentification', status: '2FA activé', ok: true, icon: Fingerprint },
              { label: 'Certificats SSL', status: 'Valide', ok: true, icon: FileKey },
              { label: 'Résidence données', status: 'Guinée', ok: true, icon: Server },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <item.icon className="h-3.5 w-3.5 text-slate-500" />
                  <span className="text-xs text-slate-400">{item.label}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-300">{item.status}</span>
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Compliance */}
        <div className="relative overflow-hidden rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 p-5">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#F59E0B]" />
          <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
            <Shield className="h-4 w-4 text-[#F59E0B]" />
            Conformité
          </h3>
          <div className="flex items-center justify-center mb-3">
            <CircularGauge value={securityData.complianceScore} color="#F59E0B" size={80} strokeWidth={6} label="/100" />
          </div>
          <div className="space-y-2">
            {[
              { label: 'SOA Guinée', status: 'Conforme', ok: true },
              { label: 'ISO 27001', status: 'En cours', ok: false },
              { label: 'RGPD', status: 'Conforme', ok: true },
              { label: 'UIT X.805', status: 'Conforme', ok: true },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between text-xs">
                <span className="text-slate-400">{item.label}</span>
                <span className={item.ok ? 'text-emerald-400' : 'text-amber-400'}>{item.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Active Threats + Audit Log */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Threats */}
        <div className="relative overflow-hidden rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 p-5">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#EF4444] to-transparent opacity-60" />
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            Alertes de Sécurité
          </h2>
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-amber-300">Tentative d&apos;accès non autorisé</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">IP: 185.xx.xx.xx - Région: Conakry</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Il y a 2h • Bloqué automatiquement</p>
                </div>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
              <div className="flex items-start gap-2">
                <Eye className="h-4 w-4 text-blue-400 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-blue-300">Scan de vulnérabilité planifié</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Planifié: ce soir 22h00</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Automatique • Mensuel</p>
                </div>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-emerald-300">Certificat SSL renouvelé</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Tous les certificats à jour</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Il y a 5h • Automatique</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Audit Log */}
        <div className="relative overflow-hidden rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 p-5">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#D4A843] to-transparent opacity-60" />
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">Journal d&apos;Audit</h2>
          <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar pr-1">
            {auditLog.map((entry) => (
              <div key={entry.id} className="flex items-start gap-3 p-2.5 rounded-lg bg-white/5 border border-white/5">
                <div className="mt-0.5 h-2 w-2 rounded-full bg-[#D4A843] flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-medium text-slate-200">{entry.user}</span>
                    <span className="text-[10px] text-slate-500">→</span>
                    <span className="text-xs text-slate-400">{entry.action}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-slate-500">{entry.target}</span>
                    <span className="text-[10px] text-slate-600">•</span>
                    <span className="text-[10px] text-slate-500">{entry.time}</span>
                    <span className="text-[10px] text-slate-600">•</span>
                    <span className="text-[10px] text-slate-600 font-mono">{entry.ip}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Security Summary Bar */}
      <div className="relative overflow-hidden rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 p-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-6 text-xs">
            <div className="flex items-center gap-2">
              <Lock className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-slate-400">Chiffrement:</span>
              <span className="text-emerald-400 font-medium">{securityData.encryptionStatus}</span>
            </div>
            <div className="flex items-center gap-2">
              <Key className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-slate-400">2FA:</span>
              <span className="text-emerald-400 font-medium">{securityData.twoFactorEnabled ? 'Activé' : 'Désactivé'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Server className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-slate-400">Résidence:</span>
              <span className="text-emerald-400 font-medium">{securityData.dataResidency}</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-slate-400">Dernier audit:</span>
              <span className="text-slate-300">{securityData.lastAudit}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
